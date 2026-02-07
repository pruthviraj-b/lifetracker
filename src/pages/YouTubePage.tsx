import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Home, Search, Folder, GraduationCap, Youtube, Link as LinkIcon,
    MoreVertical, Trash2, Move, LayoutGrid, ChevronRight, Award,
    CheckCircle2, Play, Eye, Bell, ExternalLink, Activity, Database
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Services
import { YouTubeService } from '../services/youtube.service';
import { LearningService } from '../services/learning.service';
import { CourseService } from '../services/course.service';
import { HabitService } from '../services/habit.service';
import { ReminderService } from '../services/reminder.service';
import { MultiverseService } from '../services/multiverse.service';

// Components
import { ThemedCard } from '../components/ui/ThemedCard';
import { NeuralIngest } from '../components/library/NeuralIngest';
import { VideoPlayerModal } from '../components/youtube/VideoPlayerModal';
import { QuickViewModal } from '../components/youtube/QuickViewModal';
import { CourseCertificate } from '../components/youtube/CourseCertificate';
import { ReminderModal } from '../components/tools/ReminderModal';

// Types
import { YouTubeVideo, LearningFolder, LearningResource, LearningCourse, CourseSeriesStats, LearningChannel } from '../types/youtube';
import { Habit } from '../types/habit';

