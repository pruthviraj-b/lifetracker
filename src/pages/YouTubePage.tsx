import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    ArrowLeft,
    Youtube,
    Plus,
    Search,
    Play,
    Clock,
    Folder,
    MoreVertical,
    ChevronRight,
    LayoutGrid,
    History,
    FileText,
    ExternalLink,
    BookOpen,
    Eye,
    Trash2,
    Move,
    GraduationCap,
    Award,
    CheckCircle2,
    Lock,
    Home,
    Bell
} from 'lucide-react';
import { ReminderService } from '../services/reminder.service';
import { ReminderModal } from '../components/tools/ReminderModal';
import { Reminder } from '../types/reminder';
import { YouTubeService } from '../services/youtube.service';
import { LearningService } from '../services/learning.service';
import { CourseService } from '../services/course.service';
import { HabitService } from '../services/habit.service';
import { MultiverseService } from '../services/multiverse.service';
import { useTheme } from '../context/ThemeContext';
import {
    YouTubeVideo,
    LearningFolder,
    LearningResource,
    ResourceType,
    LearningCourse,
    CourseSeriesStats,
    LearningChannel
} from '../types/youtube';
import { Habit } from '../types/habit';
import { VideoPlayerModal } from '../components/youtube/VideoPlayerModal';
import { QuickViewModal } from '../components/youtube/QuickViewModal';
import { CourseCertificate } from '../components/youtube/CourseCertificate';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { ThemedCard } from '../components/ui/ThemedCard';
import { Users, X } from 'lucide-react';

