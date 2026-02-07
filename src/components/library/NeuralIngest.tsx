import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { YouTubeService } from '../../services/youtube.service';
import { LearningService } from '../../services/learning.service';
import { CourseService } from '../../services/course.service';
import { MultiverseService } from '../../services/multiverse.service';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Youtube, Folder, GraduationCap, X, Link as LinkIcon, DownloadCloud, Database, Hash, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface NeuralIngestProps {
    onSuccess: () => void;
    activeFolderId: string | null;
    activeCourseId: string | null;
    folders: any[];
    courses: any[];
    habits: any[];
}

export function NeuralIngest({ onSuccess, activeFolderId, activeCourseId, folders, courses, habits }: NeuralIngestProps) {
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    // Core State
    const [rawInput, setRawInput] = useState('');
    const [detectedType, setDetectedType] = useState<'video' | 'link' | 'folder' | 'course' | 'text'>('text');
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    // Advanced Metadata
    const [targetFolderId, setTargetFolderId] = useState<string>(activeFolderId || '');
    const [targetCourseId, setTargetCourseId] = useState<string>(activeCourseId || '');
    const [targetHabitId, setTargetHabitId] = useState<string>('');

    // Pre-fill context when props change
    useEffect(() => {
        if (activeFolderId) setTargetFolderId(activeFolderId);
        if (activeCourseId) setTargetCourseId(activeCourseId);
    }, [activeFolderId, activeCourseId]);

    // Auto-detect type
    useEffect(() => {
        if (!rawInput) {
            setDetectedType('text');
            return;
        }

        const trimmed = rawInput.trim();
        if (trimmed.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
            setDetectedType('video');
        } else if (trimmed.match(/^(https?:\/\/).+$/)) {
            setDetectedType('link');
        } else {
            // Heuristic: If just text, default to folder or course if keywords present
            if (trimmed.toLowerCase().includes('course') || trimmed.toLowerCase().includes('mastery')) {
                setDetectedType('course');
            } else {
                setDetectedType('text'); // Could be folder or course
            }
        }
    }, [rawInput]);

    const handleIngest = async () => {
        if (!rawInput.trim()) return;
        setLoading(true);

        try {
            let successMessage = 'Data Ingested Successfully';

            // 1. YouTube Video
            if (detectedType === 'video') {
                const v = await YouTubeService.addVideo({
                    url: rawInput,
                    folderId: targetFolderId || undefined,
                    courseId: targetCourseId || undefined,
                    habitId: targetHabitId || undefined,
                    difficulty: 'beginner'
                });

                if (targetHabitId) {
                    await MultiverseService.createLink({
                        sourceType: 'video', sourceId: v.id,
                        targetType: 'habit', targetId: targetHabitId,
                        relationType: 'reference'
                    });
                }
                successMessage = `Neural Link Established: ${v.title.slice(0, 20)}...`;
            }

            // 2. Generic Link / Resource
            else if (detectedType === 'link') {
                const r = await LearningService.createResource({
                    title: 'New Resource', // Service should ideally fetch metadata or user provide it
                    url: rawInput,
                    type: 'link',
                    folderId: targetFolderId || undefined,
                    courseId: targetCourseId || undefined,
                    habitId: targetHabitId || undefined // Fixed: Added correct property name
                });
                successMessage = 'External Resource Indexed';
            }

            // 3. Course (Explicit or Detected)
            else if (detectedType === 'course') {
                await CourseService.createCourse({
                    title: rawInput,
                    folderId: targetFolderId || undefined
                });
                successMessage = `Curriculum Node Created: ${rawInput}`;
            }

            // 4. Folder (Default Text Handler)
            else {
                // If user selected "Folder" explicitly or just typed text
                await LearningService.createFolder({ name: rawInput });
                successMessage = `Knowledge Cluster Initialized: ${rawInput}`;
            }

            setRawInput('');
            onSuccess();
            showToast('System', successMessage, { type: 'success' });
            setIsExpanded(false);

        } catch (error: any) {
            console.error("Ingest Failed:", error);
            showToast('Error', `Ingest Failed: ${error.message}`, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "w-full bg-card border rounded-2xl overflow-hidden transition-all duration-300",
            isWild ? "border-primary/30 shadow-[0_0_20px_rgba(0,0,0,0.3)]" : "border-border shadow-sm",
            isExpanded ? "ring-2 ring-primary/20" : ""
        )}>
            {/* Main Input Area */}
            <div className="relative p-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                    {detectedType === 'video' && <Youtube className="w-5 h-5 text-red-500 animate-pulse" />}
                    {detectedType === 'link' && <LinkIcon className="w-5 h-5 text-blue-500" />}
                    {detectedType === 'course' && <GraduationCap className="w-5 h-5 text-green-500" />}
                    {(detectedType === 'folder' || detectedType === 'text') && <Database className="w-5 h-5" />}
                </div>

                <input
                    type="text"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Inject URL, Video, or Topic Name..."
                    className={cn(
                        "w-full h-14 pl-12 pr-32 bg-transparent border-none outline-none text-lg font-bold placeholder:text-muted-foreground/30",
                        isWild ? "font-mono tracking-tight" : "font-sans"
                    )}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isExpanded) {
                            handleIngest();
                        }
                    }}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Manual Type Override */}
                    {isExpanded && rawInput && (
                        <div className="flex bg-muted/50 rounded-lg p-0.5">
                            <button
                                onClick={() => setDetectedType('folder')}
                                className={cn("p-1.5 rounded-md transition-colors", detectedType === 'folder' || detectedType === 'text' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                                title="Folder"
                            ><Folder className="w-3 h-3" /></button>
                            <button
                                onClick={() => setDetectedType('course')}
                                className={cn("p-1.5 rounded-md transition-colors", detectedType === 'course' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                                title="Course"
                            ><GraduationCap className="w-3 h-3" /></button>
                        </div>
                    )}

                    <Button
                        size="sm"
                        onClick={handleIngest}
                        disabled={loading || !rawInput}
                        className={cn("h-9 px-4 font-bold uppercase text-[10px] tracking-widest", isWild ? "rounded-none" : "rounded-lg")}
                    >
                        {loading ? <DownloadCloud className="w-4 h-4 animate-bounce" /> : "Ingest"}
                    </Button>
                </div>
            </div>

            {/* Extended Controls (Metadata) */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/30 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                            <select
                                value={targetFolderId}
                                onChange={(e) => setTargetFolderId(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-background border-none text-xs font-medium focus:ring-1 ring-primary/20"
                            >
                                <option value="">root_matrix</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>📂 {f.name}</option>
                                ))}
                            </select>
                        </div>

                        {(detectedType === 'video' || detectedType === 'link') && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Curriculum</label>
                                <select
                                    value={targetCourseId}
                                    onChange={(e) => setTargetCourseId(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-background border-none text-xs font-medium focus:ring-1 ring-primary/20"
                                >
                                    <option value="">No Course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>🎓 {c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Link Habit</label>
                            <select
                                value={targetHabitId}
                                onChange={(e) => setTargetHabitId(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-background border-none text-xs font-medium focus:ring-1 ring-primary/20"
                            >
                                <option value="">No Link</option>
                                {habits.map(h => (
                                    <option key={h.id} value={h.id}>🔗 {h.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> Close Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
