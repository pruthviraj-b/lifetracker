import { Achievements } from './Achievements';
import { Academy } from './Academy';
import { HabitCreation } from './HabitCreation';
import { KnowledgeBase } from './KnowledgeBase';
import { Library } from './Library';
import { Metrics, MetricsExporter } from './Metrics';
import { Network } from './Network';
import { ProtocolCreation } from './ProtocolCreation';
import { Recall } from './Recall';
import { ReminderCreation } from './ReminderCreation';
import { Schedule } from './Schedule';
import { SettingsChat } from './SettingsChat';
import { TaskCreation } from './TaskCreation';
import { ActionResult, AssistantContext, ChatAction, ChatHandler, ChatMessage, TargetMatch } from './chatTypes';
import {
    ActionType,
    DetectedIntent,
    EMOJI,
    FlowField,
    detectIntent,
    formatHeader,
    normalizeText,
    parseYesNo
} from './chatUtils';

type PendingStage = 'collect' | 'confirm' | 'edit-field' | 'edit-value' | 'resolve-target';

export interface PendingFlow {
    action: ActionType;
    entity: string;
    stage: PendingStage;
    data: Record<string, any>;
    fields?: FlowField[];
    fieldIndex?: number;
    target?: TargetMatch | null;
    editFieldKey?: string;
}

export interface ChatSessionState {
    pending?: PendingFlow | null;
    lastEntity?: { type: string; id?: string; name?: string; data?: any };
    lastDeleted?: { type: string; data: any };
}

const HANDLERS: Record<string, ChatHandler> = {
    habit: HabitCreation,
    reminder: ReminderCreation,
    task: TaskCreation,
    protocol: ProtocolCreation,
    knowledge: KnowledgeBase,
    schedule: Schedule,
    academy: Academy,
    recall: Recall,
    metrics: Metrics,
    library: Library,
    network: Network,
    achievement: Achievements,
    settings: SettingsChat
};

const buildAction = (label: string, value: string, kind: ChatAction['kind'] = 'reply', variant: ChatAction['variant'] = 'secondary'): ChatAction => ({
    id: `${normalizeText(label)}-${Math.random().toString(16).slice(2)}`,
    label,
    value,
    kind,
    variant
});

const createMessage = (text: string, actions?: ChatAction[]): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'assistant',
    text,
    createdAt: new Date().toISOString(),
    actions
});

export const createEmptySession = (): ChatSessionState => ({
    pending: null
});

export class AIAssistant {
    async handleInput(input: string, session: ChatSessionState, ctx: AssistantContext): Promise<{ messages: ChatMessage[]; session: ChatSessionState }> {
        const text = input.trim();
        if (!text) return { messages: [], session };

        if (this.isUndo(text) && session.lastDeleted) {
            const handler = HANDLERS[session.lastDeleted.type];
            if (handler?.restore) {
                const result = await handler.restore(session.lastDeleted.data, ctx);
                return {
                    messages: [createMessage(result.message, result.actions)],
                    session: { ...session, lastDeleted: undefined, lastEntity: result.entity }
                };
            }
        }

        if (session.pending) {
            return this.handlePending(text, session, ctx);
        }

        const intent = detectIntent(text);
        if (!intent) {
            return {
                messages: [createMessage(this.buildHelpMessage())],
                session
            };
        }

        return this.handleIntent(intent, text, session, ctx);
    }

    private async handleIntent(intent: DetectedIntent, text: string, session: ChatSessionState, ctx: AssistantContext) {
        const handler = HANDLERS[intent.entity];
        if (!handler) {
            return { messages: [createMessage(this.buildHelpMessage())], session };
        }

        const data = handler.parseInput(text, ctx);

        switch (intent.action) {
            case 'create':
                return this.startCreate(handler, data, session, ctx);
            case 'edit':
            case 'update':
                return this.startEdit(handler, data, session, ctx, text);
            case 'delete':
                return this.startDelete(handler, data, session, ctx);
            case 'complete':
                return this.startComplete(handler, data, session, ctx, text);
            case 'view':
                return this.startView(handler, data, session, ctx);
            case 'snooze':
                return this.startSnooze(handler, data, session, ctx);
            case 'export':
                return this.exportData(session);
            case 'share':
                return {
                    messages: [createMessage(`${EMOJI.success} Share link created.`, [buildAction('Copy link', 'copy link', 'reply', 'secondary')])],
                    session
                };
            case 'enroll':
                return this.startComplete(handler, data, session, ctx, text);
            case 'progress':
                return this.startView(handler, data, session, ctx);
            default:
                return { messages: [createMessage(this.buildHelpMessage())], session };
        }
    }

