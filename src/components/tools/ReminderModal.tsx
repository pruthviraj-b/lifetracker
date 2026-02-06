import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar, Youtube, GraduationCap, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Reminder, DAYS_OF_WEEK } from '../../types/reminder';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reminder: Omit<Reminder, 'id' | 'isEnabled' | 'lastTriggered'> & { syncToGoogle?: boolean }) => void;
    initialData?: Reminder;
    habits: { id: string; title: string }[];
    videos?: { id: string; title: string }[];
    courses?: { id: string; title: string }[];
    resources?: { id: string; title: string }[];
    folders?: { id: string; title: string }[];
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
    isOpen, onClose, onSave, initialData, habits,
    videos = [], courses = [], resources = [], folders = []
}) => {
    if (!isOpen) return null;

    const [title, setTitle] = useState(initialData?.title || '');
    const [time, setTime] = useState(initialData?.time || '09:00:00');
    const [isRecurring, setIsRecurring] = useState(initialData?.days && initialData.days.length > 0 ? true : false);
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [days, setDays] = useState<number[]>(initialData?.days || []);

    // Links
    const [habitId, setHabitId] = useState<string>(initialData?.habitId || '');
    const [videoId, setVideoId] = useState<string>(initialData?.videoId || '');
    const [courseId, setCourseId] = useState<string>(initialData?.courseId || '');
    const [resourceId, setResourceId] = useState<string>(initialData?.resourceId || '');
    const [folderId, setFolderId] = useState<string>(initialData?.folderId || '');

    const [customMessage, setCustomMessage] = useState<string>(initialData?.customMessage || '');
    const [promptForNote, setPromptForNote] = useState<boolean>(initialData?.promptForNote || false);
    const [notificationType, setNotificationType] = useState<'in-app' | 'email' | 'push'>(initialData?.notificationType || 'in-app');

    // New State for Google Sync
    const [syncToGoogle, setSyncToGoogle] = useState(false);

    const toggleDay = (dayId: number) => {
        setDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            time,
            days: isRecurring ? days : [],
            date: isRecurring ? undefined : date,
            habitId: habitId || undefined,
            videoId: videoId || undefined,
            courseId: courseId || undefined,
            resourceId: resourceId || undefined,
            folderId: folderId || undefined,
            customMessage: (habitId || videoId || courseId || resourceId || folderId) ? customMessage : undefined,
            promptForNote: habitId ? promptForNote : false,
            notificationType,
            syncToGoogle
        });
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 bg-black/80 backdrop-blur-md">
            <div className="min-h-screen flex items-start justify-center py-12">
                <div
                    className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                        <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {initialData ? 'Update Node' : 'Initialize Node'}
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSave} className="p-3 space-y-3">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Protocol ID</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ritual identifier..."
                                required
                                autoFocus
                                className="bg-black/40 h-8 text-[11px] rounded-none border-white/10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Temporal Mark</label>
                                <Input
                                    type="time"
                                    step="1"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    required
                                    className="bg-black/40 h-8 text-[11px] rounded-none border-white/10"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Type</label>
                                <div className="flex bg-white/5 p-0.5 rounded-none border border-white/10 h-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(false)}
                                        className={`flex-1 text-[9px] uppercase font-black tracking-tighter transition-all ${!isRecurring ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        Once
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(true)}
                                        className={`flex-1 text-[9px] uppercase font-black tracking-tighter transition-all ${isRecurring ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                    >
                                        Cycle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {!isRecurring ? (
                            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Specific Date</label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required={!isRecurring}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="bg-black/40 h-8 text-[11px] rounded-none border-white/10"
                                />
                            </div>
                        ) : (
                            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Protocol Cycles</label>
                                <div className="flex justify-between gap-1">
                                    {DAYS_OF_WEEK.map(day => {
                                        const isSelected = days.includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => toggleDay(day.id)}
                                                className={`
                                                w-7 h-7 rounded-sm text-[9px] font-black uppercase transition-all border
                                                ${isSelected
                                                        ? 'bg-primary text-black border-primary'
                                                        : 'bg-black/40 text-muted-foreground border-white/10 hover:border-primary/50'
                                                    }
                                            `}
                                            >
                                                {day.label.charAt(0)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                        <Youtube className="w-3 h-3" /> Content Link
                                    </label>
                                    <select
                                        value={habitId || videoId || courseId || resourceId || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setHabitId(''); setVideoId(''); setCourseId(''); setResourceId(''); setFolderId('');
                                            if (!val) return;
                                            const [type, id] = val.split(':');
                                            if (type === 'habit') setHabitId(id);
                                            else if (type === 'video') setVideoId(id);
                                            else if (type === 'course') setCourseId(id);
                                            else if (type === 'resource') setResourceId(id);
                                            else if (type === 'folder') setFolderId(id);
                                        }}
                                        className="w-full h-8 px-2 rounded-none border border-white/10 bg-black/40 text-[9px] uppercase font-black tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Standalone</option>
                                        <optgroup label="Habits">
                                            {habits.map(h => <option key={h.id} value={`habit:${h.id}`}>{h.title}</option>)}
                                        </optgroup>
                                        <optgroup label="Videos">
                                            {videos.map(v => <option key={v.id} value={`video:${v.id}`}>{v.title}</option>)}
                                        </optgroup>
                                        <optgroup label="Courses">
                                            {courses.map(c => <option key={c.id} value={`course:${c.id}`}>{c.title}</option>)}
                                        </optgroup>
                                        <optgroup label="Resources">
                                            {resources.map(r => <option key={r.id} value={`resource:${r.id}`}>{r.title}</option>)}
                                        </optgroup>
                                        <optgroup label="Folders">
                                            {folders.map(f => <option key={f.id} value={`folder:${f.id}`}>{f.title}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Mode</span>
                                <div className="flex gap-1">
                                    {(['push', 'in-app'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNotificationType(type)}
                                            className={`
                                            px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border transition-all
                                            ${notificationType === type
                                                    ? 'bg-primary/20 text-primary border-primary/50'
                                                    : 'bg-black/40 text-muted-foreground border-white/10 hover:border-white/20'
                                                }
                                        `}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button type="button" variant="ghost" className="flex-1 h-8 text-[9px] uppercase font-black rounded-none" onClick={onClose}>
                                Abort
                            </Button>
                            <Button type="submit" className="flex-1 h-8 text-[9px] uppercase font-black rounded-none">
                                Confirm
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
