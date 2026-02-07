import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Play, Star, ChevronDown, ChevronRight, MapPin, Link as LinkIcon, Zap } from 'lucide-react';
import { Note } from '../../types/note';
import { Habit } from '../../types/habit';
import { HabitService } from '../../services/habit.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

interface SyllabusRoadmapProps {
    note: Note;
    onUpdateContent: (newContent: string) => Promise<void>;
}

// Helper to parse the Markdown into a structured Syllabus Tree
interface SyllabusNode {
    type: 'phase' | 'task';
    title: string;
    completed: boolean;
    day?: string; // "Day 1", etc.
    lineIndex: number; // For updating
    children?: SyllabusNode[];
}

const parseSyllabus = (content: string): SyllabusNode[] => {
    const lines = content.split('\n');
    const nodes: SyllabusNode[] = [];
    let currentPhase: SyllabusNode | null = null;

    lines.forEach((line, index) => {
        // Phase Header: "## Phase 1: The Core"
        if (line.startsWith('## ')) {
            if (currentPhase) {
                nodes.push(currentPhase);
            }
            currentPhase = {
                type: 'phase',
                title: line.replace('## ', '').trim(),
                completed: false, // Calculated later
                lineIndex: index,
                children: []
            };
        }
        // Task Item: "- [ ] **Day 1**: Title"
        else if (line.trim().startsWith('- [')) {
            const isCompleted = line.includes('[x]');
            // Extract Day and Title
            // "- [ ] **Day 1**: Installation" -> Day: "Day 1", Title: "Installation"
            const cleanLine = line.replace(/- \[[ x]\] /, '').trim();
            const dayMatch = cleanLine.match(/\*\*(Day \d+)\*\*:(.*)/);

            if (dayMatch) {
                const node: SyllabusNode = {
                    type: 'task',
                    day: dayMatch[1].trim(), // "Day 1"
                    title: dayMatch[2].trim(), // "Installation..."
                    completed: isCompleted,
                    lineIndex: index
                };
                if (currentPhase) {
                    currentPhase.children?.push(node);
                } else {
                    nodes.push(node); // Orphaned tasks?
                }
            }
        }
    });

    if (currentPhase) nodes.push(currentPhase);
    return nodes;
};

export const SyllabusRoadmap: React.FC<SyllabusRoadmapProps> = ({ note, onUpdateContent }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [tree, setTree] = useState<SyllabusNode[]>([]);
    const [linkedHabit, setLinkedHabit] = useState<Habit | null>(null);

    useEffect(() => {
        setTree(parseSyllabus(note.content));
    }, [note.content]);

    // Auto-Link to Habit
    useEffect(() => {
        const findHabit = async () => {
            try {
                const habits = await HabitService.getHabits();
                // Smart Linking Logic
                // 1. If note title contains "Python", look for habit with "Python"
                // 2. If note category matches habit category
                const keyword = note.title.split(' ')[0]; // e.g. "Python"
                const match = habits.find(h => h.title.includes(keyword) || h.category === note.category);

                if (match) {
                    setLinkedHabit(match);
                }
            } catch (e) { console.error(e); }
        };
        findHabit();
    }, [note.title, note.category]);

    const handleToggleTask = async (lineIndex: number, currentCompleted: boolean) => {
        const lines = note.content.split('\n');
        const line = lines[lineIndex];
        const isCompleting = !currentCompleted;

        // Toggle [ ] <-> [x]
        const newLine = isCompleting
            ? line.replace('[ ]', '[x]')
            : line.replace('[x]', '[ ]');

        lines[lineIndex] = newLine;
        const newContent = lines.join('\n');

        await onUpdateContent(newContent);

        if (isCompleting) {
            // 1. Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981'] // Blue, Purple, Green
            });

            // 2. Habit Check-in
            if (linkedHabit) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    // Only toggle if not already completed today to avoid double-counting
                    if (!linkedHabit.completedToday && user) {
                        await HabitService.toggleHabitCompletion(linkedHabit.id, today, true, user.id);
                        showToast('Habit Synced', `Completed: ${linkedHabit.title}`, { type: 'success' });
                    }
                } catch (e) {
                    console.error("Habit sync failed", e);
                }
            }
        }
    };

    // Calculate Global Progress
    const totalTasks = (note.content.match(/- \[/g) || []).length;
    const completedTasks = (note.content.match(/- \[x\]/g) || []).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="w-full space-y-8 p-4">
            {/* Header / HUD */}
            <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-primary w-full opacity-30" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Mission Progress
                            </h2>
                            {linkedHabit && (
                                <div className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full animate-in fade-in">
                                    <LinkIcon className="w-3 h-3" />
                                    Linked: {linkedHabit.title}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                            {completedTasks} / {totalTasks} NODES SECURE
                        </p>
                    </div>
                    <span className="font-mono text-4xl font-black text-foreground tracking-tighter">{progressPercent}%</span>
                </div>

                {/* Visual Bar */}
                <div className="h-4 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                </div>
            </div>

            {/* Phases Roadmap */}
            <div className="relative border-l-2 border-dashed border-primary/20 ml-6 md:ml-10 space-y-12">
                {tree.map((phase, phaseIdx) => {
                    const phaseCompletedTasks = phase.children?.filter(c => c.completed).length || 0;
                    const phaseTotal = phase.children?.length || 0;
                    const isPhaseDone = phaseTotal > 0 && phaseCompletedTasks === phaseTotal;
                    const isPhaseLocked = phaseIdx > 0 && !tree[phaseIdx - 1]?.children?.every(c => c.completed); // Previous phase not done

                    return (
                        <div key={phaseIdx} className={`relative pl-8 md:pl-12 transition-all duration-500 ${isPhaseLocked ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            {/* Phase Marker */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background ${isPhaseDone ? 'bg-green-500 ring-4 ring-green-500/20' : 'bg-primary ring-4 ring-primary/20'}`} />

                            <div className="mb-6">
                                <h3 className="text-lg font-bold uppercase tracking-wider text-foreground/80 mb-1">{phase.title}</h3>
                                <p className="text-xs font-mono text-muted-foreground uppercase">{phaseCompletedTasks} / {phaseTotal} Nodes Active</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {phase.children?.map((task, taskIdx) => {
                                    // Determine if this is the "Active / Next" task
                                    // It is active if it's not done, and the one before it IS done (or it's the first one).
                                    const prevTask = phase.children?.[taskIdx - 1];
                                    const isNext = !task.completed && (!prevTask || prevTask.completed);

                                    return (
                                        <motion.button
                                            key={taskIdx}
                                            onClick={() => handleToggleTask(task.lineIndex, task.completed)}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`relative group w-full text-left p-4 rounded-2xl border transition-all duration-300
                                                ${task.completed
                                                    ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                                    : isNext
                                                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] ring-1 ring-blue-500/50'
                                                        : 'bg-card border-border hover:border-primary/50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                                                    ${task.completed ? 'bg-green-500 border-green-500 text-black' : isNext ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : 'border-muted-foreground/30 text-transparent'}
                                                `}>
                                                    {task.completed ? <Check className="w-5 h-5" strokeWidth={4} /> : isNext ? <Play className="w-4 h-4 fill-current ml-0.5" /> : null}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${task.completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                            {task.day}
                                                        </span>
                                                        {isNext && <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 rounded uppercase animate-pulse">Current Objective</span>}
                                                    </div>
                                                    <span className={`font-medium ${task.completed ? 'text-muted-foreground line-through decoration-green-500/50' : 'text-foreground'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