    private async startCreate(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext) {
        const fields = handler.getCreateFields(data, ctx);
        const nextFieldIndex = this.findNextMissingField(fields, data);
        if (nextFieldIndex !== null) {
            const pending: PendingFlow = {
                action: 'create',
                entity: handler.entity,
                stage: 'collect',
                data,
                fields,
                fieldIndex: nextFieldIndex
            };
            const field = fields[nextFieldIndex];
            return {
                messages: [createMessage(this.buildQuestion(field, nextFieldIndex + 1), this.buildOptions(field))],
                session: { ...session, pending }
            };
        }

        const pending: PendingFlow = {
            action: 'create',
            entity: handler.entity,
            stage: 'confirm',
            data,
            fields
        };

        return {
            messages: [createMessage(handler.buildSummary('create', data), this.buildConfirmActions())],
            session: { ...session, pending }
        };
    }

    private async startEdit(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext, rawText: string) {
        if (handler.entity === 'settings' && handler.update) {
            if (!data || Object.keys(data).length === 0) {
                const fields = handler.getCreateFields(data, ctx);
                const pending: PendingFlow = {
                    action: 'edit',
                    entity: handler.entity,
                    stage: 'collect',
                    data,
                    fields,
                    fieldIndex: 0
                };
                const field = fields[0];
                return {
                    messages: [createMessage(this.buildQuestion(field, 1), this.buildOptions(field))],
                    session: { ...session, pending }
                };
            }

            const pending: PendingFlow = {
                action: 'edit',
                entity: handler.entity,
                stage: 'confirm',
                data
            };
            return {
                messages: [createMessage(handler.buildSummary('edit', data), this.buildConfirmActions())],
                session: { ...session, pending }
            };
        }

        const target = await this.resolveTarget(handler, data, session, ctx);
        if (!target) {
            const pending: PendingFlow = {
                action: 'edit',
                entity: handler.entity,
                stage: 'resolve-target',
                data
            };
            return {
                messages: [createMessage(`Which ${handler.label.toLowerCase()} should I update?`)],
                session: { ...session, pending }
            };
        }

        const updates = handler.parseUpdate ? handler.parseUpdate(rawText, ctx) : {};

        if (updates && Object.keys(updates).length > 0) {
            const pending: PendingFlow = {
                action: 'edit',
                entity: handler.entity,
                stage: 'confirm',
                data: updates,
                target
            };
            return {
                messages: [createMessage(handler.buildSummary('edit', updates, target), this.buildConfirmActions())],
                session: { ...session, pending }
            };
        }

        const editFields = handler.getEditFields ? handler.getEditFields(target, ctx) : this.defaultEditFields();
        const pending: PendingFlow = {
            action: 'edit',
            entity: handler.entity,
            stage: 'edit-field',
            data: {},
            target,
            fields: editFields
        };

        return {
            messages: [
                createMessage(
                    `Found ${target.name}. What would you like to change?`,
                    editFields.map(field => buildAction(field.key, field.key, 'reply', 'secondary'))
                )
            ],
            session: { ...session, pending }
        };
    }

    private async startDelete(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext) {
        const target = await this.resolveTarget(handler, data, session, ctx);
        if (!target) {
            const pending: PendingFlow = {
                action: 'delete',
                entity: handler.entity,
                stage: 'resolve-target',
                data
            };
            return {
                messages: [createMessage(`Which ${handler.label.toLowerCase()} should I delete?`)],
                session: { ...session, pending }
            };
        }

        const pending: PendingFlow = {
            action: 'delete',
            entity: handler.entity,
            stage: 'confirm',
            data,
            target
        };

        return {
            messages: [createMessage(handler.buildSummary('delete', data, target), this.buildConfirmActions())],
            session: { ...session, pending }
        };
    }

