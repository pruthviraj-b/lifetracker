import { HabitService } from '../services/habit.service';
import { ReminderService } from '../services/reminder.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DEFAULT_CATEGORIES,
    DEFAULT_FREQUENCIES,
    DIVIDER,
    EMOJI,
    FlowField,
    extractCategory,
    extractName,
    formatDetailsBlock,
    formatHeader,
    formatTimeLabel,
    normalizeText,
    parseFrequency,
    parseTime,
    parseYesNo,
    toTimeOfDay
} from './chatUtils';

const habitKeywords = ['habit', 'habbit', 'hibbit', 'ritual', 'routine'];

const mapCategory = (category?: string) => {
    const lowered = (category || '').toLowerCase();
    if (['health', 'fitness'].includes(lowered)) return 'health';
    if (['mindfulness', 'wellness'].includes(lowered)) return 'mindfulness';
    if (['learning', 'study'].includes(lowered)) return 'learning';
    if (['social'].includes(lowered)) return 'social';
    if (['work', 'personal', 'growth', 'personal growth'].includes(lowered)) return 'work';
    return 'work';
};

const summarizeTime = (data: Record<string, any>) => {
    if (data.timeLabel) return data.timeLabel;
    if (data.time24) return formatTimeLabel(data.time24);
    if (data.timeOfDay) return data.timeOfDay.charAt(0).toUpperCase() + data.timeOfDay.slice(1);
    return 'Anytime';
};

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Habit').toString().toUpperCase();
    const details = [
        { label: 'Name', value: data.title || target?.name || 'Untitled' },
        { label: 'Time', value: summarizeTime(data) },
        { label: 'Category', value: data.category ? capitalizeCategory(data.category) : 'General' },
        { label: 'Frequency', value: data.frequencyLabel || 'Daily' },
        { label: 'Reminder', value: data.reminder === false ? 'No' : 'Yes' }
    ];

    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} HABIT`, details)}\n\nDoes this look right?`;
};

const capitalizeCategory = (category: string) =>
    category
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const parseInput = (text: string) => {
    const name = extractName(text, habitKeywords);
    const time = parseTime(text);
    const frequency = parseFrequency(text);
    const category = extractCategory(text);
    const reminder = parseYesNo(text);

    return {
        title: name || undefined,
        time24: time?.time24,
        timeLabel: time?.label,
        timeOfDay: time?.timeOfDay,
        frequency: frequency?.days,
        frequencyLabel: frequency?.label,
        category: category || undefined,
        reminder: reminder ?? undefined
    };
};

const parseUpdate = (text: string) => {
    const lowered = text.toLowerCase();
    const updates: Record<string, any> = {};

    if (lowered.includes('time') || lowered.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/)) {
        const time = parseTime(text);
        if (time?.time24) {
            updates.time24 = time.time24;
            updates.timeLabel = time.label;
            updates.timeOfDay = time.timeOfDay;
        }
    }

    if (lowered.includes('category')) {
        const category = extractCategory(text);
        if (category) updates.category = category;
    }

    if (lowered.includes('frequency') || lowered.includes('daily') || lowered.includes('weekly')) {
        const frequency = parseFrequency(text);
        if (frequency) {
            updates.frequency = frequency.days;
            updates.frequencyLabel = frequency.label;
        }
    }

    if (lowered.includes('rename') || lowered.includes('name')) {
        const nameMatch = text.match(/to\s+(.+)/i);
        if (nameMatch) updates.title = nameMatch[1].trim();
    }

    if (lowered.includes('reminder')) {
        const reminder = parseYesNo(text);
        if (reminder !== null) updates.reminder = reminder;
    }

    return updates;
};

