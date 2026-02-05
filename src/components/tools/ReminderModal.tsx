import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Reminder, DAYS_OF_WEEK } from '../../types/reminder';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reminder: Omit<Reminder, 'id' | 'isEnabled' | 'lastTriggered'> & { syncToGoogle?: boolean }) => void;
    initialData?: Reminder;
    habits: { id: string; title: string }[];
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSave, initialData, habits }) => {
    if (!isOpen) return null;

    const [title, setTitle] = useState(initialData?.title || '');
    const [time, setTime] = useState(initialData?.time || '09:00:00');
    const [isRecurring, setIsRecurring] = useState(initialData?.days && initialData.days.length > 0 ? true : false);
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [days, setDays] = useState<number[]>(initialData?.days || []);
    const [habitId, setHabitId] = useState<string>(initialData?.habitId || '');
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
            customMessage: habitId ? customMessage : undefined,
            promptForNote: habitId ? promptForNote : false,
            notificationType,
            syncToGoogle
        });
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">Link Protocol</label>
                            <select
                                value={habitId}
                                onChange={e => setHabitId(e.target.value)}
                                className="w-full h-8 px-2 rounded-none border border-white/10 bg-black/40 text-[9px] uppercase font-black tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Standalone</option>
                                {habits.map(habit => (
                                    <option key={habit.id} value={habit.id}>
                                        {habit.title}
                                    </option>
                                ))}
                            </select>
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
    );

    return createPortal(modalContent, document.body);
};