    private async startComplete(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext, rawText?: string) {
        const normalized = normalizeText(rawText || '');
        const allMatch = normalized.includes('all') && (normalized.includes('habit') || normalized.includes('habits'));
        const todayMatch = normalized.includes('today') && normalized.includes('habits');
        if (handler.entity === 'habit' && (allMatch || todayMatch)) {
            const pending: PendingFlow = {
                action: 'complete',
                entity: handler.entity,
                stage: 'confirm',
                data: { completeAll: true },
                target: { id: '__all__', name: 'All habits', item: { all: true } }
            };
            return {
                messages: [createMessage('Mark all of today\'s habits as complete?', this.buildConfirmActions())],
                session: { ...session, pending }
            };
        }
        const target = await this.resolveTarget(handler, data, session, ctx);
        if (!target) {
            const pending: PendingFlow = {
                action: 'complete',
                entity: handler.entity,
                stage: 'resolve-target',
                data
            };
            return {
                messages: [createMessage(`Which ${handler.label.toLowerCase()} should I complete?`)],
                session: { ...session, pending }
            };
        }

        const pending: PendingFlow = {
            action: 'complete',
            entity: handler.entity,
            stage: 'confirm',
            data,
            target
        };

        return {
            messages: [createMessage(handler.buildSummary('complete', data, target), this.buildConfirmActions())],
            session: { ...session, pending }
        };
    }

    private async startSnooze(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext) {
        if (!handler.snooze) return { messages: [createMessage(this.buildHelpMessage())], session };
        const target = await this.resolveTarget(handler, data, session, ctx);
        if (!target) {
            const pending: PendingFlow = {
                action: 'snooze',
                entity: handler.entity,
                stage: 'resolve-target',
                data
            };
            return { messages: [createMessage('Which reminder should I snooze?')], session: { ...session, pending } };
        }
        const minutesField: FlowField = {
            key: 'minutes',
            question: 'Snooze for how long? (e.g., 15 minutes)',
            options: ['5', '15', '30', '60'],
            parser: (input: string) => {
                const match = input.match(/\d+/);
                return { minutes: match ? Number(match[0]) : 15 };
            }
        };
        const pending: PendingFlow = {
            action: 'snooze',
            entity: handler.entity,
            stage: 'collect',
            data,
            target,
            fields: [minutesField],
            fieldIndex: 0
        };
        return {
            messages: [createMessage(this.buildQuestion(minutesField, 1), this.buildOptions(minutesField))],
            session: { ...session, pending }
        };
    }

    private async startView(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext) {
        if (handler.view) {
            const target = await this.resolveTarget(handler, data, session, ctx, false);
            const result = await handler.view(target, ctx, data);
            return {
                messages: [createMessage(result.message, result.actions)],
                session: { ...session, lastEntity: result.entity || session.lastEntity }
            };
        }
        if (handler.list) {
            const result = await handler.list(ctx);
            return {
                messages: [createMessage(result.message, result.actions)],
                session
            };
        }
        return { messages: [createMessage(this.buildHelpMessage())], session };
    }