const getCreateFields = (data: Record<string, any>): FlowField[] => [
    {
        key: 'title',
        question: 'What should I call this habit?',
        parser: (input: string) => ({ title: extractName(input) || input.trim() })
    },
    {
        key: 'time',
        question: 'What time do you want to do this? (e.g., 7:00 AM, morning, anytime)',
        parser: (input: string) => {
            const parsed = parseTime(input);
            if (!parsed) return { timeLabel: input.trim() };
            return {
                time24: parsed.time24,
                timeLabel: parsed.label,
                timeOfDay: parsed.timeOfDay
            };
        }
    },
    {
        key: 'category',
        question: 'Which category fits best?',
        options: DEFAULT_CATEGORIES,
        parser: (input: string) => ({ category: extractCategory(input) || input.trim().toLowerCase() })
    },
    {
        key: 'frequency',
        question: 'How often should I schedule this?',
        options: DEFAULT_FREQUENCIES,
        parser: (input: string) => {
            const parsed = parseFrequency(input);
            return parsed ? { frequency: parsed.days, frequencyLabel: parsed.label } : { frequencyLabel: input.trim() };
        }
    },
    {
        key: 'reminder',
        question: 'Set a reminder?',
        options: ['Yes', 'No'],
        parser: (input: string) => ({ reminder: parseYesNo(input) ?? true })
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New habit name?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'time',
        question: 'New time?',
        parser: (input: string) => {
            const parsed = parseTime(input);
            if (!parsed) return { timeLabel: input.trim() };
            return {
                time24: parsed.time24,
                timeLabel: parsed.label,
                timeOfDay: parsed.timeOfDay
            };
        }
    },
    {
        key: 'category',
        question: 'New category?',
        options: DEFAULT_CATEGORIES,
        parser: (input: string) => ({ category: extractCategory(input) || input.trim().toLowerCase() })
    },
    {
        key: 'frequency',
        question: 'New frequency?',
        options: DEFAULT_FREQUENCIES,
        parser: (input: string) => {
            const parsed = parseFrequency(input);
            return parsed ? { frequency: parsed.days, frequencyLabel: parsed.label } : { frequencyLabel: input.trim() };
        }
    }
];

const findTarget = async (name: string, ctx: AssistantContext) => {
    const userId = ctx.userId;
    if (!userId) return null;
    const habits = await HabitService.getHabits(userId);
    const normalized = normalizeText(name);
    const exact = habits.find(h => normalizeText(h.title) === normalized);
    const match = exact || habits.find(h => normalizeText(h.title).includes(normalized));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createHabit = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) {
        return { message: `${EMOJI.warning} Please sign in to create habits.` };
    }

    const payload = {
        title: data.title,
        category: mapCategory(data.category),
        timeOfDay: data.timeOfDay || toTimeOfDay(data.time24),
        frequency: data.frequency || [0, 1, 2, 3, 4, 5, 6],
        type: 'habit' as const,
        goalDuration: 15,
        priority: 'medium' as const,
        order: 0
    };

    const created = await HabitService.createHabit(payload as any, ctx.userId);

    let reminderInfo = 'Not set';
    if (data.reminder !== false) {
        const reminderTime = data.time24 || '09:00';
        await ReminderService.createReminder({
            title: `${payload.title} Reminder`,
            time: reminderTime,
            days: payload.frequency,
            isEnabled: true,
            notificationType: 'push',
            habitId: created.id
        } as any);
        reminderInfo = data.timeLabel || formatTimeLabel(reminderTime);
    }

    const details = [
        { label: 'Time', value: summarizeTime(data) },
        { label: 'Streak', value: '0 days (start today!)' },
        { label: 'Category', value: capitalizeCategory(payload.category) },
        { label: 'Status', value: 'Ready to track' },
        { label: 'Reminder', value: reminderInfo }
    ];

    return {
        message: `${EMOJI.success} SUCCESS!\n${DIVIDER}\n\n${formatDetailsBlock(payload.title.toUpperCase(), details)}`,
        actions: [
            { id: 'habit-complete', label: 'Complete it now', value: `complete ${payload.title}`, kind: 'reply', variant: 'primary' },
            { id: 'habit-reminder', label: 'Change reminder', value: `edit ${payload.title} reminder`, kind: 'reply', variant: 'secondary' },
            { id: 'habit-stats', label: 'View stats', value: `show ${payload.title} stats`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'habit', id: created.id, name: payload.title, data: created }
    };
};

