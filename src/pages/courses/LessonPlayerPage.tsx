import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, Circle, ArrowRight, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Course, CourseModule, Lesson, LessonProgress } from '../../types/course';
import { CourseService } from '../../services/course.service';
import { useToast } from '../../context/ToastContext';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const LessonPlayerPage: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const { user } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [markedComplete, setMarkedComplete] = useState(false);

    useEffect(() => {
        // ... existing useEffect ...
        if (!courseId || !lessonId) return;
        const load = async () => {
            try {
                const { course, modules } = await CourseService.getCourseDetails(courseId);
                setCourse(course);
                setModules(modules);

                // Find current lesson
                let found: Lesson | undefined;
                modules.forEach(m => {
                    const l = m.lessons?.find(l => l.id === lessonId);
                    if (l) found = l;
                });

                if (found) setCurrentLesson(found);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [courseId, lessonId]);

    const handleComplete = async () => {
        if (!currentLesson || !course || !user) return;
        try {
            if (!markedComplete) {
                await CourseService.markLessonComplete(currentLesson.id, course.id, user.id);
                setMarkedComplete(true);
                showToast('Progress Saved', 'Lesson Complete', { type: 'success' });
            }

            // FIND NEXT LESSON
            let nextLessonId: string | null = null;
            let foundCurrent = false;

            // Iterate through all modules and lessons linearly
            for (const mod of modules) {
                if (mod.lessons) {
                    for (const lesson of mod.lessons) {
                        if (foundCurrent) {
                            nextLessonId = lesson.id;
                            break;
                        }
                        if (lesson.id === currentLesson.id) {
                            foundCurrent = true;
                        }
                    }
                }
                if (nextLessonId) break;
            }

            if (nextLessonId) {
                navigate(`/courses/${course.id}/learn/${nextLessonId}`);
            } else {
                showToast('Status Update', 'Course Protocol Complete. Initializing Reward Sequence...', { type: 'success' });
                // Redirect to Dashboard Achievement Hub
                setTimeout(() => navigate('/dashboard?action=achievement'), 1500);
            }

        } catch (e) {
            showToast('Error', 'Failed to save progress', { type: 'error' });
        }
    };

    if (!currentLesson || !course) {
        return (
            <div className={`flex h-screen bg-background overflow-hidden relative ${isWild ? 'wild' : ''}`}>
                {/* Skeleton Sidebar - Desktop */}
                <div className="w-80 border-r border-white/10 bg-black/50 hidden md:block h-full p-6 space-y-6">
                    <div className="h-6 w-3/4 bg-muted/20 rounded animate-pulse" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-1/2 bg-muted/10 rounded" />
                                <div className="h-8 w-full bg-muted/5 rounded" />
                                <div className="h-8 w-full bg-muted/5 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skeleton Main Content */}
                <div className="flex-1 flex flex-col relative bg-[#050505]">
                    {/* Top Skeleton */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background/50">
                        <div className="h-8 w-32 bg-muted/20 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-muted/10 rounded animate-pulse" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8">
                        <div className="h-12 w-3/4 bg-muted/20 rounded-lg animate-pulse" />
                        <div className="aspect-video bg-muted/10 rounded-xl border border-white/5 animate-pulse" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-4 w-full bg-muted/10 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen bg-background overflow-hidden relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : ''}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            {/* Sidebar (Module List) */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className="w-80 border-r border-white/10 bg-black/50 backdrop-blur absolute md:relative z-20 h-full flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-bold uppercase tracking-wider text-sm truncate pr-4">{course.title}</h3>
                            <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {modules.map((module, i) => (
                                <div key={module.id}>
                                    <h4 className="text-xs font-mono text-muted-foreground uppercase mb-2 pl-2">Module {i + 1}: {module.title}</h4>
                                    <div className="space-y-1">
                                        {module.lessons?.map(lesson => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => navigate(`/courses/${course.id}/learn/${lesson.id}`)}
                                                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors
                                                    ${lesson.id === currentLesson.id ? 'bg-primary/20 text-primary border border-primary/20' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}
                                                `}
                                            >
                                                {/* Status Icon Placeholder - Needs real status data */}
                                                <Circle className="w-3 h-3" />
                                                <span className="truncate">{lesson.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-[#050505]">
                {/* Top Nav */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background/50 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded">
                            <Menu className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate(`/courses/${course.id}`)} className="text-sm font-mono text-muted-foreground hover:text-white flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4" /> COURSE MAP
                        </button>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                        {currentLesson.type.toUpperCase()} • {currentLesson.duration_minutes} MIN
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
                    <div className="prose prose-invert prose-lg max-w-none">
                        <h1 className="text-4xl font-black mb-8">{currentLesson.title}</h1>

                        {/* Video Embed Placeholder */}
                        {currentLesson.type === 'video' && (
                            <div className="aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
                                <span className="text-muted-foreground font-mono">[ VIDEO FEED LINK MISSING ]</span>
                            </div>
                        )}

                        <div className="text-gray-300 leading-relaxed">
                            <ReactMarkdown>
                                {currentLesson.content || "_No text content available for this node._"}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Completion Action */}
                    <div className="mt-20 border-t border-white/10 pt-10 flex justify-end">
                        <button
                            onClick={handleComplete}
                            disabled={markedComplete}
                            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-all
                                ${markedComplete
                                    ? 'bg-green-500/20 text-green-500 cursor-default'
                                    : 'bg-primary text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                }
                            `}
                        >
                            {markedComplete ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Module Complete
                                </>
                            ) : (
                                <>
                                    Mark Complete
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