export default function YouTubePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    // Data State
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [folders, setFolders] = useState<LearningFolder[]>([]);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [courses, setCourses] = useState<LearningCourse[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [channels, setChannels] = useState<LearningChannel[]>([]);
    const [activeCourseStats, setActiveCourseStats] = useState<CourseSeriesStats | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addType, setAddType] = useState<'video' | 'folder' | 'resource' | 'course' | 'channel'>('video');
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingItem, setMovingItem] = useState<{ id: string, type: 'video' | 'resource' } | null>(null);

    // Reminder State
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [prefilledReminder, setPrefilledReminder] = useState<Partial<Reminder> | undefined>(undefined);

    // Selection state
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
    const [previewVideo, setPreviewVideo] = useState<YouTubeVideo | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Form state
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [newResTitle, setNewResTitle] = useState('');
    const [newResUrl, setNewResUrl] = useState('');
    const [newResType, setNewResType] = useState<ResourceType>('link');
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newChannelTitle, setNewChannelTitle] = useState('');
    const [newChannelUrl, setNewChannelUrl] = useState('');
    const [targetHabitId, setTargetHabitId] = useState<string>('');
    const [targetFolderId, setTargetFolderId] = useState<string>('');
    const [targetCourseId, setTargetCourseId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) setUserEmail(user.email);
        };
        fetchUser();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [v, f, r, c, h, ch] = await Promise.all([
                YouTubeService.getVideos(),
                LearningService.getFolders(),
                LearningService.getResources(),
                CourseService.getCourses(),
                HabitService.getHabits(),
                YouTubeService.getChannels()
            ]);
            setVideos(v);
            setFolders(f);
            setResources(r);
            setCourses(c);
            setHabits(h);
            setChannels(ch);
        } catch (error: any) {
            console.error(error);
            showToast('Error', 'Failed to load library', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Deep Link Handler
    useEffect(() => {
        if (!loading && videos.length > 0) {
            const videoIdParam = searchParams.get('videoId');
            if (videoIdParam) {
                const video = videos.find(v => v.id === videoIdParam);
                if (video) {
                    setSelectedVideo(video);
                    // Clear param to avoid re-opening
                    setSearchParams({}, { replace: true });
                }
            }
        }
    }, [loading, videos, searchParams, setSearchParams]);

    useEffect(() => {
        if (!loading && resources.length > 0) {
            const resourceIdParam = searchParams.get('resourceId');
            if (resourceIdParam) {
                const res = resources.find(r => r.id === resourceIdParam);
                if (res && res.url) {
                    window.open(res.url, '_blank');
                    // Clear param
                    setSearchParams({}, { replace: true });
                }
            }
        }
    }, [loading, resources, searchParams, setSearchParams]);

    useEffect(() => {
        if (!loading && folders.length > 0) {
            const folderIdParam = searchParams.get('folderId');
            if (folderIdParam) {
                const folder = folders.find(f => f.id === folderIdParam);
                if (folder) {
                    setActiveFolderId(folder.id);
                    // Clear param
                    setSearchParams({}, { replace: true });
                }
            }
        }
    }, [loading, folders, searchParams, setSearchParams]);

    useEffect(() => {
        if (activeCourseId) {
            loadCourseStats(activeCourseId);
        } else {
            setActiveCourseStats(null);
        }
    }, [activeCourseId, videos]);

    const loadCourseStats = async (courseId: string) => {
        try {
            const stats = await CourseService.getCourseStats(courseId);
            setActiveCourseStats(stats);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (addType === 'video') {
                if (!newVideoUrl) return;
                const v = await YouTubeService.addVideo({
                    url: newVideoUrl,
                    folderId: targetFolderId || undefined,
                    habitId: targetHabitId || undefined,
                    courseId: targetCourseId || undefined
                });

                // MULTIVERSE LINK: Video -> Habit
                if (targetHabitId) {
                    await MultiverseService.createLink({
                        sourceType: 'video',
                        sourceId: v.id,
                        targetType: 'habit',
                        targetId: targetHabitId,
                        relationType: 'reference'
                    });
                }
                setNewVideoUrl('');
            } else if (addType === 'folder') {
                if (!newFolderName) return;
                await LearningService.createFolder({ name: newFolderName });
                setNewFolderName('');
            } else if (addType === 'resource') {
                if (!newResTitle) return;
                const r = await LearningService.createResource({
                    title: newResTitle,
                    url: newResUrl,
                    type: newResType,
                    folderId: targetFolderId || undefined,
                    habitId: targetHabitId || undefined
                });

                // MULTIVERSE LINK: Resource -> Habit
                if (targetHabitId) {
                    await MultiverseService.createLink({
                        sourceType: 'note', // Treat links as notes/references
                        sourceId: r.id,
                        targetType: 'habit',
                        targetId: targetHabitId,
                        relationType: 'reference'
                    });
                }

                setNewResTitle('');
                setNewResUrl('');
            } else if (addType === 'course') {
                if (!newCourseTitle) return;
                await CourseService.createCourse({
                    title: newCourseTitle,
                    folderId: targetFolderId || undefined
                });
                setNewCourseTitle('');
            } else if (addType === 'channel') {
                if (!newChannelTitle || !newChannelUrl) return;
                await YouTubeService.createChannel(newChannelTitle, newChannelUrl);
                setNewChannelTitle('');
                setNewChannelUrl('');
            }

            resetForm();
            setIsAddModalOpen(false);
            loadData();
            showToast('Success', 'Matrix updated', { type: 'success' });
        } catch (error: any) {
            console.error("Inject Node Failed:", error);
            showToast('Error', 'Update failed: ' + (error.message || 'Unknown error'), { type: 'error' });
        }
    };

    const handleDelete = async (id: string, type: 'video' | 'resource' | 'folder' | 'course' | 'channel') => {
        if (!confirm('Abort this module?')) return;

        try {
            if (type === 'video') await YouTubeService.deleteVideo(id);
            else if (type === 'resource') await LearningService.deleteResource(id);
            else if (type === 'folder') {
                await LearningService.deleteFolder(id);
                if (activeFolderId === id) setActiveFolderId(null);
            } else if (type === 'course') {
                await CourseService.deleteCourse(id);
                if (activeCourseId === id) setActiveCourseId(null);
            } else if (type === 'channel') {
                await YouTubeService.deleteChannel(id);
            }
            loadData();
            showToast('Success', 'Module purged', { type: 'success' });
        } catch (error: any) {
            showToast('Error', 'Purge failed', { type: 'error' });
        }
    };

    const handleMove = async (newFolderId: string | null) => {
        if (!movingItem) return;
        try {
            if (movingItem.type === 'video') {
                await YouTubeService.moveVideoToFolder(movingItem.id, newFolderId);
            } else {
                await LearningService.updateResource(movingItem.id, { folderId: newFolderId || undefined });
            }
            setIsMoveModalOpen(false);
            setMovingItem(null);
            loadData();
            showToast('Success', 'Spatial relocation complete', { type: 'success' });
        } catch (error: any) {
            showToast('Error', 'Relocation failed', { type: 'error' });
        }
    };

    const handleOpenReminder = (item: any, type: 'video' | 'course' | 'resource' | 'folder') => {
        setPrefilledReminder({
            title: `Study: ${item.title || item.name || 'Untitled'}`,
            videoId: type === 'video' ? item.id : undefined,
            courseId: type === 'course' ? item.id : undefined,
            resourceId: type === 'resource' ? item.id : undefined,
            folderId: type === 'folder' ? item.id : undefined
        });
        setIsReminderModalOpen(true);
    };

    const handleSaveReminder = async (data: any) => {
        try {
            await ReminderService.createReminder({ ...data, isEnabled: true });
            showToast('Success', 'Temporal trigger initialized', { type: 'success' });
            setIsReminderModalOpen(false);
        } catch (error: any) {
            showToast('Error', 'Protocol failure: ' + error.message, { type: 'error' });
        }
    };

    const resetForm = () => {
        setNewVideoUrl('');
        setNewFolderName('');
        setNewResTitle('');
        setNewResUrl('');
        setNewCourseTitle('');
        setNewChannelTitle('');
        setNewChannelUrl('');
        setTargetHabitId('');
        setTargetFolderId('');
        setTargetCourseId('');
    };

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = activeFolderId ? v.folderId === activeFolderId : true;
        const matchesCourse = activeCourseId ? v.courseId === activeCourseId : true;
        return matchesSearch && matchesFolder && matchesCourse;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = activeFolderId ? r.folderId === activeFolderId : true;
        return matchesSearch && matchesFolder;
    });

    const activeFolder = folders.find(f => f.id === activeFolderId);
    const activeCourse = courses.find(c => c.id === activeCourseId);

    const displayedFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedCourses = courses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = activeFolderId ? c.folderId === activeFolderId : true;
        return matchesSearch && matchesFolder;
    });

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2 border-primary/20' : ''}`} onClick={() => navigate('/')}>
                        <Home className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className={`text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Archive Matrix</h1>
                        <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-[0.3em] opacity-60">Neural Storage & Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Scan matrix..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-11 h-11 bg-card border-2 ${isWild ? 'rounded-none border-primary/20' : 'rounded-xl border-transparent'}`}
                        />
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className={`h-11 px-8 text-[11px] font-black uppercase tracking-widest ${isWild ? 'rounded-none border-2 shadow-[0_0_15px_rgba(255,0,0,0.15)]' : 'rounded-xl'}`}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Inject Node
                    </Button>
                </div>
            </div>

            {/* Mentors / Channels Section */}
            {channels.length > 0 && !activeFolderId && !activeCourseId && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Neural Mentors
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {channels.map(channel => (
                            <a
                                key={channel.id}
                                href={channel.customUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 pr-6 bg-card border rounded-full hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all shrink-0 group relative min-w-[200px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 font-bold border border-red-500/20">
                                    {channel.title.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold truncate max-w-[150px]">{channel.title}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Direct Link</div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(channel.id, 'channel');
                                    }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-card border hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Breadcrumbs & Special Controls */}
            {(activeFolderId || activeCourseId) && (
                <div className="flex flex-wrap items-center gap-3 animate-in slide-in-from-left-4">
                    <button
                        onClick={() => { setActiveFolderId(null); setActiveCourseId(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors"
                    >
                        <LayoutGrid className="w-4 h-4" /> Root_Matrix
                    </button>
                    {activeFolderId && activeFolder && (
                        <div className="flex items-center gap-3">
                            <ChevronRight className="w-4 h-4 opacity-30" />
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                <Folder className="w-4 h-4" /> {activeFolder.name}
                            </div>
                        </div>
                    )}
                    {activeCourseId && activeCourse && (
                        <div className="flex items-center gap-3">
                            <ChevronRight className="w-4 h-4 opacity-30" />
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                <GraduationCap className="w-4 h-4" /> {activeCourse.title}
                            </div>
                        </div>
                    )}
                    {activeCourseStats?.completionPercentage === 100 && (
                        <Button
                            size="sm"
                            className="ml-auto bg-green-500 text-black hover:bg-green-400 font-black h-8 px-4 rounded-lg uppercase text-[10px]"
                            onClick={() => setShowCertificate(true)}
                        >
                            <Award className="w-4 h-4 mr-2" /> Verify Sequence
                        </Button>
                    )}
                </div>
            )}

            {/* Matrix Content */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`h-48 animate-pulse bg-muted/20 ${isWild ? 'rounded-none border-2 border-primary/10' : 'rounded-[2rem]'}`} />
                        ))}
                    </div>
                ) : (filteredVideos.length === 0 && filteredResources.length === 0 && displayedFolders.length === 0 && displayedCourses.length === 0) ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed flex flex-col items-center justify-center space-y-6">
                        <div className="p-5 bg-primary/10 rounded-3xl">
                            <GraduationCap className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Your curriculum path is open</h2>
                            <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                Create a course or collection to start organizing your mastery journey.
                            </p>
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Content
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Folders Display */}
                        {!activeFolderId && !activeCourseId && displayedFolders.map(folder => (
                            <ThemedCard
                                key={folder.id}
                                interactive
                                onClick={() => setActiveFolderId(folder.id)}
                                className="group h-full relative"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-primary/10 rounded-xl">
                                            <Folder className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReminder(folder, 'folder'); }}
                                                className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                            >
                                                <Bell className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight truncate">{folder.name}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Cluster Segment
                                        </p>
                                    </div>
                                </div>
                            </ThemedCard>
                        ))}

                        {/* Courses Display */}
                        {!activeFolderId && !activeCourseId && displayedCourses.map(course => (
                            <ThemedCard
                                key={course.id}
                                interactive
                                onClick={() => setActiveCourseId(course.id)}
                                className="group h-full relative border-green-500/20"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-green-500/10 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReminder(course, 'course'); }}
                                                className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                            >
                                                <Bell className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(course.id, 'course'); }}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-tight line-clamp-2 leading-tight">{course.title}</h3>
                                        {course.isCompleted && (
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black text-green-500 uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Sequence Complete
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ThemedCard>
                        ))}

                        {/* Videos */}
                        {filteredVideos.map(video => (
                            <ThemedCard
                                key={video.id}
                                noPadding
                                className="group h-full flex flex-col overflow-hidden"
                            >
                                <div
                                    className="relative aspect-video bg-muted cursor-pointer group-hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black">
                                            <Play className="w-6 h-6 fill-current" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-[10px] font-mono font-bold rounded">
                                        {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>

                                <div className="p-6 space-y-4 flex-1 flex flex-col">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-lg font-black uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {video.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Eye className="w-3.5 h-3.5" /> {formatWatchTime(video.watchProgress)}
                                            </div>
                                            {video.habitId && (
                                                <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                                                    {habits.find(h => h.id === video.habitId)?.title}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                            <span>Progress</span>
                                            <span>{Math.round((video.watchProgress / (video.durationSeconds || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-1 bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${Math.min(100, (video.watchProgress / (video.durationSeconds || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                                                <Youtube className="w-3 h-3 text-red-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Neural Stream</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenReminder(video, 'video'); }}
                                                    className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                >
                                                    <Bell className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMovingItem({ id: video.id, type: 'video' });
                                                        setIsMoveModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                >
                                                    <Move className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(video.id, 'video'); }}
                                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ThemedCard>
                        ))}

                        {/* Resources/Links */}
                        {filteredResources.map(res => (
                            <ThemedCard
                                key={res.id}
                                interactive
                                onClick={() => res.url && window.open(res.url, '_blank')}
                                className="group h-full flex flex-col relative"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className={`flex items-center gap-2 px-3 py-1 border rounded-full ${res.type === 'link' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                            {res.type === 'link' ? <ExternalLink className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{res.type}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReminder(res, 'resource'); }}
                                                className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                            >
                                                <Bell className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMovingItem({ id: res.id, type: 'resource' });
                                                    setIsMoveModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                            >
                                                <Move className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(res.id, 'resource'); }}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors">{res.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{res.type}</div>
                                            <div className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                res.status === 'read' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                            )}>{res.status}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-primary/5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ExternalLink className="w-3.5 h-3.5" /> Handshake Protocol
                                    </div>
                                </div>
                            </ThemedCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Combined Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-card border rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h2 className="text-2xl font-bold">New Addition</h2>
                                <p className="text-xs text-muted-foreground font-medium">Add to your learning store</p>
                            </div>
                            <div className="flex bg-muted p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none">
                                <button
                                    onClick={() => setAddType('video')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0", addType === 'video' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                >Video</button>
                                <button
                                    onClick={() => setAddType('resource')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0", addType === 'resource' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                >Link</button>
                                <button
                                    onClick={() => setAddType('folder')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0", addType === 'folder' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                >Folder</button>
                                <button
                                    onClick={() => setAddType('course')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0", addType === 'course' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                >Course</button>
                                <button
                                    onClick={() => setAddType('channel')}
                                    className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0", addType === 'channel' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
                                >Mentor</button>
                            </div>
                        </div>

                        <form onSubmit={handleAdd} className="p-8 space-y-6">
                            {addType === 'video' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">YouTube URL</label>
                                        <Input placeholder="https://youtube.com/..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Assign to Course</label>
                                        <select className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" value={targetCourseId} onChange={e => setTargetCourseId(e.target.value)}>
                                            <option value="">No Course</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {addType === 'resource' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Research/Link Title</label>
                                        <Input placeholder="E.g. Neural Architecture Search Paper..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newResTitle} onChange={e => setNewResTitle(e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Type</label>
                                            <select className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" value={newResType} onChange={e => setNewResType(e.target.value as ResourceType)}>
                                                <option value="link">Link</option>
                                                <option value="article">Article</option>
                                                <option value="document">Document</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">URL</label>
                                            <Input placeholder="https://..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newResUrl} onChange={e => setNewResUrl(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {addType === 'folder' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Collection Name</label>
                                    <Input placeholder="E.g. Computer Science, Financial Freedom..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} required />
                                </div>
                            )}

                            {addType === 'course' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Course Title</label>
                                        <Input placeholder="E.g. Rust Mastery Series..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Place in Collection</label>
                                        <select className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" value={targetFolderId} onChange={e => setTargetFolderId(e.target.value)}>
                                            <option value="">No Collection</option>
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {addType === 'channel' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mentor Name</label>
                                        <Input placeholder="E.g. Fireship, Veritassium..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newChannelTitle} onChange={e => setNewChannelTitle(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Channel URL</label>
                                        <Input placeholder="https://youtube.com/@..." className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" value={newChannelUrl} onChange={e => setNewChannelUrl(e.target.value)} required />
                                    </div>
                                </div>
                            )}

                            {addType !== 'folder' && addType !== 'course' && addType !== 'channel' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Target Collection</label>
                                        <select className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" value={targetFolderId} onChange={e => setTargetFolderId(e.target.value)}>
                                            <option value="">No Collection</option>
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Related Habit</label>
                                        <select className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" value={targetHabitId} onChange={e => setTargetHabitId(e.target.value)}>
                                            <option value="">No Habit</option>
                                            {habits.map(h => (
                                                <option key={h.id} value={h.id}>{h.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20">Confirm Addition</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-card border rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">Move Item</h2>
                            <p className="text-xs text-muted-foreground">Select a new collection for this resource</p>
                        </div>
                        <div className="space-y-2">
                            {folders.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => handleMove(f.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors border text-sm font-medium"
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                                    {f.name}
                                </button>
                            ))}
                            <button
                                onClick={() => handleMove(null)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors border text-sm font-medium opacity-60"
                            >
                                <LayoutGrid className="w-3 h-3" />
                                Remove from folder
                            </button>
                        </div>
                        <Button variant="ghost" className="w-full rounded-xl" onClick={() => setIsMoveModalOpen(false)}>Close</Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedVideo && (
                <VideoPlayerModal
                    video={selectedVideo}
                    onClose={() => {
                        setSelectedVideo(null);
                        loadData();
                    }}
                    onProgressUpdate={loadData}
                />
            )}

            {previewVideo && (
                <QuickViewModal
                    video={previewVideo}
                    onClose={() => setPreviewVideo(null)}
                    onOpenPlayer={() => {
                        setSelectedVideo(previewVideo);
                        setPreviewVideo(null);
                    }}
                />
            )}
            {showCertificate && activeCourse && activeCourseStats && (
                <CourseCertificate
                    course={activeCourse}
                    stats={activeCourseStats}
                    userName={userEmail.split('@')[0]}
                    onClose={() => setShowCertificate(false)}
                />
            )}

            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onSave={handleSaveReminder}
                initialData={prefilledReminder as any}
                habits={habits}
                videos={videos}
                courses={courses}
                resources={resources}
            />
        </div>
    );
}

function formatWatchTime(sec: number) {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
