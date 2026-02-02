export type NoteCategory = 'general' | 'work' | 'personal' | 'idea' | 'list';

export interface Note {
    id: string;
    userId: string;
    title: string;
    content: string;
    category: NoteCategory;
    color: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    // YouTube Integration
    video_id?: string;
    video_title?: string;
    timestamp_seconds?: number;
    type?: 'standalone' | 'youtube';
    folderId?: string;
}

export interface NoteFolder {
    id: string;
    userId: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
}

export type CreateNoteInput = Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isPinned'> & {
    isPinned?: boolean;
};
