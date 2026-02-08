import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    extractPriority,
    formatDateLabel,
    formatDetailsBlock,
    formatHeader,
    loadLocalData,
    parseDate,
    updateLocalData,
    addLocalItem,
    removeLocalItem,
    updateLocalItem,
    findLocalItemByName
} from './chatUtils';

const parseInput = (text: string) => {
    const title = extractName(text, ['task', 'todo', 'to-do']);
    const dueDate = parseDate(text);
    const priority = extractPriority(text);

    return {
        title: title || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined
    };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'What is the task?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'dueDate',
        question: 'Any due date? (e.g., tomorrow, 2026-02-10)',
        parser: (input: string) => ({ dueDate: parseDate(input) || input.trim() })
    },
    {
        key: 'priority',
        question: 'Priority level?',
        options: ['High', 'Medium', 'Low'],
        parser: (input: string) => ({ priority: extractPriority(input) || input.trim().toLowerCase() })
    },
    {
        key: 'notes',
        question: 'Any notes to add? (optional)',
        optional: true,
        parser: (input: string) => ({ notes: input.trim() })
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New task name?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'dueDate',
        question: 'New due date?',
        parser: (input: string) => ({ dueDate: parseDate(input) || input.trim() })
    },
    {
        key: 'priority',
        question: 'Update priority?',
        options: ['High', 'Medium', 'Low'],
        parser: (input: string) => ({ priority: extractPriority(input) || input.trim().toLowerCase() })
    },
    {
        key: 'notes',
        question: 'Update notes? (optional)',
        optional: true,
        parser: (input: string) => ({ notes: input.trim() })
    }
];

const parseUpdate = (text: string) => {
    const updates: Record<string, any> = {};
    const dueDate = parseDate(text);
    if (dueDate) updates.dueDate = dueDate;
    const priority = extractPriority(text);
    if (priority) updates.priority = priority;
    if (text.toLowerCase().includes('rename')) {
        const match = text.match(/to\s+(.+)/i);
        if (match) updates.title = match[1].trim();
    }
    return updates;
};

const buildSummary = (action: string, data: Record<string, any>, target?: TargetMatch) => {
    const title = (data.title || target?.name || 'Task').toString().toUpperCase();
    const details = [
        { label: 'Task', value: data.title || target?.name || 'Untitled' },
        { label: 'Due', value: data.dueDate ? formatDateLabel(data.dueDate) : 'Not set' },
        { label: 'Priority', value: data.priority ? data.priority.toUpperCase() : 'MEDIUM' },
        { label: 'Notes', value: data.notes || 'None' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock(`${title} TASK`, details)}\n\nConfirm this task?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const data = loadLocalData(ctx.userId);
    const match = findLocalItemByName(data.tasks, name);
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createTask = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    const task = addLocalItem(ctx.userId, 'tasks', {
        title: data.title,
        dueDate: data.dueDate,
        priority: data.priority || 'medium',
        notes: data.notes,
        completed: false
    });

    const details = [
        { label: 'Due', value: task.dueDate ? formatDateLabel(task.dueDate) : 'Not set' },
        { label: 'Priority', value: (task.priority || 'medium').toUpperCase() },
        { label: 'Status', value: 'Open' }
    ];

    return {
        message: `${EMOJI.success} CREATED!\n${DIVIDER}\n\n${formatDetailsBlock(task.title.toUpperCase(), details)}`,
        actions: [
            { id: 'task-complete', label: 'Complete', value: `complete task ${task.title}`, kind: 'reply', variant: 'primary' },
            { id: 'task-edit', label: 'Edit', value: `edit task ${task.title}`, kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'task', id: task.id, name: task.title, data: task }
    };
};

const updateTask = async (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    const updated = updateLocalItem(ctx.userId, 'tasks', target.id!, {
        ...updates
    });
    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${updated?.title || target.name} updated.`,
        actions: [
            { id: 'task-view', label: 'View tasks', value: 'show tasks', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'task', id: target.id, name: updated?.title || target.name }
    };
};

const completeTask = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    updateLocalItem(ctx.userId, 'tasks', target.id!, { completed: true, completedAt: new Date().toISOString() });
    return {
        message: `${EMOJI.success} COMPLETED!\n${DIVIDER}\n\n${target.name} marked complete.`,
        actions: [
            { id: 'task-view', label: 'View tasks', value: 'show tasks', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'task', id: target.id, name: target.name }
    };
};

const removeTask = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    const removed = removeLocalItem(ctx.userId, 'tasks', target.id!);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} deleted.`,
        actions: [
            { id: 'task-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'task', data: removed }
    };
};

const viewTasks = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const data = loadLocalData(ctx.userId);
    if (!data.tasks.length) {
        return { message: `${EMOJI.info} No tasks yet.` };
    }
    const list = data.tasks
        .slice(0, 8)
        .map(task => `${task.completed ? '[x]' : '[ ]'} ${task.title}${task.dueDate ? ` (due ${formatDateLabel(task.dueDate)})` : ''}`)
        .join('\n');
    return {
        message: `\uD83D\uDCCA TASK LIST\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'task-create', label: 'Add task', value: 'add task', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreTask = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    const task = addLocalItem(ctx.userId, 'tasks', data);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${task.title} restored.`,
        entity: { type: 'task', id: task.id, name: task.title }
    };
};

export const TaskCreation: ChatHandler = {
    entity: 'task',
    label: 'Task',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createTask,
    update: updateTask,
    complete: completeTask,
    remove: removeTask,
    view: viewTasks,
    restore: restoreTask
};
