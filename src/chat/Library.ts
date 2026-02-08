import { LibraryService } from '../services/library.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    formatDetailsBlock,
    formatHeader
} from './chatUtils';

const parseInput = (text: string) => ({
    title: text.trim()
});

const getCreateFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'What resource should I save?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'url',
        question: 'Any link to attach? (optional)',
        optional: true,
        parser: (input: string) => ({ url: input.trim() })
    },
    {
        key: 'category',
        question: 'Category?',
        optional: true,
        parser: (input: string) => ({ category: input.trim() })
    }
];

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Title', value: data.title || 'Resource' },
        { label: 'Category', value: data.category || 'General' },
        { label: 'Link', value: data.url || 'None' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('LIBRARY ITEM', details)}\n\nSave this resource?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const items = await LibraryService.getItems(ctx.userId);
    const normalized = name.toLowerCase();
    const match = items.find(item => item.title.toLowerCase().includes(normalized));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const createLibraryItem = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to save resources.` };
    const item = await LibraryService.createItem({
        title: data.title,
        url: data.url,
        category: data.category || 'general'
    }, ctx.userId);
    const details = [
        { label: 'Category', value: item.category || 'general' },
        { label: 'Link', value: item.url || 'None' }
    ];
    return {
        message: `${EMOJI.success} SAVED!\n${DIVIDER}\n\n${formatDetailsBlock(item.title.toUpperCase(), details)}`,
        actions: [
            { id: 'library-view', label: 'View library', value: 'show library', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'library', id: item.id, name: item.title, data: item }
    };
};

const removeLibraryItem = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    if (!target.id) return { message: `${EMOJI.warning} Item not found.` };
    await LibraryService.deleteItem(target.id);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} removed from library.`,
        actions: [
            { id: 'library-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'library', data: target.item }
    };
};

const viewLibrary = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const items = await LibraryService.getItems(ctx.userId);
    if (!items.length) return { message: `${EMOJI.info} No library items yet.` };
    const list = items.slice(0, 8).map((item: any) => `- ${item.title}${item.url ? ` (${item.url})` : ''}`).join('\n');
    return {
        message: `\uD83D\uDCD6 LIBRARY\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'library-add', label: 'Save resource', value: 'save to library', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreLibraryItem = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const item = await LibraryService.createItem({
        title: data.title,
        url: data.url,
        category: data.category
    }, ctx.userId);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${item.title} restored.`,
        entity: { type: 'library', id: item.id, name: item.title }
    };
};

export const Library: ChatHandler = {
    entity: 'library',
    label: 'Library',
    parseInput,
    getCreateFields,
    buildSummary,
    findTarget,
    create: createLibraryItem,
    remove: removeLibraryItem,
    view: viewLibrary,
    restore: restoreLibraryItem
};
