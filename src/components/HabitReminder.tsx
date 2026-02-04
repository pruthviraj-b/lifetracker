
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Bell, BellOff, Check } from 'lucide-react';

interface HabitReminderProps {
    habit: {
        id: string;
        name: string;
    };
}

export const HabitReminder: React.FC<HabitReminderProps> = ({ habit }) => {
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
            // Removed alert for better UX, maybe use toast
        }
    };

    const handleCancelReminder = () => {
        cancelReminder(habit.name);
        setIsScheduled(false);
    };

    if (!permissionGranted) {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-500 flex items-center gap-2">
                <BellOff className="w-4 h-4" />
                <p>Enable notifications to set reminders.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-secondary/10 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">{habit.name}</h3>
                {isScheduled && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>}
            </div>

            <div className="flex items-center gap-2">
                <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    disabled={isScheduled}
                    className="w-32 bg-black border-white/10"
                />

                {!isScheduled ? (
                    <Button onClick={handleScheduleReminder} variant="outline" size="sm" className="gap-2">
                        <Bell className="w-4 h-4" /> Set
                    </Button>
                ) : (
                    <Button onClick={handleCancelReminder} variant="destructive" size="sm" className="gap-2">
                        <BellOff className="w-4 h-4" /> Cancel
                    </Button>
                )}
            </div>

            <p className="text-[10px] text-muted-foreground">
                ℹ️ Reminders work even if app is closed.
            </p>
        </div>
    );
};