    private async handlePending(text: string, session: ChatSessionState, ctx: AssistantContext) {
        const pending = session.pending!;
        const handler = HANDLERS[pending.entity];
        if (!handler) return { messages: [createMessage(this.buildHelpMessage())], session: { ...session, pending: null } };

        if (pending.stage === 'resolve-target') {
            const target = await handler.findTarget?.(text, ctx);
            if (!target) {
                return { messages: [createMessage(`I could not find that ${handler.label.toLowerCase()}. Try again?`)], session };
            }
            pending.target = target;
            if (pending.action === 'edit') {
                return this.startEdit(handler, {}, { ...session, pending: null }, ctx, text);
            }
            if (pending.action === 'delete') {
                pending.stage = 'confirm';
                return {
                    messages: [createMessage(handler.buildSummary('delete', pending.data, target), this.buildConfirmActions())],
                    session: { ...session, pending }
                };
            }
            if (pending.action === 'complete') {
                pending.stage = 'confirm';
                return {
                    messages: [createMessage(handler.buildSummary('complete', pending.data, target), this.buildConfirmActions())],
                    session: { ...session, pending }
                };
            }
            if (pending.action === 'snooze') {
                const minutesField: FlowField = {
                    key: 'minutes',
                    question: 'Snooze for how long? (e.g., 15 minutes)',
                    options: ['5', '15', '30', '60'],
                    parser: (input: string) => {
                        const match = input.match(/\d+/);
                        return { minutes: match ? Number(match[0]) : 15 };
                    }
                };
                pending.stage = 'collect';
                pending.fields = [minutesField];
                pending.fieldIndex = 0;
                return {
                    messages: [createMessage(this.buildQuestion(minutesField, 1), this.buildOptions(minutesField))],
                    session: { ...session, pending }
                };
            }
        }

        if (pending.stage === 'edit-field') {
            const fieldKey = normalizeText(text);
            const field = pending.fields?.find(f => normalizeText(f.key) === fieldKey || normalizeText(f.question).includes(fieldKey));
            if (field) {
                pending.editFieldKey = field.key;
                pending.stage = 'edit-value';
                return {
                    messages: [createMessage(field.question, this.buildOptions(field))],
                    session: { ...session, pending }
                };
            }
            const updates = handler.parseUpdate ? handler.parseUpdate(text, ctx) : {};
            if (updates && Object.keys(updates).length > 0) {
                pending.stage = 'confirm';
                pending.data = updates;
                return {
                    messages: [createMessage(handler.buildSummary('edit', updates, pending.target!), this.buildConfirmActions())],
                    session: { ...session, pending }
                };
            }
            return {
                messages: [createMessage('Tell me what you want to update (e.g., time, name, category).')],
                session
            };
        }

        if (pending.stage === 'edit-value') {
            const field = pending.fields?.find(f => f.key === pending.editFieldKey);
            const parsed = field?.parser ? field.parser(text, pending.data) : { [pending.editFieldKey || 'value']: text.trim() };
            pending.data = { ...pending.data, ...(parsed || {}) };
            pending.stage = 'confirm';
            return {
                messages: [createMessage(handler.buildSummary('edit', pending.data, pending.target!), this.buildConfirmActions())],
                session: { ...session, pending }
            };
        }

        if (pending.stage === 'collect') {
            const field = pending.fields?.[pending.fieldIndex || 0];
            if (!field) return { messages: [createMessage(this.buildHelpMessage())], session: { ...session, pending: null } };
            const parsed = field.parser ? field.parser(text, pending.data) : { [field.key]: text.trim() };
            pending.data = { ...pending.data, ...(parsed || {}) };

            const nextIndex = this.findNextMissingField(pending.fields || [], pending.data);
            if (nextIndex !== null) {
                pending.fieldIndex = nextIndex;
                const nextField = pending.fields?.[nextIndex];
                return {
                    messages: [createMessage(this.buildQuestion(nextField!, nextIndex + 1), this.buildOptions(nextField))],
                    session: { ...session, pending }
                };
            }

            pending.stage = 'confirm';
            if (pending.action === 'snooze' && pending.target) {
                const minutes = pending.data.minutes || 15;
                return {
                    messages: [createMessage(`Snooze ${pending.target.name} for ${minutes} minutes?`, this.buildConfirmActions())],
                    session: { ...session, pending }
                };
            }
            return {
                messages: [createMessage(handler.buildSummary(pending.action, pending.data, pending.target), this.buildConfirmActions())],
                session: { ...session, pending }
            };
        }

        if (pending.stage === 'confirm') {
            const confirmation = parseYesNo(text);
            if (confirmation === false || normalizeText(text).includes('cancel')) {
                return { messages: [createMessage('Okay, canceled.')], session: { ...session, pending: null } };
            }
            if (confirmation === null && !normalizeText(text).includes('confirm') && !normalizeText(text).includes('yes')) {
                return { messages: [createMessage('Please confirm with yes or no.')], session };
            }

            const result = await this.executeAction(handler, pending, ctx);
            const nextSession: ChatSessionState = {
                ...session,
                pending: null,
                lastEntity: result.entity || session.lastEntity,
                lastDeleted: result.deleted || session.lastDeleted
            };
            return {
                messages: [createMessage(result.message, result.actions)],
                session: nextSession
            };
        }

        return { messages: [createMessage(this.buildHelpMessage())], session: { ...session, pending: null } };
    }

