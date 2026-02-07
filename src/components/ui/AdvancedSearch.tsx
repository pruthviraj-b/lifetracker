import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Flame, StickyNote, BookOpen, Clock, ArrowRight, Sparkles, Zap, Network, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HabitService } from '../../services/habit.service';
import { ReminderService } from '../../services/reminder.service';
import { FlashcardService } from '../../services/flashcard.service';
import smartChatAnalyzer from '../../utils/smartChatAnalyzer';
import { useAuth } from '../../context/AuthContext';

interface SearchResult {
    id: string;
    title: string;
    type: 'habit' | 'note' | 'course' | 'navigation' | 'action' | 'answer' | 'system';
    path: string;
    description?: string;
    meta?: any;
}

export const AdvancedSearch = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [thinkingStep, setThinkingStep] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [status, setStatus] = useState<string | null>(null);
    const [wizard, setWizard] = useState<{
        active: boolean;
        type: 'habit' | 'reminder' | null;
        step: number;
        data: any;
    }>({ active: false, type: null, step: 0, data: {} });

    const inputRef = useRef<HTMLInputElement>(null);

    const THINKING_PHASES = ["Parsing Intent...", "Validating Schema...", "Directing Core...", "Executing Nexus..."];
    const WIZARD_STEPS = {
        habit: [
            { key: 'title', question: "IDENTIFY RITUAL (Name):", placeholder: "e.g., Deep Meditation" },
            { key: 'time', question: "TEMPORAL ANCHOR (Time):", placeholder: "e.g., 07:00 or Morning" },
            { key: 'frequency', question: "FREQUENCY PATTERN:", placeholder: "Daily / Weekdays / Weekends" }
        ],
        reminder: [
            { key: 'title', question: "REMINDER CONTENT:", placeholder: "What should I remind you?" },
            { key: 'time', question: "ALERT TIME:", placeholder: "e.g., 14:30" }
        ]
    };

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            document.body.style.overflow = 'hidden';
            setStatus(null);
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setResults([]);
            setWizard({ active: false, type: null, step: 0, data: {} });
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (!query || wizard.active) {
            if (!wizard.active) {
                setResults([]);
                setIsThinking(false);
            }
            return;
        }

        setIsThinking(true);
        setStatus(null);
        let phaseIdx = 0;
        const phaseInterval = setInterval(() => {
            setThinkingStep(THINKING_PHASES[phaseIdx % THINKING_PHASES.length]);
            phaseIdx++;
        }, 400);

        const timer = setTimeout(async () => {
            clearInterval(phaseInterval);

            const newResults: SearchResult[] = [];

            // ========== SMART ANALYZER INTEGRATION ==========
            const analysis = smartChatAnalyzer.analyzeMessage(query);

            // Handle Navigation Intent (Auto-route)
            if (analysis.intent === 'navigation' && analysis.navigation) {
                newResults.push({
                    id: 'nav-auto',
                    title: `→ ${analysis.navigation.label}`,
                    type: 'navigation',
                    path: analysis.navigation.route,
                    description: analysis.message,
                    meta: { confidence: analysis.confidence }
                });
            }

            // Handle Action Intent (Create/View/Complete/Delete)
            if (analysis.intent === 'action' && analysis.action) {
                const { type: actionType, target } = analysis.action;
                newResults.push({
                    id: `action-${actionType}`,
                    title: `${actionType.toUpperCase()}: ${target}`,
                    type: 'action',
                    path: '/dashboard',
                    description: analysis.message,
                    meta: {
                        command: `${actionType.toUpperCase()}_${target.toUpperCase()}`,
                        value: query,
                        entities: analysis.entities
                    }
                });
            }

            // Fallback: Navigation Directory
            const navDirectory: SearchResult[] = [
                { id: 'nav-dash', title: 'Dashboard', type: 'navigation' as const, path: '/dashboard', description: 'Central Hub' },
                { id: 'nav-habits', title: 'Habits', type: 'navigation' as const, path: '/protocols', description: 'Manage Rituals' },
                { id: 'nav-academy', title: 'Academy', type: 'navigation' as const, path: '/courses', description: 'Learning Modules' },
                { id: 'nav-analytics', title: 'Analytics', type: 'navigation' as const, path: '/analytics', description: 'Performance Metrics' },
                { id: 'nav-recall', title: 'Recall', type: 'navigation' as const, path: '/recall', description: 'Memory System' },
                { id: 'nav-network', title: 'Network', type: 'navigation' as const, path: '/network', description: 'Social Layer' },
                { id: 'nav-achievements', title: 'Achievements', type: 'navigation' as const, path: '/achievements', description: 'Trophies' },
                { id: 'nav-settings', title: 'Settings', type: 'navigation' as const, path: '/settings', description: 'Configuration' },
                { id: 'nav-reminders', title: 'Reminders', type: 'navigation' as const, path: '/reminders', description: 'Alerts' },
            ].filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.description?.toLowerCase().includes(query.toLowerCase()));

            // Real Habit Search
            const habits = await HabitService.getHabits();
            const habitResults: SearchResult[] = habits
                .filter(h => h.title.toLowerCase().includes(query.toLowerCase()))
                .map(h => ({ id: h.id, title: h.title, type: 'habit', path: '/dashboard', description: 'Active Protocol' }));

            setResults([...newResults, ...navDirectory, ...habitResults]);
            setSelectedIndex(0);
            setIsThinking(false);
        }, 800);

        return () => {
            clearTimeout(timer);
            clearInterval(phaseInterval);
        };
    }, [query, wizard.active]);

    // Wizard Input Handler
    const handleWizardInput = async () => {
        if (!wizard.type) return;
        if (!user) return; // Add check

        const steps = WIZARD_STEPS[wizard.type];
        const currentStep = steps[wizard.step];
        const value = query.trim();

        if (!value && wizard.step < steps.length) return; // Require input

        const newData = { ...wizard.data, [currentStep.key]: value };

        if (wizard.step < steps.length - 1) {
            // Next Step
            setWizard(prev => ({ ...prev, step: prev.step + 1, data: newData }));
            setQuery('');
            return;
        }

        // Finalize
        setIsExecuting(true);
        setStatus('PROCESSING WIZARD DATA...');

        try {
            if (wizard.type === 'habit') {
                // Parse Frequency
                let frequency: number[] = [0, 1, 2, 3, 4, 5, 6]; // Default Daily
                const freqInput = newData.frequency.toLowerCase();
                if (freqInput.includes('weekd')) frequency = [1, 2, 3, 4, 5];
                if (freqInput.includes('weeke')) frequency = [0, 6];

                // Parse Time
                let timeOfDay = 'anytime';
                const timeInput = newData.time.toLowerCase();
                if (timeInput.includes('morn') || parseInt(timeInput) < 12) timeOfDay = 'morning';
                else if (timeInput.includes('after') || (parseInt(timeInput) >= 12 && parseInt(timeInput) < 17)) timeOfDay = 'afternoon';
                else if (timeInput.includes('even') || parseInt(timeInput) >= 17) timeOfDay = 'evening';

                await HabitService.createHabit({
                    title: newData.title,
                    category: 'work',
                    timeOfDay: timeOfDay as any,
                    frequency: frequency as any,
                    type: 'habit',
                    goalDuration: 15,
                    priority: 'medium',
                    order: 0
                }, user.id);
            } else if (wizard.type === 'reminder') {
                await ReminderService.createReminder({
                    title: newData.title,
                    time: newData.time, // Improve validation if needed
                    days: [0, 1, 2, 3, 4, 5, 6],
                    isEnabled: true,
                    notificationType: 'push'
                });
            }

            setStatus(`SUCCESS: ${wizard.type.toUpperCase()} CREATED`);
            setTimeout(() => {
                navigate('/dashboard');
                onClose();
            }, 1000);
        } catch (err) {
            setStatus('ERROR: CREATION FAILED');
            console.error(err);
        } finally {
            setIsExecuting(false);
            setWizard({ active: false, type: null, step: 0, data: {} });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            }
            if (e.key === 'Enter') {
                if (wizard.active) {
                    handleWizardInput();
                } else if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [results, selectedIndex]);

    const handleSelect = async (result: SearchResult) => {
        if (result.type === 'action') {
            setIsExecuting(true);
            try {
                // Start Wizard instead of auto-executing
                if (result.meta.command === 'CREATE_HABIT') {
                    setWizard({
                        active: true,
                        type: 'habit',
                        step: 0,
                        // Pre-fill prompt if they typed "Create meditation"
                        data: result.meta.value !== 'New Entry' ? { title: result.meta.value } : {}
                    });
                    setQuery(''); // Clear for first input
                    if (result.meta.value !== 'New Entry') {
                        // If we already have title, skip to step 1
                        setWizard(prev => ({ ...prev, active: true, type: 'habit', step: 1, data: { title: result.meta.value } }));
                    }
                    return;
                }

                if (result.meta.command === 'SET_REMINDER') {
                    setWizard({
                        active: true,
                        type: 'reminder',
                        step: 1, // Assume title is captured, jump to time. Or verify.
                        data: { title: result.meta.value }
                    });
                    setQuery('');
                    return;
                }

                // Power Commands
                if (result.meta.command === 'RESET_SYSTEM') {
                    setIsExecuting(true);
                    try {
                        await HabitService.resetAccount();
                        setStatus('SUCCESS: System Reset Complete');
                        setTimeout(() => window.location.reload(), 1500);
                    } catch { setStatus('ERROR: RESET FAILED'); }
                    return;
                }
            } catch (err) {
                console.error("Action selection error:", err);
                setIsExecuting(false);
            }
        }
        navigate(result.path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="relative w-full max-w-3xl bg-card border border-border shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden"
                    >
                        {/* Status Bar */}
                        <div className="px-6 py-2 bg-secondary/50 border-b border-border flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                            <div className="flex items-center gap-4">
                                <span>RITU OS KERNEL v4.5.12</span>
                                <span className="text-primary/60">● CONNECTION SECURE</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Search Input Area */}
                        <div className="p-8 flex items-center gap-6 bg-background/30 backdrop-blur-md">
                            <div className="relative flex-1 group">
                                <Search className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-300 ${isThinking || wizard.active ? 'text-primary animate-pulse scale-110' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={wizard.active && wizard.type
                                        ? WIZARD_STEPS[wizard.type][wizard.step].placeholder
                                        : "Enter command or search workspace..."}
                                    className="w-full bg-transparent pl-10 pr-4 py-3 text-2xl font-serif outline-none text-foreground placeholder:text-muted-foreground/20 selection:bg-primary/20"
                                    disabled={isExecuting}
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-4 min-w-[140px] justify-end">
                                {isThinking || isExecuting ? (
                                    <div className="flex flex-col items-end">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                                            <Sparkles className="w-5 h-5 text-primary" />
                                        </motion.div>
                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest mt-1">
                                            {isExecuting ? 'Writing Data...' : thinkingStep}
                                        </span>
                                    </div>
                                ) : (
                                    <kbd className="flex h-8 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 text-[10px] font-black text-muted-foreground shadow-sm">
                                        <Command className="w-3 h-3" /> ENTER
                                    </kbd>
                                )}
                            </div>
                        </div>

                        {/* Wizard Overlay or Main Body */}
                        {wizard.active ? (
                            <div className="p-12 min-h-[40vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                                        INITIATING {wizard.type === 'habit' ? 'RITUAL' : 'PROTOCOL'} SEQUENCE
                                    </h3>
                                    <h2 className="text-3xl font-serif text-foreground">
                                        {wizard.type && WIZARD_STEPS[wizard.type][wizard.step].question}
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    {wizard.type && WIZARD_STEPS[wizard.type].map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1 w-12 rounded-full transition-all duration-300 ${idx <= wizard.step ? 'bg-primary' : 'bg-secondary'}`}
                                        />
                                    ))}
                                </div>
                                <div className="p-4 bg-secondary/30 rounded-xl max-w-md text-center">
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {JSON.stringify(wizard.data).replace(/["{}]/g, '').replace(/,/g, ' | ')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3 space-y-2 pb-8">
                                {status && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mx-3 p-4 rounded-2xl border flex items-center gap-3 font-bold text-xs tracking-wide ${status.startsWith('SUCCESS') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}
                                    >
                                        {status.startsWith('SUCCESS') ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        {status}
                                    </motion.div>
                                )}

                                {query === '' ? (
                                    <div className="p-16 text-center space-y-6">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                            <div className="relative w-24 h-24 bg-secondary rounded-[2.5rem] border border-border shadow-xl flex items-center justify-center mx-auto">
                                                <Command className="w-10 h-10 text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-serif text-foreground">Advanced Semantic Terminal</h2>
                                            <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto">Direct access to RITU OS protocols. Execute habits, set reminders, and query system stats with natural language.</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {['set ritual: meditation', 'analyze performance', 'spawn task: call ritu'].map(chip => (
                                                <button
                                                    key={chip}
                                                    onClick={() => setQuery(chip.split(':')[1]?.trim() || chip)}
                                                    className="px-4 py-2 bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 border border-border/50 rounded-2xl text-[11px] font-bold text-muted-foreground transition-all duration-300"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : results.length > 0 ? (
                                    results.map((result, index) => (
                                        <motion.div
                                            key={result.id}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`
                                            group w-full p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer relative overflow-hidden
                                            ${index === selectedIndex ? 'bg-secondary border-primary/20 scale-[1.01] shadow-xl' : 'bg-transparent border-transparent'}
                                        `}
                                            onClick={() => handleSelect(result)}
                                        >
                                            {index === selectedIndex && (
                                                <motion.div
                                                    layoutId="active-bg"
                                                    className="absolute inset-0 bg-primary/[0.03]"
                                                />
                                            )}
                                            <div className="flex items-start gap-5 relative z-10">
                                                <div className={`
                                                p-3.5 rounded-2xl transition-all duration-300
                                                ${index === selectedIndex ? 'bg-primary text-white shadow-[0_12px_24px_-8px_rgba(217,119,87,0.4)]' : 'bg-secondary/80 text-muted-foreground'}
                                            `}>
                                                    {result.type === 'action' && <Zap className="w-6 h-6" />}
                                                    {result.type === 'answer' && <Network className="w-6 h-6" />}
                                                    {result.type === 'habit' && <Flame className="w-6 h-6" />}
                                                    {result.type === 'navigation' && <ArrowRight className="w-6 h-6" />}
                                                    {result.type === 'note' && <StickyNote className="w-6 h-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-base font-bold text-foreground tracking-tight">{result.title}</h3>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{result.type}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">{result.description}</p>

                                                    {result.type === 'action' && (
                                                        <div className="flex items-center gap-2 pt-2 animate-in slide-in-from-left-2 duration-500">
                                                            <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Execute Intent</span>
                                                            <span className="text-[11px] font-serif italic text-primary">"{result.meta.value}"</span>
                                                        </div>
                                                    )}

                                                    {result.type === 'answer' && (
                                                        <div className="mt-4 p-4 bg-primary/[0.04] border-l-4 border-primary rounded-r-3xl animate-in fade-in duration-700">
                                                            <p className="text-xs italic text-foreground tracking-wide leading-relaxed font-serif">
                                                                "{result.meta.summary}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {index === selectedIndex && (
                                                    <div className="self-center">
                                                        <ArrowRight className="w-5 h-5 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-20 text-center">
                                        <div className="text-primary/40 text-4xl mb-4 font-serif italic">?</div>
                                        <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">No Kernel Match Found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Controls */}
                        <div className="p-6 bg-secondary/30 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40">
                                    <kbd className="bg-background border border-border rounded-lg px-2 py-1">↑↓</kbd> SELECT
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40">
                                    <kbd className="bg-background border border-border rounded-lg px-2 py-1">↵</kbd> EXECUTE
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40">
                                    <kbd className="bg-background border border-border rounded-lg px-2 py-1">ESC</kbd> CLOSE
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{isExecuting ? 'WRITING...' : 'READY'}</span>
                                <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-primary animate-ping' : 'bg-primary'}`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
