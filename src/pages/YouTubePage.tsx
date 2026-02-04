import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Home
} from 'lucide-react';
import { YouTubeService } from '../services/youtube.service';
import { LearningService } from '../services/learning.service';
import { CourseService } from '../services/course.service';
import { HabitService } from '../services/habit.service';
import { useTheme } from '../context/ThemeContext';
import {
    YouTubeVideo,
    LearningFolder,
    LearningResource,
    ResourceType,
    LearningCourse,
    CourseSeriesStats
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

export default function YouTubePage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    // Data State
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [folders, setFolders] = useState<LearningFolder[]>([]);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [courses, setCourses] = useState<LearningCourse[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [activeCourseStats, setActiveCourseStats] = useState<CourseSeriesStats | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addType, setAddType] = useState<'video' | 'folder' | 'resource' | 'course'>('video');
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingItem, setMovingItem] = useState<{ id: string, type: 'video' | 'resource' } | null>(null);

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
    const [targetHabitId, setTargetHabitId] = useState<string>('');
    const [targetFolderId, setTargetFolderId] = useState<string>('');
    const [targetCourseId, setTargetCourseId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeCourseId) {
            loadCourseStats(activeCourseId);
        } else {
            setActiveCourseStats(null);
        }
    }, [activeCourseId, videos]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserEmail(user.email || '');

            const [vData, fData, rData, hData, cData] = await Promise.all([
                YouTubeService.getVideos(),
                LearningService.getFolders(),
                LearningService.getResources(),
                HabitService.getHabits(),
                CourseService.getCourses()
            ]);
            setVideos(vData);
            setFolders(fData);
            setResources(rData);
            setHabits(hData);
            setCourses(cData);
        } catch (error: any) {
            console.error(error);
            showToast('Error', 'Failed to load library data.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
                const videoId = await YouTubeService.addVideo({
                    url: newVideoUrl,
                    habitId: targetHabitId || undefined,
                    folderId: targetFolderId || undefined
                });
                if (targetCourseId) {
                    await CourseService.addVideoToCourse(videoId.id, targetCourseId, videos.filter(v => v.courseId === targetCourseId).length);
                }
                showToast('Success', 'Video added to library', { type: 'success' });
            } else if (addType === 'folder') {
                if (!newFolderName) return;
                await LearningService.createFolder({ name: newFolderName });
                showToast('Success', 'Folder created', { type: 'success' });
            } else if (addType === 'resource') {
                if (!newResTitle) return;
                await LearningService.createResource({
                    title: newResTitle,
                    url: newResUrl,
                    type: newResType,
                    folderId: targetFolderId || undefined,
                    habitId: targetHabitId || undefined
                });
                showToast('Success', 'Resource added', { type: 'success' });
            } else if (addType === 'course') {
                if (!newCourseTitle) return;
                await CourseService.createCourse({
                    title: newCourseTitle,
                    folderId: targetFolderId || undefined
                });
                showToast('Success', 'Course created', { type: 'success' });
            }

            resetForm();
            setIsAddModalOpen(false);
            loadData();
        } catch (error: any) {
            showToast('Error', error.message || 'Operation failed', { type: 'error' });
        }
    };

    const handleDelete = async (id: string, type: 'video' | 'resource' | 'folder' | 'course') => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        try {
            if (type === 'video') await YouTubeService.deleteVideo(id);
            else if (type === 'resource') await LearningService.deleteResource(id);
            else if (type === 'folder') {
                await LearningService.deleteFolder(id);
                if (activeFolderId === id) setActiveFolderId(null);
            } else if (type === 'course') {
                await CourseService.deleteCourse(id);
                if (activeCourseId === id) setActiveCourseId(null);
            }
            showToast('Deleted', `${type} removed from library`, { type: 'success' });
            loadData();
        } catch (error: any) {
            showToast('Error', error.message || 'Delete failed', { type: 'error' });
        }
    };

    const handleMove = async (folderId: string | null) => {
        if (!movingItem) return;
        try {
            if (movingItem.type === 'video') {
                await YouTubeService.moveVideoToFolder(movingItem.id, folderId);
            } else {
                await LearningService.moveResourceToFolder(movingItem.id, folderId);
            }
            showToast('Moved', 'Item moved successfully', { type: 'success' });
            setIsMoveModalOpen(false);
            setMovingItem(null);
            loadData();
        } catch (error: any) {
            showToast('Error', error.message || 'Move failed', { type: 'error' });
        }
    };

    const resetForm = () => {
        setNewVideoUrl('');
        setNewFolderName('');
        setNewResTitle('');
        setNewResUrl('');
        setNewCourseTitle('');
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
        const matchesCourse = activeCourseId ? r.courseId === activeCourseId : true;
        return matchesSearch && matchesFolder && matchesCourse;
    });

    const activeFolder = folders.find(f => f.id === activeFolderId);
    const activeCourse = courses.find(c => c.id === activeCourseId);

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black flex flex-col md:flex-row ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            {/* Sidebar */}
            <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r bg-card/30 flex flex-col shrink-0 relative z-10 ${isWild ? 'border-primary/20' : ''}`}>
                <div className={`p-6 border-b flex items-center justify-between ${isWild ? 'border-primary/20' : ''}`}>
                    <h2 className={`font-bold flex items-center gap-2 ${isWild ? 'text-primary animate-glitch' : ''}`}>
                        <Folder className="w-4 h-4" />
                        Intelligence Store
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setAddType('folder');
                        setIsAddModalOpen(true);
                    }} className={isWild ? 'rounded-none hover:bg-primary/10' : ''}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => {
                            setActiveFolderId(null);
                            setActiveCourseId(null);
                        }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            (!activeFolderId && !activeCourseId) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        All Content
                    </button>

                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Curriculum</span>
                        <button onClick={() => { setAddType('course'); setIsAddModalOpen(true); }} className="hover:text-primary"><Plus className="w-3 h-3" /></button>
                    </div>
                    {courses.map(course => (
                        <button
                            key={course.id}
                            onClick={() => {
                                setActiveCourseId(course.id);
                                setActiveFolderId(null);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                                activeCourseId === course.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                        >
                            <div className="flex items-center gap-3 truncate">
                                <GraduationCap className={cn("w-4 h-4", activeCourseId === course.id ? "text-primary" : "text-muted-foreground")} />
                                <span className="truncate">{course.title}</span>
                            </div>
                        </button>
                    ))}

                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Collections
                    </div>
                    {folders.map(f => (
                        <div key={f.id} className="group relative">
                            <button
                                onClick={() => {
                                    setActiveFolderId(f.id);
                                    setActiveCourseId(null);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    activeFolderId === f.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                )}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                                    <span className="truncate">{f.name}</span>
                                </div>
                                <span className="text-[10px] opacity-40 group-hover:hidden">
                                    {videos.filter(v => v.folderId === f.id).length + resources.filter(r => r.folderId === f.id).length}
                                </span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(f.id, 'folder'); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/10 hover:text-red-500 rounded hidden group-hover:block"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/home')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Header */}
                <div className={`p-4 md:p-6 border-b bg-card/30 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 ${isWild ? 'border-primary/20 animate-reveal' : ''}`}>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className={`text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>
                                {activeCourse ? activeCourse.title : activeFolder ? activeFolder.name : "Ritual Intelligence"}
                                {activeCourse && <GraduationCap className="inline-block ml-3 w-6 h-6 text-primary" />}
                            </h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">
                                {activeCourse ? "Neural Sequence Progression" : activeFolder ? "Segmented Tactical Knowledge" : "Universal Asset Repository"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Scan intelligence..."
                                className={`pl-9 w-full md:w-64 h-11 bg-muted/30 ${isWild ? 'rounded-none border-primary/20' : 'border rounded-xl'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => {
                            setAddType('video');
                            setIsAddModalOpen(true);
                        }} className={`w-full sm:w-auto shadow-lg h-11 px-4 md:px-6 shrink-0 ${isWild ? 'rounded-none shadow-primary/20' : 'shadow-primary/20 rounded-xl'}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Add Asset</span>
                        </Button>
                    </div>
                </div>

                {/* Course Progress Banner */}
                {activeCourse && activeCourseStats && (
                    <div className="px-6 py-4 bg-primary/5 border-b flex flex-wrap items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Award className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion</div>
                                <div className="text-lg font-bold">{activeCourseStats.completionPercentage}% Complete</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time Remaining</div>
                                <div className="text-lg font-bold">{formatWatchTime(activeCourseStats.remainingDurationSeconds)}</div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px] max-w-xs space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                <span>{activeCourseStats.completedVideos} / {activeCourseStats.totalVideos} Lessons</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${activeCourseStats.completionPercentage}%` }} />
                            </div>
                        </div>
                        {activeCourseStats.completionPercentage === 100 && (
                            <Button
                                onClick={() => setShowCertificate(true)}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-xl px-6 h-12"
                            >
                                <Award className="w-5 h-5 mr-2" />
                                Claim Certificate
                            </Button>
                        )}
                    </div>
                )}

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/10">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-muted animate-pulse rounded-3xl" />)}
                        </div>
                    ) : (filteredVideos.length === 0 && filteredResources.length === 0) ? (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Videos */}
                            {filteredVideos.map((video, idx) => (
                                <div key={video.id} className="group bg-card border rounded-3xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl shadow-sm relative">
                                    <div className="aspect-video relative overflow-hidden bg-black/5">
                                        <img src={video.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button size="sm" className="rounded-xl px-4" onClick={() => setSelectedVideo(video)}>
                                                <Play className="w-4 h-4 mr-2 fill-current" />
                                                Study
                                            </Button>
                                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setPreviewVideo(video)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <div className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-white font-bold text-xs flex items-center gap-2">
                                                <span className="opacity-60 text-[10px]">{idx + 1}</span>
                                                {video.status === 'watched' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Play className="w-3 h-3 text-primary" />}
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setMovingItem({ id: video.id, type: 'video' }); setIsMoveModalOpen(true); }}
                                                className="p-1.5 bg-background/80 blur-none rounded-lg hover:text-primary transition-colors shadow-sm"
                                            >
                                                <Move className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(video.id, 'video')}
                                                className="p-1.5 bg-background/80 blur-none rounded-lg hover:text-red-500 transition-colors shadow-sm"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                            <Youtube className="w-3 h-3 text-red-500" />
                                            {formatWatchTime(video.watchProgress)}
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <h3 className="font-bold line-clamp-1 leading-tight text-lg">{video.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted px-2 py-1 rounded-md">
                                                <History className="w-3 h-3" />
                                                Lesson {idx + 1}
                                            </div>
                                            {video.habitId && (
                                                <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                                                    {habits.find(h => h.id === video.habitId)?.title}
                                                </div>
                                            )}
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                                <span>Progress</span>
                                                <span>{Math.round((video.watchProgress / (video.durationSeconds || 1)) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${Math.min(100, (video.watchProgress / (video.durationSeconds || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Resources */}
                            {filteredResources.map(res => (
                                <div key={res.id} className="group bg-card border rounded-3xl p-6 hover:border-blue-500/50 transition-all hover:shadow-2xl shadow-sm space-y-5 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                                            {res.type === 'link' && <ExternalLink className="w-6 h-6 text-blue-500" />}
                                            {res.type === 'article' && <FileText className="w-6 h-6 text-blue-500" />}
                                            {(res.type === 'document' || res.type === 'other') && <BookOpen className="w-6 h-6 text-blue-500" />}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setMovingItem({ id: res.id, type: 'resource' }); setIsMoveModalOpen(true); }}
                                                className="p-1.5 bg-muted rounded-lg hover:text-primary transition-colors"
                                            >
                                                <Move className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(res.id, 'resource')}
                                                className="p-1.5 bg-muted rounded-lg hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">{res.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">{res.type}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold rounded-full px-2 py-0.5",
                                                res.status === 'read' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                            )}>{res.status}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-dashed"
                                        onClick={() => res.url && window.open(res.url, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open Link
                                    </Button>
                                    {res.habitId && (
                                        <div className="absolute bottom-6 right-6">
                                            <div className="px-2 py-0.5 bg-muted text-muted-foreground text-[8px] font-bold rounded-full">
                                                {habits.find(h => h.id === res.habitId)?.title}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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

                            {addType !== 'folder' && addType !== 'course' && (
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
        </div>
    );
}

function formatWatchTime(sec: number) {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
