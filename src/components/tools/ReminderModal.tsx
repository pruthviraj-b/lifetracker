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
    const [time, setTime] = useState(initialData?.time || '09:00');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        {initialData ? 'Edit Reminder' : 'New Reminder'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Drink Water"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Time</label>
                        <Input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            required
                        />
                    </div>

                    {/* Type Selection */}
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setIsRecurring(false)}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${!isRecurring ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            One-time
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRecurring(true)}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${isRecurring ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Recurring
                        </button>
                    </div>

                    {!isRecurring ? (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required={!isRecurring}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Repeat Days
                            </label>
                            <div className="flex justify-between gap-1">
                                {DAYS_OF_WEEK.map(day => {
                                    const isSelected = days.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(day.id)}
                                            className={`
                                                w-10 h-10 rounded-full text-sm font-medium transition-all
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                }
                                            `}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                {days.length === 0 ? 'Select days to repeat' : days.length === 7 ? 'Every day' : 'Selected days'}
                            </p>
                        </div>
                    )}

                    {/* Extended Options */}
                    <div className="space-y-4 pt-2 border-t border-border">
                        {/* Habit Link */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Link to Habit (Optional)</label>
                            <select
                                value={habitId}
                                onChange={e => setHabitId(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">None</option>
                                {habits.map(habit => (
                                    <option key={habit.id} value={habit.id}>
                                        {habit.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Message & Note Prompt */}
                        {habitId && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Custom Message</label>
                                    <Input
                                        value={customMessage}
                                        onChange={e => setCustomMessage(e.target.value)}
                                        placeholder="e.g. Time to crush it! 💪"
                                    />
                                </div>

                                <label className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={promptForNote}
                                        onChange={e => setPromptForNote(e.target.checked)}
                                        className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Prompt for Reflection?</span>
                                        <span className="text-xs text-muted-foreground">Clicking the notification will open the Note entry for this habit.</span>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Notification Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Notification Type</label>
                            <div className="flex gap-2">
                                {(['in-app', 'push', 'email'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNotificationType(type)}
                                        className={`
                                            flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize
                                            ${notificationType === type
                                                ? 'bg-primary/20 text-primary border border-primary/50'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }
                                        `}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Google Calendar Sync */}
                        <div className="pt-2 border-t border-border">
                            <label className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group">
                                <div className="p-2 bg-red-100 rounded-full text-red-600 group-hover:bg-red-200 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-medium">Sync to Google Calendar</span>
                                    <span className="text-xs text-muted-foreground">Add this reminder to your Google Calendar</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={syncToGoogle}
                                    onChange={e => setSyncToGoogle(e.target.checked)}
                                    className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