export default function YouTubePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    // --- Data State ---
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [folders, setFolders] = useState<LearningFolder[]>([]);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [courses, setCourses] = useState<LearningCourse[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [channels, setChannels] = useState<LearningChannel[]>([]);
    const [activeCourseStats, setActiveCourseStats] = useState<CourseSeriesStats | null>(null);

    // --- UI State ---
    const [loading, setLoading] = useState(true);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Modal / Interaction State ---
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingItem, setMovingItem] = useState<{ id: string, type: 'video' | 'resource' } | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
    const [previewVideo, setPreviewVideo] = useState<YouTubeVideo | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [prefilledReminder, setPrefilledReminder] = useState<any>(undefined);
    const [userEmail, setUserEmail] = useState('');

    // --- Initialization ---
    useEffect(() => {
        loadData();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setUserEmail(user.email);
    };

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
            showToast('Error', 'Failed to load library data', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- Deep Link Handlers ---
    useEffect(() => {
        if (!loading) {
            const vidId = searchParams.get('videoId');
            const folId = searchParams.get('folderId');

            if (vidId) {
                const v = videos.find(i => i.id === vidId);
                if (v) setSelectedVideo(v);
                searchParams.delete('videoId');
                setSearchParams(searchParams, { replace: true });
            }
            if (folId) {
                const f = folders.find(i => i.id === folId);
                if (f) setActiveFolderId(folId);
                searchParams.delete('folderId');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [loading, videos, folders, searchParams]);

    useEffect(() => {
        if (activeCourseId) loadCourseStats(activeCourseId);
        else setActiveCourseStats(null);
    }, [activeCourseId, videos]);

    const loadCourseStats = async (courseId: string) => {
        const s = await CourseService.getCourseStats(courseId);
        setActiveCourseStats(s);
    };

    // --- Actions ---

    const handleDelete = async (id: string, type: 'video' | 'resource' | 'folder' | 'course' | 'channel') => {
        if (!confirm('Permanently purge this node?')) return;
        try {
            if (type === 'video') await YouTubeService.deleteVideo(id);
            if (type === 'resource') await LearningService.deleteResource(id);
            if (type === 'folder') {
                await LearningService.deleteFolder(id);
                if (activeFolderId === id) setActiveFolderId(null);
            }
            if (type === 'course') {
                await CourseService.deleteCourse(id);
                if (activeCourseId === id) setActiveCourseId(null);
            }
            if (type === 'channel') await YouTubeService.deleteChannel(id);

            loadData();
            showToast('Success', 'Node purged', { type: 'success' });
        } catch (error: any) {
            showToast('Error', 'Purge failed', { type: 'error' });
        }
    };

    const handleMove = async (newFolderId: string | null) => {
        if (!movingItem) return;
        try {
            if (movingItem.type === 'video') await YouTubeService.moveVideoToFolder(movingItem.id, newFolderId);
            else await LearningService.moveResourceToFolder(movingItem.id, newFolderId);

            setIsMoveModalOpen(false);
            setMovingItem(null);
            loadData();
            showToast('Success', 'Relocation complete', { type: 'success' });
        } catch (error) {
            showToast('Error', 'Relocation failed', { type: 'error' });
        }
    };

    const handleOpenReminder = (item: any, type: string) => {
        setPrefilledReminder({
            title: `Study: ${item.title || item.name}`,
            videoId: type === 'video' ? item.id : undefined,
            courseId: type === 'course' ? item.id : undefined,
            resourceId: type === 'resource' ? item.id : undefined,
            folderId: type === 'folder' ? item.id : undefined
        });
        setIsReminderModalOpen(true);
    };

    // --- Filtering ---

    const activeFolder = folders.find(f => f.id === activeFolderId);
    const activeCourse = courses.find(c => c.id === activeCourseId);

    const filteredFolders = folders.filter(f =>
        !activeFolderId && !activeCourseId && // Only show folders at root
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCourses = courses.filter(c =>
        !activeCourseId &&
        (!activeFolderId || c.folderId === activeFolderId) &&
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredVideos = videos.filter(v =>
        (activeFolderId ? v.folderId === activeFolderId : !v.folderId) && // Filter by folder if active, else show root
        (activeCourseId ? v.courseId === activeCourseId : !v.courseId) &&
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const filteredResources = resources.filter(r =>
        (activeFolderId ? r.folderId === activeFolderId : !r.folderId) &&
        (!activeCourseId || r.courseId === activeCourseId) &&
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Consolidated list for "Root View" mixing (optional, but current logic separates them)

    return (
        <div className="p-3 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto min-h-screen">

            {/* 1. Header & Navigation */}
            <div className={`flex flex-col gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/')} className={isWild ? 'rounded-none border-2 border-primary/20' : 'rounded-full w-10 h-10 p-0'}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className={`text-xl md:text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>
                                {activeCourse ? activeCourse.title : activeFolder ? activeFolder.name : 'Archive Matrix'}
                            </h1>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
                                {activeCourse ? 'Curriculum Sequence' : activeFolder ? 'Knowledge Cluster' : 'Neural Storage'}
                            </p>
                        </div>
                    </div>

                    {/* Breadcrumbs / Back */}
                    {(activeFolderId || activeCourseId) && (
                        <Button variant="outline" onClick={() => { setActiveFolderId(null); setActiveCourseId(null); }} className="text-xs font-bold uppercase tracking-widest">
                            <LayoutGrid className="w-4 h-4 mr-2" /> Return to Root
                        </Button>
                    )}
                </div>

                {/* 2. Neural Ingest (The Advanced Input) */}
                <NeuralIngest
                    onSuccess={loadData}
                    activeFolderId={activeFolderId}
                    activeCourseId={activeCourseId}
                    folders={folders}
                    courses={courses}
                    habits={habits}
                />
            </div>

            {/* 3. Stats / Course Progress (If Course Active) */}
            {activeCourseId && activeCourseStats && (
                <div className="bg-card border rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 animate-in fade-in">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Progress Status</h3>
                        <p className="text-xs text-muted-foreground">{activeCourseStats.completedVideos} / {activeCourseStats.totalVideos} Modules Complete</p>
                    </div>
                    <div className="flex-1 w-full max-w-md h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-1000"
                            style={{ width: `${activeCourseStats.completionPercentage}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-2xl font-black text-green-500">{activeCourseStats.completionPercentage}%</div>
                        {activeCourseStats.completionPercentage === 100 && (
                            <Button size="sm" onClick={() => setShowCertificate(true)} className="bg-green-500 text-black font-bold uppercase text-[10px]">
                                <Award className="w-4 h-4 mr-2" /> Verify
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* 4. Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted/20 rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">

                    {/* Folders */}
                    {filteredFolders.map(folder => (
                        <ThemedCard
                            key={folder.id}
                            interactive
                            onClick={() => setActiveFolderId(folder.id)}
                            className="group h-full flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <Folder className="w-6 h-6" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base md:text-xl font-bold truncate">{folder.name}</h3>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Cluster</p>
                            </div>
                        </ThemedCard>
                    ))}

                    {/* Courses */}
                    {filteredCourses.map(course => (
                        <ThemedCard
                            key={course.id}
                            interactive
                            onClick={() => setActiveCourseId(course.id)}
                            className="group h-full flex flex-col justify-between border-green-500/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id, 'course'); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base md:text-xl font-bold truncate">{course.title}</h3>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Curriculum</p>
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
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-black group-hover:opacity-90 transition-opacity cursor-pointer" onClick={() => setSelectedVideo(video)}>
                                <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <Play className="w-12 h-12 text-white fill-white" />
                                </div>
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono rounded text-white font-bold">
                                    {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                                </div>
                                {video.status === 'watched' && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-black text-[9px] font-black uppercase rounded">
                                        Complete
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3 flex-1 flex flex-col gap-2">
                                <h3 className="font-bold leading-tight line-clamp-2 text-sm group-hover:text-primary transition-colors">{video.title}</h3>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                        <Activity className="w-3 h-3" /> {Math.round((video.watchProgress / (video.durationSeconds || 1)) * 100)}%
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenReminder(video, 'video')} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded"><Bell className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => { setMovingItem({ id: video.id, type: 'video' }); setIsMoveModalOpen(true); }} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded"><Move className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(video.id, 'video')} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        </ThemedCard>
                    ))}

                    {/* Resources */}
                    {filteredResources.map(res => (
                        <ThemedCard
                            key={res.id}
                            interactive
                            onClick={() => window.open(res.url, '_blank')}
                            className="group h-full flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <LinkIcon className="w-6 h-6" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); setMovingItem({ id: res.id, type: 'resource' }); setIsMoveModalOpen(true); }} className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg"><Move className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id, 'resource'); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold leading-tight line-clamp-2 text-sm max-w-[90%]">{res.title}</h3>
                                <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                                    <ExternalLink className="w-3 h-3" /> External Link
                                </div>
                            </div>
                        </ThemedCard>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredFolders.length === 0 && filteredCourses.length === 0 && filteredVideos.length === 0 && filteredResources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                    <Database className="w-16 h-16 text-muted-foreground" />
                    <p className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Matrix Empty</p>
                    <p className="text-xs text-muted-foreground">Use the input above to ingest data.</p>
                </div>
            )}

            {/* Modals */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-sm rounded-2xl border p-6 space-y-4">
                        <h3 className="font-bold uppercase tracking-widest">Select Destination</h3>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <button onClick={() => handleMove(null)} className="w-full p-3 text-left hover:bg-muted rounded-xl text-sm font-medium border border-dashed flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" /> Root Matrix
                            </button>
                            {folders.map(f => (
                                <button key={f.id} onClick={() => handleMove(f.id)} className="w-full p-3 text-left hover:bg-muted rounded-xl text-sm font-medium border flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-primary" /> {f.name}
                                </button>
                            ))}
                        </div>
                        <Button variant="ghost" onClick={() => setIsMoveModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {selectedVideo && (
                <VideoPlayerModal video={selectedVideo} onClose={() => { setSelectedVideo(null); loadData(); }} onProgressUpdate={loadData} />
            )}

            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                initialData={prefilledReminder}
                onSave={async (data) => {
                    await ReminderService.createReminder({ ...data, isEnabled: true });
                    showToast('Success', 'Reminder Set', { type: 'success' });
                    setIsReminderModalOpen(false);
                }}
                habits={habits}
                videos={videos}
                courses={courses}
                resources={resources}
            />
        </div>
    );
}
