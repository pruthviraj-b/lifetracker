export type VideoStatus = 'unwatched' | 'in_progress' | 'watched';
export type VideoDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ResourceType = 'link' | 'article' | 'document' | 'other';
export type ResourceStatus = 'unread' | 'reading' | 'read';

export interface YouTubeVideo {
    id: string;
    userId: string;
    url: string;
    videoId: string;
    title: string;
    durationSeconds: number;
    thumbnailUrl: string;
    habitId?: string;
    folderId?: string;
    courseId?: string;
    taskId?: string;
    status: VideoStatus;
    watchProgress: number;
    sortOrder: number;
    difficulty: VideoDifficulty;
    rating?: number;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VideoNote {
    id: string;
    videoId: string;
    userId: string;
    timestampSeconds: number;
    content: string;
    tags: string[];
    createdAt: string;
}

export interface LearningFolder {
    id: string;
    userId: string;
    name: string;
    description?: string;
    color?: string;
    parentId?: string;
    iconName?: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LearningResource {
    id: string;
    userId: string;
    folderId?: string;
    habitId?: string;
    courseId?: string;
    type: ResourceType;
    title: string;
    url?: string;
    content?: string;
    status: ResourceStatus;
    createdAt: string;
    updatedAt: string;
}

export interface AddVideoInput {
    url: string;
    habitId?: string;
    folderId?: string;
    courseId?: string;
    difficulty?: VideoDifficulty;
}

export interface CreateFolderInput {
    name: string;
    description?: string;
    color?: string;
    parentId?: string;
    iconName?: string;
}

export interface CreateResourceInput {
    title: string;
    url?: string;
    type: ResourceType;
    folderId?: string;
    habitId?: string;
    courseId?: string;
}

export interface LearningCourse {
    id: string;
    userId: string;
    folderId?: string;
    title: string;
    description?: string;
    difficulty: VideoDifficulty;
    isLinear: boolean;
    isCompleted: boolean;
    certificateData?: any;
    createdAt: string;
    updatedAt: string;
}

export interface VideoPrerequisite {
    id: string;
    videoId: string;
    prerequisiteVideoId: string;
}

export interface CourseSeriesStats {
    totalVideos: number;
    completedVideos: number;
    completionPercentage: number;
    totalDurationSeconds: number;
    remainingDurationSeconds: number;
    nextVideoId?: string;
}

export interface LearningChannel {
    id: string;
    userId: string;
    channelId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    customUrl?: string;
    isFavorite: boolean;
    createdAt: string;
}

export interface CreateChannelInput {
    url: string;
    isFavorite?: boolean;
}
