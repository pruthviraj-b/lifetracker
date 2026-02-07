import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Habit, HabitCategory, TimeOfDay, DayOfWeek, HabitLink, HabitLinkType } from '@/types/habit';
import { X, Link2, Lock, Sparkles, AlertTriangle, Zap } from 'lucide-react';
import { HabitService } from '@/services/habit.service';
import { useTheme } from '@/context/ThemeContext';

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (habit: Partial<Habit> & { reminderTime?: string }) => void;
    initialData?: Habit;
    mode?: 'create' | 'edit';
}

export function CreateHabitModal({ isOpen, onClose, onSave, initialData, mode = 'create' }: CreateHabitModalProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [title, setTitle] = useState(initialData?.title || '');
    const [category, setCategory] = useState<HabitCategory>(initialData?.category || 'health');
    const [time, setTime] = useState<TimeOfDay>(initialData?.timeOfDay || 'morning');
    const [days, setDays] = useState<DayOfWeek[]>(initialData?.frequency || [0, 1, 2, 3, 4, 5, 6]);
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialData?.priority || 'medium');
    const [reminderTime, setReminderTime] = useState('');

    // Goal Config
    const [type, setType] = useState<'habit' | 'goal'>(initialData?.type || 'habit');
    const [duration, setDuration] = useState(initialData?.goalDuration || 30);

    // Phase 10: Linking State
    const [activeTab, setActiveTab] = useState<'config' | 'links'>('config');
    const [allHabits, setAllHabits] = useState<Habit[]>([]);
    const [links, setLinks] = useState<Partial<HabitLink>[]>(initialData?.links || []);

    // Reset when opening fresh
    React.useEffect(() => {
        if (isOpen) {
            loadHabits();
        }
        if (isOpen && mode === 'create' && !initialData) {
            setTitle('');
            setCategory('health');
            setTime('morning');
            setDays([0, 1, 2, 3, 4, 5, 6]);
            setPriority('medium');
            setType('habit');
            setDuration(30);
            setLinks([]);
            setReminderTime('');
            setActiveTab('config');
        } else if (isOpen && initialData) {
            setTitle(initialData.title);
            setCategory(initialData.category);
            setTime(initialData.timeOfDay);
            setDays(initialData.frequency);
            setPriority(initialData.priority || 'medium');
            setType(initialData.type);
            setDuration(initialData.goalDuration || 30);
            setLinks(initialData.links || []);
        }
    }, [isOpen, initialData, mode]);

    const loadHabits = async () => {
        try {
            const data = await HabitService.getHabits();
            setAllHabits(data.filter(h => h.id !== initialData?.id));
        } catch (error) {
            console.error(error);
        }
    };

    const addLink = (targetId: string, type: HabitLinkType) => {
        if (!targetId) return;
        setLinks(prev => [...prev, { sourceHabitId: initialData?.id || 'temp', targetHabitId: targetId, type }]);
    };

    const removeLink = (index: number) => {
        setLinks(prev => prev.filter((_, i) => i !== index));
    };

    const toggleDay = (day: DayOfWeek) => {
        setDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        );
    };

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                title,
                category,
                timeOfDay: time,
                frequency: days,
                type,
                priority,
                goalDuration: type === 'goal' ? duration : undefined,
                goalProgress: type === 'goal' ? (mode === 'create' ? 0 : initialData?.goalProgress) : undefined,
                id: initialData?.id,
                links: links as HabitLink[],
                reminderTime: reminderTime || undefined
            });

            // Only close and reset on success
            setTitle('');
            setDays([0, 1, 2, 3, 4, 5, 6]);
            setType('habit');
            setDuration(30);
            setReminderTime('');
            onClose();
        } catch (error) {
            console.error('Modal Save Error:', error);
            // Don't close on error
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] overflow-y-auto p-4">
            <div className="min-h-screen flex items-start justify-center py-12">
                <div className={`w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200 border-2 max-h-[90vh] overflow-y-auto ${isWild ? 'bg-black border-primary rounded-none font-mono selection:bg-primary selection:text-black' : 'bg-card border-border rounded-2xl shadow-xl'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pr-6">
                            <div>
                                <h2 className={`text-xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>
                                    {mode === 'create' ? (isWild ? 'Initiate Sequence' : 'New Ritual') : (isWild ? 'Override Protocol' : 'Edit Ritual')}
                                </h2>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">
                                    {isWild ? 'Auth_Level: COMMAND' : 'Define your path to mastery.'}
                                </p>
                            </div>
                        </div>

                        <div className={`flex p-1 ${isWild ? 'bg-white/5 rounded-none border border-white/10' : 'bg-muted/50 rounded-xl'}`}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('config')}
                                className={`flex-1 py-1 text-[10px] font-bold transition-all ${isWild ? 'rounded-none uppercase' : 'rounded-lg'} ${activeTab === 'config' ? (isWild ? 'bg-primary text-black' : 'bg-background shadow text-primary') : 'text-muted-foreground'}`}
                            >
                                Configuration
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('links')}
                                className={`flex-1 py-1 text-[10px] font-bold transition-all ${isWild ? 'rounded-none uppercase' : 'rounded-lg'} ${activeTab === 'links' ? (isWild ? 'bg-primary text-black' : 'bg-background shadow text-primary') : 'text-muted-foreground'}`}
                            >
                                Connections
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {activeTab === 'config' ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className={`flex p-1 ${isWild ? 'bg-white/5 rounded-none border border-white/10' : 'bg-muted rounded-lg'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setType('habit')}
                                            className={`flex-1 py-2 text-sm font-bold transition-all ${isWild ? 'rounded-none uppercase' : 'rounded-md'} ${type === 'habit' ? (isWild ? 'bg-primary text-black' : 'bg-background shadow text-foreground') : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Forever Habit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('goal')}
                                            className={`flex-1 py-2 text-sm font-bold transition-all ${isWild ? 'rounded-none uppercase' : 'rounded-md'} ${type === 'goal' ? (isWild ? 'bg-primary text-black' : 'bg-background shadow text-foreground') : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Finite Goal
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Definition_String</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder={isWild ? "IDENTIFY_TARGET..." : (type === 'habit' ? "e.g., Read 10 pages" : "e.g., No Sugar for 30 Days")}
                                            className={`w-full p-3 border-2 focus:outline-none transition-all ${isWild ? 'bg-black border-primary/50 text-white rounded-none focus:border-primary' : 'bg-background border-input rounded-lg focus:ring-2 focus:ring-primary/20'}`}
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {type === 'goal' && (
                                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium">Duration</label>
                                                <span className="text-sm font-mono font-bold">{duration} Days</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="7"
                                                max="100"
                                                step="1"
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Category</label>
                                            <select
                                                className="w-full p-2 rounded-lg border border-input bg-background"
                                                value={category}
                                                onChange={e => setCategory(e.target.value as HabitCategory)}
                                            >
                                                <option value="health">Health</option>
                                                <option value="work">Work</option>
                                                <option value="learning">Learning</option>
                                                <option value="mindfulness">Mindfulness</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">When?</label>
                                            <select
                                                className="w-full p-2 rounded-lg border border-input bg-background"
                                                value={time}
                                                onChange={e => setTime(e.target.value as TimeOfDay)}
                                            >
                                                <option value="morning">Morning</option>
                                                <option value="afternoon">Afternoon</option>
                                                <option value="evening">Evening</option>
                                                <option value="anytime">Anytime</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Priority</label>
                                            <div className="flex gap-2">
                                                {['low', 'medium', 'high'].map(p => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setPriority(p as any)}
                                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md border capitalize transition-all ${priority === p ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center justify-between">
                                                Reminder (Optional)
                                                {reminderTime && <span className="text-[10px] text-primary cursor-pointer hover:underline" onClick={() => setReminderTime('')}>Clear</span>}
                                            </label>
                                            <input
                                                type="time"
                                                className={`w-full p-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 ${!reminderTime && 'text-muted-foreground'}`}
                                                value={reminderTime}
                                                onChange={(e) => setReminderTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Frequency</label>
                                        <div className="flex justify-between gap-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => toggleDay(i as DayOfWeek)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border transition-all ${days.includes(i as DayOfWeek) ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-input text-muted-foreground'}`}
                                                >
                                                    {dayChar}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                                            <Link2 className="w-4 h-4" /> Why Link Habits?
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Connecting habits creates a "Habit Chain". <b>Prerequisites</b> lock habits until others are done. <b>Chains</b> suggest the next habit immediately. <b>Synergies</b> provide XP bonuses.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                id="habitSelect"
                                                className="w-full p-2.5 rounded-xl border bg-background text-sm"
                                                onChange={(e) => {
                                                    const targetId = e.target.value;
                                                    const type = (document.getElementById('linkType') as HTMLSelectElement).value as HabitLinkType;
                                                    if (targetId) addLink(targetId, type);
                                                }}
                                            >
                                                <option value="">Link to habit...</option>
                                                {allHabits.map(h => (
                                                    <option key={h.id} value={h.id}>{h.title}</option>
                                                ))}
                                            </select>
                                            <select id="linkType" className="w-full p-2.5 rounded-xl border bg-background text-sm">
                                                <option value="prerequisite">Requires (Prerequisite)</option>
                                                <option value="chain">Triggers (Chain)</option>
                                                <option value="synergy">Synergizes with</option>
                                                <option value="conflict">Conflicts with</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                                            {links.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed rounded-2xl text-muted-foreground">
                                                    <Link2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    <p className="text-[11px]">No connections yet</p>
                                                </div>
                                            )}
                                            {links.map((link, idx) => {
                                                const target = allHabits.find(h => h.id === link.targetHabitId);
                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                                                        <div className="flex items-center gap-3">
                                                            {link.type === 'prerequisite' ? <Lock className="w-3.5 h-3.5 text-blue-500" /> :
                                                                link.type === 'chain' ? <Zap className="w-3.5 h-3.5 text-yellow-500" /> :
                                                                    link.type === 'synergy' ? <Sparkles className="w-3.5 h-3.5 text-green-500" /> :
                                                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                                            <div>
                                                                <p className="text-xs font-bold">{target?.title || 'Unknown Habit'}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{link.type}</p>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => removeLink(idx)} className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className={`w-full h-12 font-black uppercase tracking-tight italic transition-all ${isWild ? 'rounded-none border border-primary bg-primary text-black text-base' : 'rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01]'}`}
                                    disabled={!title}
                                >
                                    {isWild ? (mode === 'create' ? 'EXECUTE_INITIATION' : 'OVERWRITE_DATA') : (mode === 'create' ? (type === 'habit' ? 'Initiate Ritual' : 'Commit Goal') : 'Sync Changes')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
