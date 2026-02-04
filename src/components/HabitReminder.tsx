
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Bell, BellOff, Check } from 'lucide-react';
import { NotificationManagerInstance } from '../utils/notificationManager';

interface HabitReminderProps {
    habit: {
        id: string;
        name: string;
    };
    onClose?: () => void;
}

export const HabitReminder: React.FC<HabitReminderProps> = ({ habit, onClose }) => {
    const { scheduleReminder, cancelReminder, permissionGranted } = useNotifications();
    const [reminderTime, setReminderTime] = useState('09:00');
    const [isScheduled, setIsScheduled] = useState(false);

    const handleScheduleReminder = async () => {
        // Parse time input
        const [hours, minutes] = reminderTime.split(':');
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

        // If time has passed today, schedule for tomorrow
        if (scheduledDateTime < new Date()) {
            scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
        }

        const success = await scheduleReminder(habit.name, scheduledDateTime, {
            body: `Time to do: ${habit.name}`,
            icon: '/habit-icon.png',
            badge: '/badge.png',
            tag: habit.id
        });

        if (success) {
            setIsScheduled(true);
            if (onClose) setTimeout(onClose, 1500); // Auto close after success
        }
    };

    const handleCancelReminder = () => {
        cancelReminder(habit.name);
        setIsScheduled(false);
    };

    if (!permissionGranted) {
        return (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 text-sm text-yellow-500 font-bold uppercase tracking-widest">
                    <BellOff className="w-5 h-5" />
                    <p>Interface Blocked</p>
                </div>
                <p className="text-xs opacity-70">Notification protocols require browser authorization for temporal alerts.</p>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={async () => {
                            const granted = await NotificationManagerInstance.requestPermission();
                            if (!granted) {
                                alert('Handshake rejected. Verify browser settings and use HTTPS.');
                            }
                        }}
                        variant="outline"
                        className="w-full text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10 rounded-xl"
                    >
                        Authorize Handshake
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" className="w-full text-xs opacity-50 underline">
                            Go Back
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-[#0F0F0F] rounded-2xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black uppercase tracking-tighter text-lg">{habit.name}</h3>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Temporal Protocol Setup</p>
                    </div>
                    {isScheduled && (
                        <div className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Check className="w-3 h-3" /> Active
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Target Time</label>
                    <div className="flex items-center gap-3">
                        <Input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            disabled={isScheduled}
                            className="bg-black border-white/10 h-12 text-lg font-mono focus:border-red-500 transition-colors"
                        />
                        {!isScheduled ? (
                            <Button onClick={handleScheduleReminder} className="h-12 px-6 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest gap-2">
                                <Bell className="w-4 h-4" /> Sync
                            </Button>
                        ) : (
                            <Button onClick={handleCancelReminder} variant="destructive" className="h-12 px-6 font-black uppercase tracking-widest gap-2">
                                <BellOff className="w-4 h-4" /> Cut
                            </Button>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2 opacity-60">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                        Background sync active // works offline
                    </p>
                </div>
            </div>

            {onClose && (
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="w-full text-[10px] uppercase font-black tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
                >
                    [ DISMISS_OVERLAY ]
                </Button>
            )}
        </div>
    );
};
