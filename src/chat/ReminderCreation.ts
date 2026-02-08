import { ReminderService } from '../services/reminder.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DEFAULT_FREQUENCIES,
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    formatDetailsBlock,
    formatHeader,
    formatTimeLabel,
    normalizeText,
    parseFrequency,
    parseTime,
    parseYesNo
} from './chatUtils';

const reminderKeywords = ['reminder', 'alert', 'notify'];

const parseInput = (text: string) => {
    const name = extractName(text, reminderKeywords);
    const time = parseTime(text);
    const frequency = parseFrequency(text);
    const notificationType = text.toLowerCase().includes('email') ? 'email' : text.toLowerCase().includes('sms') ? 'sms' : 'push';

    return {
        title: name || undefined,
        time24: time?.time24,
        timeLabel: time?.label,
        frequency: frequency?.days,
        frequencyLabel: frequency?.label,
        notificationType
    };
};

const parseUpdate = (text: string) => {
    const updates: Record<string, any> = {};
    const lowered = text.toLowerCase();

    if (lowered.includes('time') || lowered.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/)) {
        const time = parseTime(text);
        if (time?.time24) {
            updates.time24 = time.time24;
            updates.timeLabel = time.label;
        }
    }

    if (lowered.includes('daily') || lowered.includes('weekly') || lowered.includes('weekday') || lowered.includes('weekend')) {
        const frequency = parseFrequency(text);
        if (frequency) {
            updates.frequency = frequency.days;
            updates.frequencyLabel = frequency.label;
        }
    }

    if (lowered.includes('email')) updates.notificationType = 'email';
    if (lowered.includes('sms')) updates.notificationType = 'sms';
    if (lowered.includes('push')) updates.notificationType = 'push';

    if (lowered.includes('rename') || lowered.includes('title')) {
        const match = text.match(/to\s+(.+)/i);
        if (match) updates.title = match[1].trim();
    }

    return updates;
};