const updateHabit = async (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId || !target.id) {
        return { message: `${EMOJI.warning} Please sign in to update habits.` };
    }

    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.category) payload.category = mapCategory(updates.category);
    if (updates.frequency) payload.frequency = updates.frequency;
    if (updates.time24 || updates.timeOfDay) payload.timeOfDay = updates.timeOfDay || toTimeOfDay(updates.time24);

    await HabitService.updateHabit(target.id, payload, ctx.userId);

    if (updates.time24) {
        const reminders = await ReminderService.getReminders(ctx.userId);
        const reminder = reminders.find(r => r.habitId === target.id || normalizeText(r.title).includes(normalizeText(target.name)));
        if (reminder) {
            await ReminderService.updateReminder(reminder.id, { time: updates.time24 });
        }
    }

    const details = [
        { label: 'Updated', value: Object.keys(payload).map(key => key.replace(/([A-Z])/g, ' $1')).join(', ') || 'Details' },
        { label: 'Status', value: 'Saved' }
    ];

    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${formatDetailsBlock(target.name.toUpperCase(), details)}`,
        actions: [
            { id: 'habit-edit', label: 'Edit again', value: `edit ${target.name}`, kind: 'reply', variant: 'secondary' },
            { id: 'habit-view', label: 'View details', value: `show ${target.name}`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'habit', id: target.id, name: updates.title || target.name }
    };
};

const completeHabit = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId || !target.id) {
        return { message: `${EMOJI.warning} Please sign in to complete habits.` };
    }

    if (target.item?.all) {
        const habits = await HabitService.getHabits(ctx.userId);
        const today = new Date().toISOString().split('T')[0];
        await Promise.all(habits.map(h => HabitService.toggleHabitCompletion(h.id, today, true, ctx.userId!)));
        return {
            message: `${EMOJI.success} COMPLETED!\n${DIVIDER}\n\nAll habits marked complete for today.`,
            actions: [
                { id: 'habit-stats', label: 'View stats', value: 'show my stats', kind: 'reply', variant: 'secondary' }
            ]
        };
    }

    const today = new Date().toISOString().split('T')[0];
    await HabitService.toggleHabitCompletion(target.id, today, true, ctx.userId);
    const habits = await HabitService.getHabits(ctx.userId);
    const habit = habits.find(h => h.id === target.id);

    const streak = habit?.streak ? habit.streak : 1;
    const completion = habit?.completedToday ? 'Completed today' : 'Completed';

    const details = [
        { label: 'Streak', value: `${streak} days ${EMOJI.fire}` },
        { label: 'Status', value: completion },
        { label: 'Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];

    return {
        message: `${EMOJI.success} COMPLETED!\n${DIVIDER}\n\n${formatDetailsBlock(target.name.toUpperCase(), details)}\n\nGreat job!`,
        actions: [
            { id: 'habit-complete-next', label: 'Complete another', value: 'today\'s habits', kind: 'reply', variant: 'primary' },
            { id: 'habit-stats', label: 'View stats', value: 'show my stats', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'habit', id: target.id, name: target.name }
    };
};

const removeHabit = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Please select a habit to delete.` };
    await HabitService.deleteHabit(target.id);
    const details = [
        { label: 'Habit', value: target.name },
        { label: 'Status', value: 'Deleted' }
    ];
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${formatDetailsBlock('HABIT REMOVED', details)}`,
        actions: [
            { id: 'habit-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' },
            { id: 'habit-create', label: 'Create new', value: 'create habit', kind: 'reply', variant: 'primary' }
        ],
        deleted: { type: 'habit', data: target.item }
    };
};

const viewHabit = async (target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) {
        return { message: `${EMOJI.warning} Please sign in to view habits.` };
    }
    if (target?.id) {
        const habit = target.item;
        const details = [
            { label: 'Time', value: habit.timeOfDay || 'Anytime' },
            { label: 'Category', value: capitalizeCategory(habit.category || 'General') },
            { label: 'Frequency', value: habit.frequency?.length ? habit.frequency.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') : 'Daily' },
            { label: 'Streak', value: `${habit.streak || 0} days` }
        ];
        return {
            message: `\uD83D\uDCCA HABIT DETAILS\n${DIVIDER}\n\n${formatDetailsBlock(target.name.toUpperCase(), details)}`,
            actions: [
                { id: 'habit-edit', label: 'Edit habit', value: `edit ${target.name}`, kind: 'reply', variant: 'secondary' },
                { id: 'habit-complete', label: 'Complete', value: `complete ${target.name}`, kind: 'reply', variant: 'primary' }
            ],
            entity: { type: 'habit', id: target.id, name: target.name }
        };
    }

    const habits = await HabitService.getHabits(ctx.userId);
    if (!habits.length) {
        return { message: `${EMOJI.info} You do not have any habits yet.` };
    }

    const list = habits.slice(0, 6).map(h => `${h.completedToday ? '[x]' : '[ ]'} ${h.title}`).join('\n');
    return {
        message: `\uD83D\uDCCA TODAY'S HABITS\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'habit-complete-all', label: 'Complete one', value: `complete ${habits[0].title}`, kind: 'reply', variant: 'primary' },
            { id: 'habit-create', label: 'Create habit', value: 'create habit', kind: 'reply', variant: 'secondary' }
        ]
    };
};

const restoreHabit = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const restored = await HabitService.createHabit({
        title: data.title,
        category: data.category,
        timeOfDay: data.timeOfDay || 'anytime',
        frequency: data.frequency || [0, 1, 2, 3, 4, 5, 6],
        type: data.type || 'habit',
        goalDuration: data.goalDuration || 15,
        priority: data.priority || 'medium',
        order: data.order || 0
    } as any, ctx.userId);

    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${restored.title} has been restored.`,
        entity: { type: 'habit', id: restored.id, name: restored.title }
    };
};

export const HabitCreation: ChatHandler = {
    entity: 'habit',
    label: 'Habit',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createHabit,
    update: updateHabit,
    complete: completeHabit,
    remove: removeHabit,
    view: viewHabit,
    restore: restoreHabit
};