    private async executeAction(handler: ChatHandler, pending: PendingFlow, ctx: AssistantContext): Promise<ActionResult> {
        switch (pending.action) {
            case 'create':
                return handler.create ? handler.create(pending.data, ctx) : this.unsupportedAction();
            case 'edit':
                if (handler.update) {
                    const target = pending.target || ({} as TargetMatch);
                    return handler.update(target, pending.data, ctx);
                }
                return this.unsupportedAction();
            case 'delete':
                return handler.remove && pending.target ? handler.remove(pending.target, ctx) : this.unsupportedAction();
            case 'complete':
                return handler.complete && pending.target ? handler.complete(pending.target, ctx) : this.unsupportedAction();
            case 'snooze':
                return handler.snooze && pending.target ? handler.snooze(pending.target, pending.data, ctx) : this.unsupportedAction();
            default:
                return this.unsupportedAction();
        }
    }

    private async resolveTarget(handler: ChatHandler, data: Record<string, any>, session: ChatSessionState, ctx: AssistantContext, allowFallback = true) {
        const name = data.title || data.name || data.query;
        if (name && handler.findTarget) {
            const match = await handler.findTarget(name, ctx);
            if (match) return match;
        }
        if (allowFallback && session.lastEntity && session.lastEntity.type === handler.entity) {
            return {
                id: session.lastEntity.id,
                name: session.lastEntity.name || handler.label,
                item: session.lastEntity.data || session.lastEntity
            } as TargetMatch;
        }
        return null;
    }

    private async exportData(session: ChatSessionState) {
        const result = await MetricsExporter.exportMetrics();
        return {
            messages: [createMessage(result.message, result.actions)],
            session
        };
    }

    private buildQuestion(field: FlowField, step: number) {
        const prefix = `Step ${step}. `;
        return `${prefix}${field.question}`;
    }

    private buildOptions(field?: FlowField) {
        if (!field?.options) return undefined;
        return field.options.map(option => buildAction(option, option, 'reply', 'secondary'));
    }

    private buildConfirmActions() {
        return [
            buildAction('Yes, confirm', 'yes', 'confirm', 'primary'),
            buildAction('Cancel', 'no', 'cancel', 'danger')
        ];
    }

    private findNextMissingField(fields: FlowField[], data: Record<string, any>) {
        for (let i = 0; i < fields.length; i += 1) {
            const field = fields[i];
            if (field.optional) continue;
            if (data[field.key] === undefined || data[field.key] === null || data[field.key] === '') {
                return i;
            }
        }
        return null;
    }

    private defaultEditFields() {
        return [
            { key: 'time', question: 'What time should it be?' },
            { key: 'name', question: 'What should the new name be?' },
            { key: 'category', question: 'Which category?' },
            { key: 'frequency', question: 'How often?' }
        ] as FlowField[];
    }

    private buildHelpMessage() {
        return `${formatHeader('HOW CAN I HELP?')}\n\nTry:\n- Create habit\n- Set reminder at 7am\n- Add task finish project\n- Show my schedule\n- Add note about meditation\n\nYou can also say "show my stats" or "dark mode".`;
    }

    private unsupportedAction(): ActionResult {
        return { message: `${EMOJI.warning} That action is not supported yet.` };
    }

    private isUndo(text: string) {
        const normalized = normalizeText(text);
        return normalized.includes('undo') || normalized.includes('restore');
    }
}
