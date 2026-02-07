import { supabase } from '../lib/supabase';
import { Note, CreateNoteInput, NoteFolder } from '../types/note';
import { MultiverseService } from './multiverse.service';

export const NoteService = {
    async getNotes(): Promise<Note[]> {
        // Fetch standalone notes
        const { data: standalone, error: err1 } = await supabase
            .from('notes')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('updated_at', { ascending: false });

        if (err1) throw err1;

        // Fetch video notes with video titles
        const { data: videoNotes, error: err2 } = await supabase
            .from('video_notes')
            .select(`
                *,
                youtube_videos (
                    title
                )
            `)
            .order('created_at', { ascending: false });

        if (err2) throw err2;

        const standaloneMapped: Note[] = (standalone || []).map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            content: n.content,
            category: n.category as any,
            color: n.color,
            isPinned: n.is_pinned,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
            folderId: n.folder_id,
            type: 'standalone'
        }));

        const videoMapped: Note[] = (videoNotes || []).map(n => ({
            id: n.id,
            userId: n.user_id,
            title: `Note: ${n.youtube_videos?.title || 'Video'}`,
            content: n.content,
            category: 'learning' as any,
            color: 'blue',
            isPinned: false,
            createdAt: n.created_at,
            updatedAt: n.created_at,
            video_id: n.video_id,
            video_title: n.youtube_videos?.title,
            timestamp_seconds: n.timestamp_seconds,
            type: 'youtube'
        }));

        // Merge and sort
        return [...standaloneMapped, ...videoMapped].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    },

    async createNote(note: CreateNoteInput, userId: string): Promise<Note> {
        if (!userId) throw new Error('User ID is required');

        const { data, error } = await supabase
            .from('notes')
            .insert({
                user_id: userId,
                title: note.title,
                content: note.content,
                category: note.category,
                color: note.color,
                is_pinned: note.isPinned || false
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            throw new Error(`Failed to create note: ${error.message}`);
        }

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            content: data.content,
            category: data.category as any,
            color: data.color,
            isPinned: data.is_pinned,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async updateNote(id: string, updates: Partial<Note>): Promise<void> {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.content !== undefined) payload.content = updates.content;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.color !== undefined) payload.color = updates.color;
        if (updates.isPinned !== undefined) payload.is_pinned = updates.isPinned;

        const { error } = await supabase
            .from('notes')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteNote(id: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getFolders(): Promise<NoteFolder[]> {
        const { data, error } = await supabase
            .from('note_folders')
            .select('*')
            .order('name');
        if (error) throw error;
        return (data || []).map(f => ({
            id: f.id,
            userId: f.user_id,
            name: f.name,
            color: f.color,
            icon: f.icon,
            createdAt: f.created_at
        }));
    },

    async createFolder(name: string, userId: string, color: string = 'gray', icon: string = 'folder'): Promise<NoteFolder> {
        if (!userId) throw new Error('No user logged in');
        const { data, error } = await supabase
            .from('note_folders')
            .insert({ user_id: userId, name, color, icon })
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            color: data.color,
            icon: data.icon,
            createdAt: data.created_at
        };
    },

    async deleteFolder(id: string): Promise<void> {
        const { error } = await supabase.from('note_folders').delete().eq('id', id);
        if (error) throw error;
    }
};
