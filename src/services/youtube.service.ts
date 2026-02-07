import { supabase } from '../lib/supabase';
import { YouTubeVideo, VideoNote, AddVideoInput, LearningChannel } from '../types/youtube';

export const YouTubeService = {
    parseVideoId(url: string): string | null {
        if (!url) return null;
        const cleanUrl = url.trim();
        // Supports: regular watch URLs, shorts, embeds, live streams, youtu.be shortlinks, and mobile URLs
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = cleanUrl.match(regExp);
        return match ? match[1] : null;
    },

    async fetchMetadata(videoId: string) {
        try {
            // Using oEmbed for basic metadata without needing a YouTube Data API Key
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('Failed to fetch video metadata');
            const data = await response.json();
            return {
                title: data.title || 'Untitled Video',
                thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                author: data.author_name
            };
        } catch (error) {
            console.error('Metadata fetch error:', error);
            return {
                title: 'Untitled Video',
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                author: 'Unknown'
            };
        }
    },

    async addVideo(input: AddVideoInput): Promise<YouTubeVideo> {
        const videoId = this.parseVideoId(input.url);
        if (!videoId) throw new Error('Invalid YouTube URL');

        const metadata = await this.fetchMetadata(videoId);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('youtube_videos')
                .insert({
                    user_id: user.id,
                    url: input.url,
                    video_id: videoId,
                    title: metadata.title,
                    thumbnail_url: metadata.thumbnailUrl,
                    habit_id: input.habitId,
                    folder_id: input.folderId,
                    course_id: input.courseId,
                    difficulty: input.difficulty || 'beginner',
                    status: 'unwatched'
                })
                .select()
                .single();

            if (error) {
                console.error("YouTubeService.addVideo DB Error:", error);
                throw error;
            }
            return this.mapVideo(data);
        } catch (err: any) {
            console.error("YouTubeService.addVideo Exception:", err);
            throw err;
        }
    },

    async getFolders(): Promise<any[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('learning_folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (error) {
            console.warn("Failed to fetch youtube folders:", error);
            return [];
        }
        return data || [];
    },

    async createFolder(name: string): Promise<any> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('learning_folders')
            .insert({
                user_id: user.id,
                name: name,
                is_favorite: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getVideos(habitId?: string): Promise<YouTubeVideo[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        let query = supabase.from('youtube_videos')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_archived', false);

        if (habitId) query = query.eq('habit_id', habitId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(v => this.mapVideo(v));
    },

    async getVideoDetails(id: string): Promise<YouTubeVideo | null> {
        const { data, error } = await supabase
            .from('youtube_videos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error("YouTubeService.getVideoDetails Error:", error);
            return null;
        }
        return this.mapVideo(data);
    },

    async updateProgress(id: string, progress: number, status: string, duration?: number): Promise<void> {
        const updateData: any = {
            watch_progress: progress,
            status: status,
            updated_at: new Date().toISOString()
        };
        if (duration) updateData.duration_seconds = duration;

        const { error } = await supabase
            .from('youtube_videos')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error("YouTubeService.updateProgress Error:", error);
            throw error;
        }
    },

    async addNote(videoId: string, timestamp: number, content: string): Promise<VideoNote> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('video_notes')
            .insert({
                video_id: videoId,
                user_id: user.id,
                timestamp_seconds: timestamp,
                content: content
            })
            .select()
            .single();

        if (error) {
            console.error("YouTubeService.addNote Error:", error);
            throw error;
        }
        return this.mapNote(data);
    },

    async getNotes(videoId: string): Promise<VideoNote[]> {
        const { data, error } = await supabase
            .from('video_notes')
            .select('*')
            .eq('video_id', videoId)
            .order('timestamp_seconds', { ascending: true });
        if (error) throw error;
        return (data || []).map(n => this.mapNote(n));
    },

    async deleteVideo(id: string): Promise<void> {
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async moveVideoToFolder(id: string, folderId: string | null): Promise<void> {
        const { error } = await supabase
            .from('youtube_videos')
            .update({ folder_id: folderId, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    async getChannels(): Promise<LearningChannel[]> {
        const { data, error } = await supabase
            .from('learning_channels')
            .select('*')
            .order('title');

        if (error) {
            console.warn("Failed to fetch channels:", error);
            return [];
        }
        return (data || []).map(c => this.mapChannel(c));
    },

    async createChannel(title: string, url: string): Promise<LearningChannel> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('learning_channels')
            .insert({
                user_id: user.id,
                title: title,
                custom_url: url,
                channel_id: 'manual-' + Date.now(), // Placeholder, or extract from URL
                is_favorite: true
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapChannel(data);
    },

    async deleteChannel(id: string): Promise<void> {
        const { error } = await supabase
            .from('learning_channels')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    mapChannel(c: any): LearningChannel {
        return {
            id: c.id,
            userId: c.user_id,
            channelId: c.channel_id,
            title: c.title,
            description: c.description,
            thumbnailUrl: c.thumbnail_url,
            customUrl: c.custom_url,
            isFavorite: c.is_favorite,
            createdAt: c.created_at
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
    },

    mapNote(n: any): VideoNote {
        return {
            id: n.id,
            videoId: n.video_id,
            userId: n.user_id,
            timestampSeconds: n.timestamp_seconds,
            content: n.content,
            tags: n.tags || [],
            createdAt: n.created_at
        };
    }
};
