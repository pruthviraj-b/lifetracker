import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Lock, CheckCircle, Map, X, Link as LinkIcon, Globe, Trash2, Plus, FileText, BookOpen, Cloud, CloudOff, Zap, Flame, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, CourseModule, Enrollment, Lesson } from '../../types/course';
import { CourseService } from '../../services/course.service';
import { AIService } from '../../services/ai.service';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { AddFlashcardModal } from '../../components/flashcards/AddFlashcardModal';
import { FlashcardService } from '../../services/flashcard.service';
import { NotificationManagerInstance } from '../../utils/notificationManager';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


export const CourseDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { preferences } = useTheme();

    const isWild = preferences.wild_mode;
    const { user } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState<number | null>(0);
    const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

    // Journal State
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [journalNotes, setJournalNotes] = useState('');
    const [journalResources, setJournalResources] = useState<any[]>([]);
    const [resourceInput, setResourceInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedProtocol, setExtractedProtocol] = useState<{ tasks: string[], flashcards: any[] } | null>(null);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

    const handleAddResource = () => {
        if (!resourceInput.trim()) return;
        setJournalResources([...journalResources, { url: resourceInput, title: resourceInput }]);
        setResourceInput('');
    };

    const handleOpenJournal = async (lesson: Lesson) => {
        setSelectedLesson(lesson);
        // Reset defaults
        setJournalNotes('');
        setJournalResources([]);

        // Fetch existing journal
        try {
            const data = await CourseService.getLessonProgressDetails(lesson.id);
            if (data) {
                setJournalNotes(data.notes || '');
                setJournalResources(data.resources || []);
            }
        } catch (e) {
            console.error("Failed to load journal", e);
        }
    };

    const handleSaveJournal = async () => {
        if (!selectedLesson) return;

        // Auto-add pending resource input if exists
        let resourcesToSave = [...journalResources];
        if (resourceInput.trim()) {
            const newRes = { title: 'External Link', url: resourceInput.trim(), type: 'link' };
            resourcesToSave.push(newRes);
            setJournalResources(resourcesToSave);
            setResourceInput('');
        }

        try {
            setIsSaving(true);
            setSaveStatus('saving');
            if (!user) {
                showToast("Error", "You must be logged in to save.", { type: "error" });
                return;
            }
            await CourseService.updateLessonJournal(selectedLesson.id, journalNotes, resourcesToSave, user.id);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            showToast("Saved", "Journal entry updated.", { type: 'success' });
        } catch (e: any) {
            setSaveStatus('error');
            console.error("Save Error:", e);
            showToast("Save Failed", e.message || "Database permission denied. Run SQL.", { type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExtractProtocol = async () => {
        if (!journalNotes.trim()) {
            showToast('Note Required', 'Write some notes first to extract a protocol.', { type: 'info' });
            return;
        }
        try {
            setIsExtracting(true);
            const protocol = await AIService.extractProtocol(journalNotes);
            setExtractedProtocol(protocol);
            showToast('Protocol Generated', 'Tasks and flashcards extracted.', { type: 'success' });
        } catch (e) {
            console.error(e);
            showToast('Error', 'Failed to generate protocol.', { type: 'error' });
        } finally {
            setIsExtracting(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            // ... existing load logic ...
            try {
                setLoading(true);
                const { course, modules } = await CourseService.getCourseDetails(id);
                setCourse(course);
                setModules(modules);

                const enroll = await CourseService.getMyEnrollment(id);
                setEnrollment(enroll);

                // Load Completed Lessons
                if (enroll) {
                    // Need to fetch specifically completed lessons for this course
                    // Since we don't have a direct service method for *list* of completed, 
                    // we'll assume we can use the enrollment or fetch from service.
                    // Let's add a helper here or call a new service method. 
                    // For now, let's use the Service to fetch progress.
                    const completed = await CourseService.getCompletedLessons(id);
                    setCompletedLessonIds(new Set(completed));
                }

                // Load Related Courses
                const all = await CourseService.getPublishedCourses();
                setRelatedCourses(all.filter(c => c.id !== id).slice(0, 3));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleToggleComplete = async (lessonId: string) => {
        if (!enrollment) {
            showToast('Enroll First', 'You must initiate the protocol first.', { type: 'error' });
            return;
        }
        if (!user) return; // Guard

        // Optimistic Update
        const newSet = new Set(completedLessonIds);
        const iscomplete = newSet.has(lessonId);

        if (iscomplete) {
            // newSet.delete(lessonId); // Toggle OFF currently not supported by backend easily? 
            // Actually let's just allow marking ON for now as per "Tick that" request. Un-ticking is rare.
            // But if user insists, we should support it. `markLessonComplete` is upsert 'completed'.
            // To uncomplete, we'd need a delete or update status.
            // Let's just focus on "Tick".
            showToast('Already Done', 'Lesson is already recorded.', { type: 'info' });
            return;
        } else {
            newSet.add(lessonId);
            setCompletedLessonIds(newSet);
            // 🎉 CONFETTI
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#ffffff', '#eab308']
            });

            try {
                await CourseService.markLessonComplete(lessonId, id!, user.id);
                showToast('Marked Complete', 'Progress recorded.', { type: 'success' });
            } catch (e) {
                // Revert
                newSet.delete(lessonId);
                setCompletedLessonIds(new Set(newSet));
                showToast('Error', 'Failed to save progress', { type: 'error' });
            }
        }
    };

    const handleEnroll = async () => {
        if (!course || !user) {
            if (!user) showToast('Error', 'Please log in to enroll.', { type: 'error' });
            return;
        }
        try {
            const data = await CourseService.enrollInCourse(course.id, user.id);
            setEnrollment(data);
            showToast('Enrolled', `Welcome to ${course.title}`, { type: 'success' });
        } catch (e) {
            showToast('Error', 'Failed to enroll', { type: 'error' });
        }
    };

    const handleSaveExtracted = async () => {
        if (!extractedProtocol || extractedProtocol.flashcards.length === 0) return;

        try {
            setIsSaving(true);
            setSaveStatus('saving');
            // Batch create
            await Promise.all(extractedProtocol.flashcards.map(card =>
                FlashcardService.createFlashcard({
                    front: card.q,
                    back: card.a,
                    noteId: undefined // Could link to lesson ID if we update schema, for now standalone
                })
            ));

            setSaveStatus('saved');
            showToast('Neural Uplink Complete', `${extractedProtocol.flashcards.length} protocols injected.`, { type: 'success' });
            setTimeout(() => setSaveStatus('idle'), 2000);

            // Clear extracted after save to prevent dupes? Or keep for reference?
            // Keep for reference, but maybe disable button
        } catch (e: any) {
            console.error(e);
            setSaveStatus('error');
            showToast('Uplink Failed', e.message, { type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-background pb-20 relative ${isWild ? 'wild' : ''}`}>
                {/* Skeleton Banner */}
                <div className="relative h-[60vh] w-full bg-muted/20 animate-pulse">
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 space-y-6">
                        <div className="h-6 w-32 bg-muted/40 rounded" />
                        <div className="h-16 w-3/4 max-w-4xl bg-muted/40 rounded-xl" />
                        <div className="flex gap-4">
                            <div className="h-8 w-24 bg-muted/40 rounded-full" />
                            <div className="h-8 w-32 bg-muted/40 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Skeleton Action Bar */}
                <div className="bg-background/80 backdrop-blur border-b border-white/10 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
                    <div className="h-12 w-48 bg-muted/20 rounded-full animate-pulse" />
                </div>

                {/* Skeleton Modules */}
                <div className="max-w-4xl mx-auto mt-20 px-6 space-y-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-secondary/10 rounded-2xl border border-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }
    if (!course) return <div>Course not found</div>;

    return (
        <div className={`min-h-screen bg-background text-foreground pb-20 relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : ''}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            {/* Header Banner */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
                <img src={course.thumbnail_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b'}
                    className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
                />

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 space-y-6">
                    <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-white transition-colors mb-4">
                        <ChevronLeft className="w-4 h-4" /> Return to Library
                    </button>

                    <h1 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter max-w-4xl leading-[0.9]">
                        {course.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
                            {course.difficulty_level}
                        </span>
                        <span className="text-muted-foreground font-mono px-4 border-l border-white/20">
                            {course.duration_weeks} WEEKS
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-background/80 backdrop-blur border-b border-white/10 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {enrollment ? (
                        <div className="flex items-center gap-4">
                            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${enrollment.progress_percent}%` }} />
                            </div>
                            <span className="font-mono text-sm">{enrollment.progress_percent}% COMPLETE</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Start this journey to track progress.</p>
                    )}
                </div>

                {!enrollment ? (
                    <button
                        onClick={handleEnroll}
                        className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                    >
                        Initiate Protocol
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={async () => {
                                // Default: Remind in 1 hour for now, or we can add a picker
                                // For simplicity and "wow" factor, let's do 1 hour.
                                const success = await NotificationManagerInstance.scheduleCourseReminder(course.title, course.id, 60 * 60 * 1000);
                                if (success) {
                                    showToast("Reminder Set", "Protocol resume alerted for in 1 hour.", { type: 'success' });
                                }
                            }}
                            className="bg-secondary/20 text-secondary border border-secondary/50 px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-secondary/30 transition-colors"
                        >
                            <Bell className="w-4 h-4" /> Remind Me
                        </button>
                        <button className="bg-green-500/20 text-green-500 border border-green-500/50 px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-default">
                            <CheckCircle className="w-4 h-4" /> Active
                        </button>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {enrollment && (
                <div className="max-w-4xl mx-auto py-4 mb-4 border-b border-white/5 px-6">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="text-muted-foreground uppercase tracking-widest">Protocol Completion</span>
                        <span className="text-primary font-bold text-right">{Math.round((completedLessonIds.size / (modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedLessonIds.size / (modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1)) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        />
                    </div>
                </div>
            )}

            {/* Modules Roadmap */}
            <div className="max-w-4xl mx-auto mt-20 px-6 space-y-8 relative">
                {modules.map((module, i) => (
                    <div key={module.id} className="relative pl-0 md:pl-0">
                        {/* Module Header (Clickable) */}
                        <div
                            className="bg-secondary/10 hover:bg-secondary/20 border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-colors"
                        >
                            <button
                                onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <div>
                                    <span className="text-xs font-mono text-primary uppercase tracking-widest mb-1 block">Module {i + 1}</span>
                                    <h2 className="text-xl md:text-2xl font-bold">{module.title}</h2>
                                    {expandedModule === i && (
                                        <p className="text-muted-foreground mt-2 text-sm">{module.description}</p>
                                    )}
                                </div>
                                <div className={`transform transition-transform duration-300 ${expandedModule === i ? 'rotate-180' : ''}`}>
                                    <ChevronLeft className="w-6 h-6 -rotate-90" />
                                </div>
                            </button>

                            {/* Collapsible Content */}
                            <motion.div
                                initial={false}
                                animate={{ height: expandedModule === i ? 'auto' : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="border-t border-white/5 p-4 space-y-2 bg-black/20">
                                    {module.lessons?.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm opacity-50 font-mono">NO DATA IN NODE</div>}
                                    {module.lessons?.map((lesson, j) => {
                                        const isCompleted = completedLessonIds.has(lesson.id);
                                        return (
                                            <motion.button
                                                key={lesson.id}
                                                whileHover={{ x: 5 }}
                                                onClick={(e) => {
                                                    // Main click: Open Journal Drawer
                                                    if (!enrollment && !lesson.is_free) {
                                                        showToast('Access Denied', 'Initiate Protocol (Enroll) to access.', { type: 'error' });
                                                        return;
                                                    }
                                                    handleOpenJournal(lesson);
                                                }}
                                                className={`w-full p-4 rounded-xl border border-white/5 bg-secondary/20 flex items-center justify-between group text-left transition-all
                                                        ${isCompleted ? 'border-primary/50 bg-primary/5' : ''}
                                                        ${!enrollment && !lesson.is_free ? 'opacity-60 grayscale' : 'hover:border-primary/30 hover:bg-secondary/40'}
                                                    `}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* CHECKLIST TOGGLE */}
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Don't navigate
                                                            handleToggleComplete(lesson.id);
                                                        }}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110
                                                                ${isCompleted
                                                                ? 'bg-primary text-black'
                                                                : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-primary/50'}
                                                            `}
                                                    >
                                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />}
                                                    </div>

                                                    <div>
                                                        <h4 className={`font-bold text-sm md:text-base group-hover:text-primary transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                                            {lesson.title}
                                                        </h4>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-1">{lesson.type} • {lesson.duration_minutes} min</span>
                                                    </div>
                                                </div>

                                                {!enrollment && !lesson.is_free ? (
                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-primary uppercase">
                                                        READ
                                                    </div>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Related Courses Section */}
            {relatedCourses.length > 0 && (
                <div className="max-w-6xl mx-auto mt-32 px-6">
                    <h3 className="text-xl font-mono uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Related Protocols</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedCourses.map(rel => (
                            <div
                                key={rel.id}
                                onClick={() => navigate(`/courses/${rel.id}`)}
                                className="group relative aspect-video bg-secondary/10 border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                            >
                                <img src={rel.thumbnail_url || ''} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-6">
                                    <span className="text-[10px] font-mono text-primary uppercase tracking-wider mb-2 block">{rel.difficulty_level}</span>
                                    <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{rel.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* JOURNAL DRAWER */}
            <AnimatePresence>
                {selectedLesson && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLesson(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full md:w-[600px] bg-[#0A0A0A] border-l border-white/10 z-50 overflow-y-auto shadow-2xl p-6 md:p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Daily Protocol</h2>
                                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mt-1">
                                        {saveStatus === 'saved' && <><Cloud className="w-3 h-3 text-green-500" /> <span className="text-green-500">Synced to Cloud</span></>}
                                        {saveStatus === 'saving' && <><Cloud className="w-3 h-3 text-yellow-500 animate-pulse" /> <span className="text-yellow-500">Syncing...</span></>}
                                        {saveStatus === 'error' && <><CloudOff className="w-3 h-3 text-red-500" /> <span className="text-red-500">Sync Failed</span></>}
                                        {saveStatus === 'idle' && <span className="text-muted-foreground">Ready</span>}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLesson(null)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Header Info */}
                                <div>
                                    <span className="text-xs font-mono text-primary uppercase tracking-widest mb-2 block">Day {selectedLesson.order + 1}</span>
                                    <h3 className="text-3xl font-bold mb-4">{selectedLesson.title}</h3>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => navigate(`/courses/${course.id}/learn/${selectedLesson.id}`)}
                                            className="flex items-center gap-2 text-sm text-white border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            Read Content
                                        </button>
                                        <button
                                            onClick={() => handleToggleComplete(selectedLesson.id)}
                                            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-all
                                                ${completedLessonIds.has(selectedLesson.id)
                                                    ? 'bg-green-500/10 border-green-500 text-green-500'
                                                    : 'border-white/20 hover:border-white/50 text-muted-foreground'}
                                            `}
                                        >
                                            {completedLessonIds.has(selectedLesson.id) ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                                            {completedLessonIds.has(selectedLesson.id) ? 'Completed' : 'Mark as Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/10" />

                                {/* Resources Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-bold flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4 text-secondary" />
                                            External Resources
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        {journalResources.map((res: any, idx) => (
                                            <div key={idx} className="flex items-center gap-3 group">
                                                <a href={res.url} target="_blank" rel="noreferrer" className="flex-1 p-3 rounded-lg bg-secondary/10 border border-white/5 hover:border-primary/50 truncate text-sm flex items-center gap-3 transition-colors">
                                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                                    {res.title || res.url}
                                                </a>
                                                <button onClick={() => {
                                                    const newRes = [...journalResources];
                                                    newRes.splice(idx, 1);
                                                    setJournalResources(newRes);
                                                }} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Resource Input */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={resourceInput}
                                                onChange={(e) => setResourceInput(e.target.value)}
                                                placeholder="Paste URL here..."
                                                className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddResource();
                                                }}
                                            />
                                            <button
                                                onClick={handleAddResource}
                                                className="p-2 bg-secondary/20 rounded-lg text-secondary border border-secondary/20 hover:bg-secondary/30 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Press Enter or + to add links</p>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-secondary" />
                                            Knowledge Dump
                                        </h4>
                                        {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                                    </div>
                                    <textarea
                                        value={journalNotes}
                                        onChange={(e) => setJournalNotes(e.target.value)}
                                        placeholder="Type your learnings, code snippets, or quick notes here..."
                                        className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleSaveJournal}
                                            className="flex-1 bg-white text-black font-bold uppercase tracking-wider py-3 rounded-xl hover:scale-[1.02] transition-transform"
                                        >
                                            Save Data
                                        </button>
                                        <button
                                            disabled={isExtracting}
                                            onClick={handleExtractProtocol}
                                            className="flex-1 bg-primary/20 text-primary border border-primary/20 font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isExtracting ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            Extract Protocol
                                        </button>
                                        <button
                                            onClick={() => setIsFlashcardModalOpen(true)}
                                            className="w-14 bg-secondary/20 text-secondary border border-secondary/20 font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-secondary/30 transition-colors flex items-center justify-center"
                                            title="Inject Flashcard"
                                        >
                                            <Zap className="w-5 h-5 fill-current" />
                                        </button>
                                    </div>
                                </div>

                                {/* Extracted Protocol Display */}
                                {extractedProtocol && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 pt-4"
                                    >
                                        <div className="h-px bg-white/10" />

                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold flex items-center gap-3">
                                                <Flame className="w-5 h-5 text-orange-500" />
                                                Action Tasks
                                            </h4>
                                            <div className="space-y-2">
                                                {extractedProtocol.tasks.map((task, i) => (
                                                    <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm">
                                                        <div className="w-5 h-5 rounded border border-white/20 shrink-0 mt-0.5" />
                                                        {task}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-bold flex items-center gap-3">
                                                    <Activity className="w-5 h-5 text-blue-500" />
                                                    Active Recall
                                                </h4>
                                                {/* AUTO-SAVE BUTTON FOR EXTRACTED CARDS */}
                                                <button
                                                    onClick={handleSaveExtracted}
                                                    className="text-xs bg-blue-500/20 text-blue-500 border border-blue-500/50 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide hover:bg-blue-500/30 transition-colors"
                                                >
                                                    Sync to Neural Net
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {extractedProtocol.flashcards.map((card, i) => (
                                                    <div key={i} className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
                                                        <div className="text-[10px] uppercase font-bold text-primary tracking-widest opacity-60">Recall Point</div>
                                                        <div className="font-bold">{card.q}</div>
                                                        <div className="text-sm text-muted-foreground italic border-t border-primary/10 pt-2 mt-2">
                                                            {card.a}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AddFlashcardModal
                isOpen={isFlashcardModalOpen}
                onClose={() => setIsFlashcardModalOpen(false)}
            />
        </div>
    );
};
