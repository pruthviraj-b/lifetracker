import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    formatDetailsBlock,
    formatHeader,
    loadLocalData,
    addLocalItem,
    removeLocalItem,
    findLocalItemByName
} from './chatUtils';

const parseInput = (text: string) => ({
    content: text.trim()
});

const getCreateFields = (): FlowField[] => [
    {
        key: 'content',
        question: 'What should I remember?',
        parser: (input: string) => ({ content: input.trim() })
    },
    {
        key: 'category',
        question: 'Optional category?',
        optional: true,
        parser: (input: string) => ({ category: input.trim() })
    }
];

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Memory', value: data.content?.slice(0, 120) || '' },
        { label: 'Category', value: data.category || 'General' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('MEMORY', details)}\n\nSave this memory?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const data = loadLocalData(ctx.userId);
    const match = findLocalItemByName(data.recall, name);
    if (!match) return null;
    return { id: match.id, name: match.title || match.content?.slice(0, 24), item: match };
};

const createRecall = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    const memory = addLocalItem(ctx.userId, 'recall', {
        content: data.content,
        category: data.category || 'General'
    });
    const details = [
        { label: 'Saved', value: 'Yes' },
        { label: 'Category', value: memory.category }
    ];
    return {
        message: `${EMOJI.success} REMEMBERED!\n${DIVIDER}\n\n${formatDetailsBlock('MEMORY SAVED', details)}`,
        actions: [
            { id: 'recall-view', label: 'View memories', value: 'show my journal', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'recall', id: memory.id, name: memory.content?.slice(0, 24), data: memory }
    };
};

const removeRecall = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    const removed = removeLocalItem(ctx.userId, 'recall', target.id!);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\nMemory removed.`,
        actions: [
            { id: 'recall-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'recall', data: removed }
    };
};

const viewRecall = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const data = loadLocalData(ctx.userId);
    if (!data.recall.length) return { message: `${EMOJI.info} No memories yet.` };
    const list = data.recall.slice(0, 6).map((entry: any) => `- ${entry.content}`).join('\n');
    return {
        message: `\uD83D\uDCCA JOURNAL\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'recall-add', label: 'Add memory', value: 'add journal entry', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreRecall = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    const memory = addLocalItem(ctx.userId, 'recall', data);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\nMemory restored.`,
        entity: { type: 'recall', id: memory.id, name: memory.content?.slice(0, 24) }
    };
};

export const Recall: ChatHandler = {
    entity: 'recall',
    label: 'Recall',
    parseInput,
    getCreateFields,
    buildSummary,
    findTarget,
    create: createRecall,
    remove: removeRecall,
    view: viewRecall,
    restore: restoreRecall
};
