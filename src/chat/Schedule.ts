import { ScheduleService } from '../services/schedule.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    formatDateLabel,
    formatDetailsBlock,
    formatHeader,
    parseDate,
    parseTime
} from './chatUtils';

const parseInput = (text: string) => {
    const title = extractName(text, ['schedule', 'event', 'meeting']);
    const date = parseDate(text);
    const time = parseTime(text);
    return {
        title: title || undefined,
        date: date || undefined,
        time24: time?.time24,
        timeLabel: time?.label
    };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'What should I add to your schedule?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'date',
        question: 'Which date?',
        parser: (input: string) => ({ date: parseDate(input) || input.trim() })
    },
    {
        key: 'time',
        question: 'What time?',
        parser: (input: string) => {
            const parsed = parseTime(input);
            return parsed ? { time24: parsed.time24, timeLabel: parsed.label } : { timeLabel: input.trim() };
        }
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New event title?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'date',
        question: 'New date?',
        parser: (input: string) => ({ date: parseDate(input) || input.trim() })
    },
    {
        key: 'time',
        question: 'New time?',
        parser: (input: string) => {
            const parsed = parseTime(input);
            return parsed ? { time24: parsed.time24, timeLabel: parsed.label } : { timeLabel: input.trim() };
        }
    }
];

const parseUpdate = (text: string) => {
    const updates: Record<string, any> = {};
    const date = parseDate(text);
    if (date) updates.date = date;
    const time = parseTime(text);
    if (time?.time24) {
        updates.time24 = time.time24;
        updates.timeLabel = time.label;
    }
    if (text.toLowerCase().includes('rename')) {
        const match = text.match(/to\s+(.+)/i);
        if (match) updates.title = match[1].trim();
    }
    return updates;
};

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Event').toString().toUpperCase();
    const details = [
        { label: 'Event', value: data.title || target?.name || 'Untitled' },
        { label: 'Date', value: data.date ? formatDateLabel(data.date) : 'Not set' },
        { label: 'Time', value: data.timeLabel || 'Not set' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} EVENT`, details)}\n\nConfirm this schedule item?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const events = await ScheduleService.getEvents(ctx.userId);
    const normalized = name.toLowerCase();
    const match = events.find(event => event.title.toLowerCase().includes(normalized));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createEvent = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to add events.` };
    const event = await ScheduleService.createEvent({
        title: data.title,
        eventDate: data.date,
        eventTime: data.time24,
        timeLabel: data.timeLabel
    }, ctx.userId);
    const details = [
        { label: 'Date', value: event.eventDate ? formatDateLabel(event.eventDate) : 'Not set' },
        { label: 'Time', value: event.timeLabel || 'Not set' }
    ];
    return {
        message: `${EMOJI.success} SCHEDULED!\n${DIVIDER}\n\n${formatDetailsBlock(event.title.toUpperCase(), details)}`,
        actions: [
            { id: 'schedule-view', label: 'View schedule', value: 'show my schedule', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'schedule', id: event.id, name: event.title, data: event }
    };
};

const updateEvent = async (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Event not found.` };
    await ScheduleService.updateEvent(target.id, {
        title: updates.title,
        eventDate: updates.date,
        eventTime: updates.time24,
        timeLabel: updates.timeLabel
    });
    const updatedTitle = updates.title || target.name;
    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${updatedTitle} updated.`,
        actions: [
            { id: 'schedule-view', label: 'View schedule', value: 'show my schedule', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'schedule', id: target.id, name: updatedTitle }
    };
};

const removeEvent = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Event not found.` };
    await ScheduleService.deleteEvent(target.id);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} removed from schedule.`,
        actions: [
            { id: 'schedule-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'schedule', data: target.item }
    };
};

const viewSchedule = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const events = await ScheduleService.getEvents(ctx.userId);
    if (!events.length) {
        return { message: `${EMOJI.info} No scheduled events yet.` };
    }
    const list = events.slice(0, 8).map((event: any) => {
        const when = event.eventDate ? formatDateLabel(event.eventDate) : 'Date';
        const time = event.timeLabel || 'Time';
        return `- ${event.title} (${when} ${time})`;
    }).join('\n');

    return {
        message: `\uD83D\uDCC5 YOUR SCHEDULE\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'schedule-create', label: 'Add event', value: 'schedule event', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreEvent = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const event = await ScheduleService.createEvent({
        title: data.title,
        eventDate: data.eventDate || data.date,
        eventTime: data.eventTime || data.time24,
        timeLabel: data.timeLabel
    }, ctx.userId);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${event.title} restored.`,
        entity: { type: 'schedule', id: event.id, name: event.title }
    };
};

export const Schedule: ChatHandler = {
    entity: 'schedule',
    label: 'Schedule',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createEvent,
    update: updateEvent,
    remove: removeEvent,
    view: viewSchedule,
    restore: restoreEvent
};