const getCreateFields = (data: Record<string, any>): FlowField[] => [
    {
        key: 'title',
        question: 'What should I remind you about?',
        parser: (input: string) => ({ title: extractName(input) || input.trim() })
    },
    {
        key: 'time',
        question: 'What time should I remind you?',
        parser: (input: string) => {
            const parsed = parseTime(input);
            if (!parsed) return { timeLabel: input.trim() };
            return { time24: parsed.time24, timeLabel: parsed.label };
        }
    },
    {
        key: 'frequency',
        question: 'How often should it repeat?',
        options: DEFAULT_FREQUENCIES,
        parser: (input: string) => {
            const parsed = parseFrequency(input);
            return parsed ? { frequency: parsed.days, frequencyLabel: parsed.label } : { frequencyLabel: input.trim() };
        }
    },
    {
        key: 'notificationType',
        question: 'Preferred notification type?',
        options: ['Push', 'Email', 'SMS'],
        parser: (input: string) => ({ notificationType: input.trim().toLowerCase() })
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New reminder title?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'time',
        question: 'New reminder time?',
        parser: (input: string) => {
            const parsed = parseTime(input);
            return parsed ? { time24: parsed.time24, timeLabel: parsed.label } : { timeLabel: input.trim() };
        }
    },
    {
        key: 'frequency',
        question: 'New frequency?',
        options: DEFAULT_FREQUENCIES,
        parser: (input: string) => {
            const parsed = parseFrequency(input);
            return parsed ? { frequency: parsed.days, frequencyLabel: parsed.label } : { frequencyLabel: input.trim() };
        }
    },
    {
        key: 'notificationType',
        question: 'Notification type?',
        options: ['Push', 'Email', 'SMS'],
        parser: (input: string) => ({ notificationType: input.trim().toLowerCase() })
    }
];

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Reminder').toString().toUpperCase();
    const details = [
        { label: 'Title', value: data.title || target?.name || 'Untitled' },
        { label: 'Time', value: data.timeLabel || (data.time24 ? formatTimeLabel(data.time24) : 'Not set') },
        { label: 'Frequency', value: data.frequencyLabel || 'Daily' },
        { label: 'Type', value: data.notificationType ? data.notificationType.toUpperCase() : 'PUSH' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} REMINDER`, details)}\n\nConfirm this reminder?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const reminders = await ReminderService.getReminders(ctx.userId);
    const normalized = normalizeText(name);
    const exact = reminders.find(r => normalizeText(r.title) === normalized);
    const match = exact || reminders.find(r => normalizeText(r.title).includes(normalized));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createReminder = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) {
        return { message: `${EMOJI.warning} Please sign in to create reminders.` };
    }

    const reminder = await ReminderService.createReminder({
        title: data.title,
        time: data.time24 || '09:00',
        days: data.frequency || [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        notificationType: data.notificationType || 'push'
    } as any);

    const details = [
        { label: 'Time', value: data.timeLabel || formatTimeLabel(reminder.time) },
        { label: 'Frequency', value: data.frequencyLabel || 'Daily' },
        { label: 'Status', value: 'Enabled' }
    ];

    return {
        message: `${EMOJI.success} CREATED!\n${DIVIDER}\n\n${formatDetailsBlock(reminder.title.toUpperCase(), details)}`,
        actions: [
            { id: 'reminder-snooze', label: 'Snooze', value: `snooze ${reminder.title}`, kind: 'reply', variant: 'secondary' },
            { id: 'reminder-edit', label: 'Edit reminder', value: `edit ${reminder.title}`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'reminder', id: reminder.id, name: reminder.title, data: reminder }
    };
};

const updateReminder = async (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Choose a reminder to update.` };
    await ReminderService.updateReminder(target.id, {
        title: updates.title,
        time: updates.time24,
        days: updates.frequency,
        notificationType: updates.notificationType
    });

    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${target.name} reminder updated.`,
        actions: [
            { id: 'reminder-view', label: 'View reminders', value: 'show reminders', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'reminder', id: target.id, name: updates.title || target.name }
    };
};

const removeReminder = async (target: TargetMatch): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Choose a reminder to delete.` };
    await ReminderService.deleteReminder(target.id);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} reminder deleted.`,
        actions: [
            { id: 'reminder-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'reminder', data: target.item }
    };
};

const viewReminder = async (target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const reminders = await ReminderService.getReminders(ctx.userId);
    if (target?.id) {
        const details = [
            { label: 'Time', value: target.item.time ? formatTimeLabel(target.item.time) : 'Not set' },
            { label: 'Days', value: target.item.days?.length ? target.item.days.join(', ') : 'Daily' },
            { label: 'Status', value: target.item.isEnabled ? 'Enabled' : 'Disabled' }
        ];
        return {
            message: `\uD83D\uDCCA REMINDER DETAILS\n${DIVIDER}\n\n${formatDetailsBlock(target.name.toUpperCase(), details)}`,
            actions: [
                { id: 'reminder-edit', label: 'Edit', value: `edit ${target.name}`, kind: 'reply', variant: 'secondary' },
                { id: 'reminder-snooze', label: 'Snooze 15m', value: `snooze ${target.name} 15`, kind: 'reply', variant: 'secondary' }
            ]
        };
    }
    if (!reminders.length) {
        return { message: `${EMOJI.info} No reminders yet.` };
    }
    const list = reminders.slice(0, 6).map(r => `- ${r.title} @ ${r.time ? formatTimeLabel(r.time) : 'Anytime'}`).join('\n');
    return {
        message: `\uD83D\uDCCA REMINDERS\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'reminder-create', label: 'Create reminder', value: 'create reminder', kind: 'reply', variant: 'primary' }
        ]
    };
};

const snoozeReminder = async (target: TargetMatch, data: Record<string, any>): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Choose a reminder to snooze.` };
    const minutes = data.minutes ? Number(data.minutes) : 15;
    const snoozed = new Date(Date.now() + minutes * 60000);
    const time24 = `${String(snoozed.getHours()).padStart(2, '0')}:${String(snoozed.getMinutes()).padStart(2, '0')}`;
    await ReminderService.updateReminder(target.id, { time: time24 });

    return {
        message: `${EMOJI.success} Snoozed!\n${DIVIDER}\n\n${target.name} snoozed until ${formatTimeLabel(time24)}.`,
        actions: [
            { id: 'reminder-snooze-again', label: 'Snooze 30m', value: `snooze ${target.name} 30`, kind: 'reply', variant: 'secondary' }
        ]
    };
};

const restoreReminder = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const restored = await ReminderService.createReminder({
        title: data.title,
        time: data.time,
        days: data.days || [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        notificationType: data.notificationType || 'push'
    } as any);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${restored.title} reminder restored.`,
        entity: { type: 'reminder', id: restored.id, name: restored.title }
    };
};

export const ReminderCreation: ChatHandler = {
    entity: 'reminder',
    label: 'Reminder',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createReminder,
    update: updateReminder,
    remove: removeReminder,
    view: viewReminder,
    snooze: snoozeReminder,
    restore: restoreReminder
};
