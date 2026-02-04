import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Clock, Zap, Lock, Search, Terminal, Cpu, Download, Shield, ChevronRight, Activity } from 'lucide-react';
import { Course } from '../../types/course';
import { CourseService } from '../../services/course.service';
import { HabitService } from '../../services/habit.service';
import { NoteService } from '../../services/note.service';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

// Course Data Imports
import { PythonCourseData } from '../../data/python-course';
import { DSACourseData } from '../../data/dsa-course';
import { WebDatabasesCourseData } from '../../data/web-databases-course';
import { GitProjectsCourseData } from '../../data/git-projects-course';
import { SoftSkillsCourseData } from '../../data/soft-skills-course';
import { AptitudeInterviewsCourseData } from '../../data/aptitude-interviews-course';
import { ResumePortfolioCourseData } from '../../data/resume-portfolio-course';

// --- Neural Installer Component ---
const NeuralInstaller = ({ onInstallComplete }: { onInstallComplete: () => void }) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const { showToast } = useToast();
    const [installing, setInstalling] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `> ${msg}`]);
    };

    const modules = [
        { id: 'python', name: 'Python Mastery', data: PythonCourseData, icon: Terminal, color: 'text-yellow-500', desc: 'Core Language Syntax & Logic' },
        { id: 'dsa', name: 'DSA Protocols', data: DSACourseData, icon: Cpu, color: 'text-green-500', desc: 'Algorithms & Optimization' },
        { id: 'web', name: 'Web & DB', data: WebDatabasesCourseData, icon: Activity, color: 'text-blue-500', desc: 'Full Stack Architecture' },
        { id: 'git', name: 'Git Systems', data: GitProjectsCourseData, icon: Shield, color: 'text-orange-500', desc: 'Version Control & Workflow' },
        { id: 'soft', name: 'Social Engineering', data: SoftSkillsCourseData, icon: Zap, color: 'text-purple-500', desc: 'Soft Skills & Communication' },
        { id: 'aptitude', name: 'Logic Gates', data: AptitudeInterviewsCourseData, icon: Lock, color: 'text-pink-500', desc: 'Aptitude & Analysis' },
        { id: 'resume', name: 'Identity Matrix', data: ResumePortfolioCourseData, icon: BookOpen, color: 'text-cyan-500', desc: 'Resume & Portfolio' },
    ];

    const handleInstall = async (mod: typeof modules[0]) => {
        if (installing) return;
        setInstalling(mod.id);
        setLogs([`> INITIALIZING UPLINK FOR [${mod.name.toUpperCase()}]...`]);

        try {
            await new Promise(r => setTimeout(r, 800));
            addLog("SEARCHING NEURAL NET...");

            await new Promise(r => setTimeout(r, 600));
            addLog("DOWNLOADING HABIT PROTOCOLS...");

            // 1. Create Habit
            await HabitService.createHabit(mod.data.habit as any);
            await new Promise(r => setTimeout(r, 400));
            addLog("HABITS INJECTED.");

            // 2. Create Note
            addLog("COMPILING SYLLABUS...");
            await NoteService.createNote(mod.data.note as any);
            await new Promise(r => setTimeout(r, 400));
            addLog("SYLLABUS DECRYPTED.");

            // 3. Seed Course
            addLog("ESTABLISHING ACADEMY LINK...");
            const thumbnail = "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800"; // Generic for now or custom logic

            // Using logic similar to DataSection but inline or simpler
            // Reuse logic from DataSection for thumbnail selection if desired, or simplify
            let thumbUrl = thumbnail;
            if (mod.id === 'python') thumbUrl = "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'dsa') thumbUrl = "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'web') thumbUrl = "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'git') thumbUrl = "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'soft') thumbUrl = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'aptitude') thumbUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800";
            else if (mod.id === 'resume') thumbUrl = "https://images.unsplash.com/photo-1586281380117-0a632d671f98?auto=format&fit=crop&q=80&w=800";

            const tags = mod.data.note.title.toLowerCase().split(' ').filter((w: string) => w.length > 3);
            const courseId = await (CourseService as any).ensureCourseExists(mod.data, thumbUrl, "Intermediate", tags, true);

            addLog("ENROLLING USER...");
            try {
                await CourseService.enrollInCourse(courseId);
            } catch (e) {
                // ignore
            }

            await new Promise(r => setTimeout(r, 600));
            addLog("INSTALLATION COMPLETE.");
            addLog("SYSTEM REBOOT REQUIRED FOR FULL INTEGRATION.");

            showToast("Module Installed", `${mod.name} is now active.`, { type: 'success' });

            // Refresh parent
            setTimeout(() => {
                setInstalling(null);
                setLogs([]);
                onInstallComplete();
            }, 2000);

        } catch (error: any) {
            addLog(`ERROR: ${error.message}`);
            setInstalling(null);
        }
    };

    return (
        <div className={`mt-20 border-t ${isWild ? 'border-red-900/30' : 'border-white/10'} pt-12`}>
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-xl ${isWild ? 'bg-red-900/20 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    <Download className="w-6 h-6" />
                </div>
                <div>
                    <h2 className={`text-2xl font-black uppercase tracking-tight ${isWild ? 'text-red-500' : 'text-white'}`}>
                        System Modules
                    </h2>
                    <p className="text-sm font-mono text-muted-foreground">
                        AVAILABLE EXPANSION PACKS // READY FOR INJECTION
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module List */}
                <div className="space-y-4">
                    {modules.map(mod => (
                        <div
                            key={mod.id}
                            className={`
                                group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                                ${installing === mod.id
                                    ? 'bg-primary/10 border-primary animate-pulse'
                                    : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                                }
                            `}
                            onClick={() => handleInstall(mod)}
                        >
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center 
                                ${mod.color} bg-black/50 border border-white/10
                            `}>
                                <mod.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold uppercase text-sm tracking-wider">{mod.name}</h3>
                                <p className="text-xs text-muted-foreground font-mono">{mod.desc}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px]"
                                disabled={!!installing}
                            >
                                {installing === mod.id ? 'INSTALLING...' : 'INJECT'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Terminal Output */}
                <div className={`
                    rounded-xl border p-6 font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar flex flex-col
                    ${isWild
                        ? 'bg-black border-red-900/50 text-red-500 shadow-[inset_0_0_50px_rgba(220,38,38,0.1)]'
                        : 'bg-[#050505] border-white/10 text-green-500 shadow-inner'
                    }
                `}>
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2 opacity-50">
                        <span>TERMINAL_OUTPUT</span>
                        <span>STATUS: {installing ? 'BUSY' : 'IDLE'}</span>
                    </div>

                    <div className="space-y-2 flex-1">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                                <Activity className="w-12 h-12 animate-pulse" />
                                <p>AWAITING INPUT...</p>
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="break-all"
                                >
                                    {log}
                                </motion.div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CourseLibraryPage: React.FC = () => {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const data = await CourseService.getPublishedCourses();
            setCourses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8 animate-pulse">
            <div className="text-center space-y-4">
                <div className="text-4xl md:text-6xl font-black italic tracking-tighter text-primary animate-glitch uppercase">Loading Neural Protocols...</div>
                <div className="h-1 w-64 bg-primary mx-auto"></div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen bg-background text-foreground p-6 md:p-12 space-y-12 relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : ''}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            {/* Hero Header */}
            <div className="space-y-4 max-w-4xl">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase relative inline-block">
                    Academy
                    <span className="absolute -top-4 -right-8 opacity-20 rotate-12">
                        <Zap className="w-12 h-12 fill-yellow-400 text-yellow-500" />
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground font-light tracking-wide max-w-2xl">
                    Select a protocol. Initiate the download. Upgrade your biological software.
                </p>
            </div>

            {/* Search / Filter (Visual Only for now) */}
            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                    type="text"
                    placeholder="Identify Protocol..."
                    className="w-full bg-secondary/30 border border-white/10 rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, idx) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="group relative bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-500"
                    >
                        {/* Dynamic Gradient Border on Hover */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/50 rounded-3xl transition-colors duration-500 pointer-events-none" />

                        {/* Thumbnail / Header */}
                        <div className="h-48 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
                            {/* Abstract Cyber Grid Background */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                            />

                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <BookOpen className="w-16 h-16 text-white/10" />
                                </div>
                            )}

                            {/* Level Badge */}
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-xl">
                                {course.difficulty_level}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 relative z-10">
                            <h3 className="text-2xl font-black uppercase leading-tight group-hover:text-purple-400 transition-colors">
                                {course.title}
                            </h3>

                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                {course.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {course.tags?.map(t => (
                                    <span key={t} className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-white/5">
                                        #{t}
                                    </span>
                                ))}
                            </div>

                            {/* Footer Stats */}
                            <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {course.duration_weeks} WEEKS
                                </span>
                                <span className="flex items-center gap-1.5 text-green-500 group-hover:animate-pulse">
                                    <Trophy className="w-3.5 h-3.5" />
                                    OPEN ACCESS
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Coming Soon Placeholder */}
                {courses.length === 0 && (
                    <div className="col-span-full text-center py-20 opacity-50">
                        <Lock className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No Protocols Online</h3>
                        <p>The library is currently offline. Initializing core dump...</p>
                    </div>
                )}
            </div>

            {/* Neural Installer Integration */}
            <NeuralInstaller onInstallComplete={load} />
        </div>
    );
};
