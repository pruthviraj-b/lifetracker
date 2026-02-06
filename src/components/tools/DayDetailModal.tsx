import React from 'react';
import { Habit, DayLog, DayOfWeek } from '@/types/habit'; // Fixed import path
import { X, Check, Activity, Smile } from 'lucide-react';
import { Button } from '../ui/Button'; // Fixed import path

interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string; // YYYY-MM-DD
    habits: Habit[];
    log?: DayLog; // Log for this specific day (if any)
}

export function DayDetailModal({ isOpen, onClose, date, habits, log }: DayDetailModalProps) {
    if (!isOpen) return null;

    // Parse Date for Display
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayOfWeek = dateObj.getDay() as DayOfWeek;

    // Filter Habits that SHOULD check this day
    const activeHabits = habits.filter(h =>
        h.type === 'habit' &&
        h.frequency.includes(dayOfWeek) &&
        // Ensure habit existed on this date (simple check: created_at logic omitted for MVP, assuming all current habits apply)
        true
    );

    const completedIds = new Set(log?.completedHabitIds || []);

    const completedList = activeHabits.filter(h => completedIds.has(h.id));
    const missedList = activeHabits.filter(h => !completedIds.has(h.id));

    const completionRate = activeHabits.length > 0
        ? Math.round((completedList.length / activeHabits.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto p-4">
            <div className="min-h-screen flex items-start justify-center py-12">
                <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{dayName}</h2>
                            <p className="text-sm text-muted-foreground uppercase tracking-wide">{fullDate}</p>
                        </div>

                        {/* Stats Card */}
                        <div className={`p-4 rounded-xl border flex items-center justify-between
                        ${completionRate === 100 ? 'bg-green-950/30 border-green-900 text-green-400' :
                                completionRate >= 50 ? 'bg-yellow-950/30 border-yellow-900 text-yellow-400' :
                                    'bg-red-950/30 border-red-900 text-red-400'}
                    `}>
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5" />
                                <span className="font-semibold">Performance</span>
                            </div>
                            <span className="text-2xl font-bold">{completionRate}%</span>
                        </div>

                        {/* Check-ins */}
                        <div className="space-y-4">
                            {/* Completed Section */}
                            {completedList.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest pl-1">Completed</h3>
                                    <div className="space-y-1">
                                        {completedList.map(h => (
                                            <div key={h.id} className="flex items-center gap-3 p-2 bg-green-950/10 rounded-lg">
                                                <div className="w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <span className="text-sm font-medium">{h.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missed Section */}
                            {missedList.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Missed</h3>
                                    <div className="space-y-1 opacity-60">
                                        {missedList.map(h => (
                                            <div key={h.id} className="flex items-center gap-3 p-2 border border-dashed border-muted-foreground/30 rounded-lg">
                                                <div className="w-5 h-5 rounded-full border border-muted-foreground flex items-center justify-center">
                                                    <X className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                                <span className="text-sm text-muted-foreground">{h.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeHabits.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No habits scheduled for this day.
                                </div>
                            )}
                        </div>

                        {/* Mood Reflection (If exists) */}
                        {log?.mood && (
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Smile className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium capitalize text-foreground">{log.mood} Day</p>
                                        {log.journalEntry && (
                                            <p className="text-xs text-muted-foreground mt-1 italic">"{log.journalEntry}"</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
