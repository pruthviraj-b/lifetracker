import { supabase } from '../lib/supabase';
import {
    LearningFolder,
    LearningResource,
    CreateFolderInput,
    CreateResourceInput,
    YouTubeVideo
} from '../types/youtube';

export const LearningService = {
    // FOLDERS
    async getFolders(): Promise<LearningFolder[]> {
        const { data, error } = await supabase
            .from('learning_folders')
            .select('*')
            .order('name');

        if (error) throw error;
        return data.map(this.mapFolder);
    },

    async createFolder(input: CreateFolderInput): Promise<LearningFolder> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('learning_folders')
            .insert({
                user_id: user.id,
                name: input.name,
                description: input.description,
                color: input.color,
                parent_id: input.parentId,
                icon_name: input.iconName
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapFolder(data);
    },

    async updateFolder(id: string, input: Partial<CreateFolderInput>): Promise<void> {
        const { error } = await supabase
            .from('learning_folders')
            .update({
                name: input.name,
                description: input.description,
                color: input.color,
                parent_id: input.parentId,
                icon_name: input.iconName,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteFolder(id: string): Promise<void> {
        const { error } = await supabase
            .from('learning_folders')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // RESOURCES
    async getResources(folderId?: string): Promise<LearningResource[]> {
        let query = supabase.from('learning_resources').select('*');
        if (folderId) query = query.eq('folder_id', folderId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(this.mapResource);
    },

    async createResource(input: CreateResourceInput): Promise<LearningResource> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('learning_resources')
            .insert({
                user_id: user.id,
                folder_id: input.folderId,
                habit_id: input.habitId,
                type: input.type,
                title: input.title,
                url: input.url,
                status: 'unread'
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapResource(data);
    },

    async updateResource(id: string, updates: Partial<LearningResource>): Promise<void> {
        const { error } = await supabase
            .from('learning_resources')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        if (error) throw error;
    },

    async moveResourceToFolder(id: string, folderId: string | null): Promise<void> {
        const { error } = await supabase
            .from('learning_resources')
            .update({ folder_id: folderId, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteResource(id: string): Promise<void> {
        const { error } = await supabase
            .from('learning_resources')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // INTEGRATED VIEW
    async getFolderContent(folderId: string): Promise<{
        videos: YouTubeVideo[],
        resources: LearningResource[]
    }> {
        const [videosRes, resourcesRes] = await Promise.all([
            supabase.from('youtube_videos').select('*').eq('folder_id', folderId),
            supabase.from('learning_resources').select('*').eq('folder_id', folderId)
        ]);

        if (videosRes.error) throw videosRes.error;
        if (resourcesRes.error) throw resourcesRes.error;

        return {
            videos: videosRes.data.map(this.mapVideo),
            resources: resourcesRes.data.map(this.mapResource)
        };
    },

    // MAPPERS
    mapFolder(f: any): LearningFolder {
        return {
            id: f.id,
            userId: f.user_id,
            name: f.name,
            description: f.description,
            color: f.color,
            parentId: f.parent_id,
            iconName: f.icon_name,
            isFavorite: f.is_favorite,
            createdAt: f.created_at,
            updatedAt: f.updated_at
        };
    },

    mapResource(r: any): LearningResource {
        return {
            id: r.id,
            userId: r.user_id,
            folderId: r.folder_id,
            habitId: r.habit_id,
            type: r.type,
            title: r.title,
            url: r.url,
            content: r.content,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        };
    },

    mapVideo(v: any): YouTubeVideo {
        return {
            id: v.id,
            userId: v.user_id,
            url: v.url,
            videoId: v.video_id,
            title: v.title,
            durationSeconds: v.duration_seconds,
            thumbnailUrl: v.thumbnail_url,
            habitId: v.habit_id,
            folderId: v.folder_id,
            courseId: v.course_id,
            taskId: v.task_id,
            status: v.status,
            watchProgress: v.watch_progress,
            sortOrder: v.sort_order || 0,
            difficulty: v.difficulty,
            rating: v.rating,
            isArchived: v.is_archived,
            createdAt: v.created_at,
            updatedAt: v.updated_at
        };
    }
};
