import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HabitService } from '../../services/habit.service';

export const ServiceWorkerHandler = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleSWMessage = async (event: MessageEvent) => {
            if (event.data && event.data.type === 'NOTIF_ACTION') {
                const { action, habitId, reminderId } = event.data;

                if (action === 'complete' && habitId) {
                    if (!user) {
                        console.warn('Cannot complete habit via notification: User not logged in');
                        return;
                    }
                    try {
                        const today = new Date().toISOString().split('T')[0];
                        await HabitService.toggleHabitCompletion(habitId, today, true, user.id);
                        window.dispatchEvent(new CustomEvent('habit-completed-external', { detail: { habitId } }));
                        console.log('✅ Habit completed via notification action');
                    } catch (err) {
                        console.error('Failed to complete habit from notification:', err);
                    }
                } else if (action === 'snooze' && reminderId) {
                    // We need access to snoozeReminder here, or we can use a custom event
                    window.dispatchEvent(new CustomEvent('reminder-snooze-external', {
                        detail: { reminderId, minutes: 15 }
                    }));
                }
            }
        };

        navigator.serviceWorker.addEventListener('message', handleSWMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }, [user]);

    return null;
};
