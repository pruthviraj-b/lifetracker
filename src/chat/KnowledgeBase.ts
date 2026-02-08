import { NoteService } from '../services/note.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    extractName,
    formatDetailsBlock,
    formatHeader
} from './chatUtils';

const parseInput = (text: string) => {
    const title = extractName(text, ['note', 'knowledge', 'fact']);
    return {
        title: title || undefined,
        content: text.trim()
    };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'content',
        question: 'What should I save in your knowledge base?',
        parser: (input: string) => ({ content: input.trim() })
    },
    {
        key: 'category',
        question: 'Which category fits best?',
        options: ['General', 'Learning', 'Personal', 'Work'],
        parser: (input: string) => ({ category: input.trim().toLowerCase() })
    },
    {
        key: 'title',
        question: 'Give it a short title (optional)',
        optional: true,
        parser: (input: string) => ({ title: input.trim() })
    }
];

const getEditFields = (): FlowField[] => [
    {
        key: 'title',
        question: 'New title?',
        parser: (input: string) => ({ title: input.trim() })
    },
    {
        key: 'content',
        question: 'Updated content?',
        parser: (input: string) => ({ content: input.trim() })
    },
    {
        key: 'category',
        question: 'Update category?',
        parser: (input: string) => ({ category: input.trim().toLowerCase() })
    }
];

const parseUpdate = (text: string) => {
    const updates: Record<string, any> = {};
    if (text.toLowerCase().includes('category')) {
        updates.category = text.split('category').pop()?.trim();
    }
    return updates;
};

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Title', value: data.title || 'Knowledge Note' },
        { label: 'Category', value: (data.category || 'general').toUpperCase() },
        { label: 'Content', value: data.content?.slice(0, 120) || '...' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('KNOWLEDGE ENTRY', details)}\n\nSave this note?`;
};

const findTarget = async (name: string, _ctx: AssistantContext) => {
    const notes = await NoteService.getNotes();
    const match = notes.find(note => note.title.toLowerCase().includes(name.toLowerCase()));
    if (!match) return null;
    return { id: match.id, name: match.title, item: match };
};

const updateNote = async (target: TargetMatch, updates: Record<string, any>): Promise<ActionResult> => {
    await NoteService.updateNote(target.id!, {
        title: updates.title || target.name,
        content: updates.content || target.item.content,
        category: updates.category || target.item.category
    });
    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${target.name} updated.`,
        actions: [
            { id: 'kb-view', label: 'View notes', value: 'show knowledge base', kind: 'reply', variant: 'secondary' }
        ]
    };
};

const removeNote = async (target: TargetMatch): Promise<ActionResult> => {
    await NoteService.deleteNote(target.id!);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} deleted.`,
        actions: [
            { id: 'kb-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'knowledge', data: target.item }
    };
};

const restoreNote = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to restore.` };
    const note = await NoteService.createNote({
        title: data.title,
        content: data.content,
        category: data.category || 'general',
        color: data.color || '#f5f5f0',
        isPinned: data.isPinned || false
    } as any, ctx.userId);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${note.title} restored.`,
        entity: { type: 'knowledge', id: note.id, name: note.title }
    };
};

const createNote = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to save notes.` };
    const title = data.title || `Note: ${data.content?.slice(0, 20)}`;
    const note = await NoteService.createNote({
        title,
        content: data.content,
        category: data.category || 'general',
        color: '#f5f5f0',
        isPinned: false
    } as any, ctx.userId);

    const details = [
        { label: 'Category', value: (note.category || 'general').toUpperCase() },
        { label: 'Status', value: 'Saved' }
    ];

    return {
        message: `${EMOJI.success} SAVED!\n${DIVIDER}\n\n${formatDetailsBlock(note.title.toUpperCase(), details)}`,
        actions: [
            { id: 'kb-view', label: 'View knowledge base', value: 'show knowledge base', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'knowledge', id: note.id, name: note.title, data: note }
    };
};

const viewNotes = async (target: TargetMatch | null): Promise<ActionResult> => {
    const notes = await NoteService.getNotes();
    if (target?.id) {
        return {
            message: `\uD83D\uDCCA NOTE\n${DIVIDER}\n\n${target.name}\n${target.item.content}`,
            actions: [
                { id: 'kb-edit', label: 'Edit note', value: `edit note ${target.name}`, kind: 'reply', variant: 'secondary' }
            ]
        };
    }
    const list = notes.slice(0, 6).map(note => `- ${note.title}`).join('\n');
    return {
        message: `\uD83D\uDCCA KNOWLEDGE BASE\n${DIVIDER}\n\n${list || 'No notes yet.'}`,
        actions: [
            { id: 'kb-add', label: 'Add note', value: 'add note', kind: 'reply', variant: 'primary' }
        ]
    };
};

export const KnowledgeBase: ChatHandler = {
    entity: 'knowledge',
    label: 'Knowledge Base',
    parseInput,
    parseUpdate,
    getCreateFields,
    getEditFields,
    buildSummary,
    findTarget,
    create: createNote,
    update: updateNote,
    remove: removeNote,
    view: viewNotes,
    restore: restoreNote
};
