import { ProtocolService } from '../services/protocol.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    formatDetailsBlock,
    formatHeader
} from './chatUtils';

const parseSteps = (text: string) => {
    const parts = text
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    if (parts.length < 2) return null;
    return parts.map(step => ({ label: step, minutes: undefined }));
};

const parseInput = (text: string) => {
    const title = extractName(text, ['protocol', 'routine']);
    const steps = parseSteps(text);
    return { title: title || undefined, steps: steps || undefined };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'What should I name this protocol?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'steps',
        question: 'List the steps (comma separated).',
        parser: (input: string) => ({ steps: parseSteps(input) || [{ label: input.trim(), minutes: undefined }] })
    },
    {
        key: 'durations',
        question: 'Any durations per step? (e.g., 10m, 15m, 5m)',
        optional: true,
        parser: (input: string, data: Record<string, any>) => {
            const nums = input.match(/\d+/g);
            if (!nums || !data.steps) return {};
            const durations = nums.map(n => Number(n));
            const steps = data.steps.map((step: any, idx: number) => ({
                ...step,
                minutes: durations[idx] || step.minutes
            }));
            return { steps };
        }
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New protocol name?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'steps',
        question: 'Update steps (comma separated)',
        parser: (input: string) => ({ steps: parseSteps(input) || [{ label: input.trim(), minutes: undefined }] })
    }
];

const parseUpdate = (text: string) => {
    const updates: Record<string, any> = {};
    if (text.toLowerCase().includes('rename')) {
        const match = text.match(/to\s+(.+)/i);
        if (match) updates.title = match[1].trim();
    }
    const steps = parseSteps(text);
    if (steps) updates.steps = steps;
    return updates;
};

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Protocol').toString().toUpperCase();
    const steps = (data.steps || target?.item?.steps || []).map((step: any, idx: number) => `${idx + 1}. ${step.label}${step.minutes ? ` (${step.minutes}m)` : ''}`).join(' | ');
    const details = [
        { label: 'Name', value: data.title || target?.name || 'Untitled' },
        { label: 'Steps', value: steps || 'Not set' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} PROTOCOL`, details)}\n\nConfirm this protocol?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const protocols = await ProtocolService.getProtocols(ctx.userId);
    const normalized = name.toLowerCase();
    const match = protocols.find(protocol => protocol.title.toLowerCase().includes(normalized));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createProtocol = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to create protocols.` };
    const protocol = await ProtocolService.createProtocol({
        title: data.title,
        steps: data.steps || []
    }, ctx.userId);

    const details = [
        { label: 'Steps', value: (protocol.steps || []).length.toString() },
        { label: 'Total', value: protocol.totalMinutes ? `${protocol.totalMinutes} min` : 'Not set' }
    ];

    return {
        message: `${EMOJI.success} CREATED!\n${DIVIDER}\n\n${formatDetailsBlock(protocol.title.toUpperCase(), details)}`,
        actions: [
            { id: 'protocol-view', label: 'View protocol', value: `show protocol ${protocol.title}`, kind: 'reply', variant: 'secondary' },
            { id: 'protocol-edit', label: 'Edit', value: `edit protocol ${protocol.title}`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'protocol', id: protocol.id, name: protocol.title, data: protocol }
    };
};

const updateProtocol = async (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Protocol not found.` };
    await ProtocolService.updateProtocol(target.id, updates);
    const updatedTitle = updates.title || target.name;
    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${updatedTitle} updated.`,
        actions: [
            { id: 'protocol-view', label: 'View', value: `show protocol ${updatedTitle}`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'protocol', id: target.id, name: updatedTitle }
    };
};

const removeProtocol = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Protocol not found.` };
    await ProtocolService.deleteProtocol(target.id);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} protocol deleted.`,
        actions: [
            { id: 'protocol-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'protocol', data: target.item }
    };
};

const viewProtocol = async (target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    if (target?.id) {
        const steps = (target.item.steps || []).map((step: any, idx: number) => `${idx + 1}. ${step.label}${step.minutes ? ` (${step.minutes}m)` : ''}`).join('\n');
        return {
            message: `\uD83D\uDCCA PROTOCOL DETAILS\n${DIVIDER}\n\n${target.name}\n${steps}`,
            actions: [
                { id: 'protocol-edit', label: 'Edit', value: `edit protocol ${target.name}`, kind: 'reply', variant: 'secondary' }
            ]
        };
    }
    const protocols = await ProtocolService.getProtocols(ctx.userId);
    if (!protocols.length) {
        return { message: `${EMOJI.info} No protocols yet.` };
    }
    const list = protocols.slice(0, 6).map((protocol: any) => `- ${protocol.title}`).join('\n');
    return {
        message: `\uD83D\uDCCA PROTOCOLS\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'protocol-create', label: 'Create protocol', value: 'create protocol', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreProtocol = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const protocol = await ProtocolService.createProtocol({
        title: data.title,
        steps: data.steps || []
    }, ctx.userId);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${protocol.title} restored.`,
        entity: { type: 'protocol', id: protocol.id, name: protocol.title }
    };
};

export const ProtocolCreation: ChatHandler = {
    entity: 'protocol',
    label: 'Protocol',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createProtocol,
    update: updateProtocol,
    remove: removeProtocol,
    view: viewProtocol,
    restore: restoreProtocol
};
