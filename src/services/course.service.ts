import { supabase } from '../lib/supabase';
import {
    LearningCourse,
    CourseSeriesStats
} from '../types/youtube';

export const CourseService = {
    async getCourses(): Promise<LearningCourse[]> {
        const { data, error } = await supabase
            .from('learning_courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapCourse);
    },

    async createCourse(input: { title: string, description?: string, folderId?: string, difficulty?: string }): Promise<LearningCourse> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('learning_courses')
            .insert({
                user_id: user.id,
                folder_id: input.folderId,
                title: input.title,
                description: input.description,
                difficulty: input.difficulty || 'intermediate'
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapCourse(data);
    },

    async addVideoToCourse(videoId: string, courseId: string, sortOrder: number): Promise<void> {
        const { error } = await supabase
            .from('youtube_videos')
            .update({ course_id: courseId, sort_order: sortOrder })
            .eq('id', videoId);
        if (error) throw error;
    },

    async setPrerequisite(videoId: string, prerequisiteVideoId: string): Promise<void> {
        const { error } = await supabase
            .from('video_prerequisites')
            .insert({
                video_id: videoId,
                prerequisite_video_id: prerequisiteVideoId
            });
        if (error) throw error;
    },

    async getCourseStats(courseId: string): Promise<CourseSeriesStats> {
        const { data: videos, error } = await supabase
            .from('youtube_videos')
            .select('*')
            .eq('course_id', courseId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        if (!videos || videos.length === 0) {
            return {
                totalVideos: 0,
                completedVideos: 0,
                completionPercentage: 0,
                totalDurationSeconds: 0,
                remainingDurationSeconds: 0
            };
        }

        const completed = videos.filter(v => v.status === 'watched');
        const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);
        const watchedDuration = videos.reduce((acc, v) => acc + (v.status === 'watched' ? (v.duration_seconds || 0) : (v.watch_progress || 0)), 0);

        const nextVideo = videos.find(v => v.status !== 'watched');

        return {
            totalVideos: videos.length,
            completedVideos: completed.length,
            completionPercentage: Math.round((completed.length / videos.length) * 100),
            totalDurationSeconds: totalDuration,
            remainingDurationSeconds: Math.max(0, totalDuration - watchedDuration),
            nextVideoId: nextVideo?.id
        };
    },

    async checkPrerequisitesMet(videoId: string): Promise<boolean> {
        const { data: prerequisites, error } = await supabase
            .from('video_prerequisites')
            .select('prerequisite_video_id')
            .eq('video_id', videoId);

        if (error) throw error;
        if (!prerequisites || prerequisites.length === 0) return true;

        const { data: prereqVideos, error: videoError } = await supabase
            .from('youtube_videos')
            .select('status')
            .in('id', prerequisites.map(p => p.prerequisite_video_id));

        if (videoError) throw videoError;
        return prereqVideos.every(v => v.status === 'watched');
    },

    mapCourse(c: any): LearningCourse {
        return {
            id: c.id,
            userId: c.user_id,
            folderId: c.folder_id,
            title: c.title,
            description: c.description,
            difficulty: c.difficulty,
            isLinear: c.is_linear,
            isCompleted: c.is_completed,
            certificateData: c.certificate_data,
            createdAt: c.created_at,
            updatedAt: c.updated_at
        };
    }
};
