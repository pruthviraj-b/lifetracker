import React, { useState } from 'react';
import { ReminderService } from '../services/reminder.service';
import { useNotifications } from '../context/NotificationContext';
import { NotificationManagerInstance } from '../utils/notificationManager';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Bell, Clock, AlertTriangle, Database } from 'lucide-react';

export const NotificationTestPanel: React.FC = () => {
    const { refreshReminders } = useNotifications();
    const [testTime, setTestTime] = useState('09:00');
    const [testMessage, setTestMessage] = useState('Test Habit');

    const testImmediateNotification = async () => {
        await NotificationManagerInstance.showNotification('Test Notification', {
            body: testMessage,
            icon: '/pwa-192x192.png',
            tag: 'test-notification'
        });
    };

    const testScheduledNotification = async () => {
        const [hours, minutes] = testTime.split(':');
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

        if (scheduledTime < new Date()) {
            scheduledTime.setSeconds(scheduledTime.getSeconds() + 5); // 5 seconds from now if passed
        }

        await NotificationManagerInstance.scheduleNotification(
            'Test Scheduled Habit',
            scheduledTime,
            { body: testMessage }
        );

        alert(`Notification scheduled for ${testTime}`);
    };

    const testTabClosedNotification = async () => {
        const testTime = new Date();
        testTime.setSeconds(testTime.getSeconds() + 5);

        await NotificationManagerInstance.scheduleNotification(
            'Tab Closed Test',
            testTime,
            { body: 'This notification works even with tab closed!' }
        );

        alert('Notification scheduled for 5 seconds from now. Close this tab immediately!');
    };

    const seedSampleReminders = async () => {
        const now = new Date();
        const inOneMin = new Date(now.getTime() + 60000);
        const inOneMinTime = `${inOneMin.getHours().toString().padStart(2, '0')}:${inOneMin.getMinutes().toString().padStart(2, '0')}`;

        const samples = [
            {
                title: "🧪 1-Min Test Alert",
                time: inOneMinTime,
                days: [0, 1, 2, 3, 4, 5, 6],
                isEnabled: true,
                notificationType: 'in-app' as const,
                customMessage: "This is your 1-minute test reminder. System is operational."
            },
            {
                title: "🧘 Morning Mindfulness",
                time: "08:00",
                days: [1, 2, 3, 4, 5],
                isEnabled: true,
                notificationType: 'push' as const,
                customMessage: "Center your consciousness before the daily cycle begins."
            },
            {
                title: "🌙 Evening Reflection",
                time: "22:00",
                days: [0, 1, 2, 3, 4, 5, 6],
                isEnabled: true,
                notificationType: 'in-app' as const,
                customMessage: "Log your final protocols and prepare for restoration."
            }
        ];

        try {
            for (const sample of samples) {
                await ReminderService.createReminder(sample);
            }
            await refreshReminders();
            alert("✅ Successfully added 3 sample notification nodes!");
        } catch (error) {
            console.error(error);
            alert("Failed to seed reminders. Check console.");
        }
    };

    return (
        <div className="border-2 border-dashed border-primary/20 bg-primary/5 p-6 rounded-xl space-y-6">
            <h3 className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">🧪 Notification Testing Panel</span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={seedSampleReminders}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                >
                    <Database className="w-3 h-3 mr-2" />
                    Seed Samples
                </Button>
            </h3>

            <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Test Message</label>
                <Input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter test message"
                    className="bg-black border-white/10"
                />
            </div>

            <div className="flex flex-wrap gap-4">
                <Button
                    onClick={testImmediateNotification}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Bell className="w-4 h-4 mr-2" />
                    Test Immediate
                </Button>

                <div className="flex items-center gap-2">
                    <Input
                        type="time"
                        value={testTime}
                        onChange={(e) => setTestTime(e.target.value)}
                        className="w-32 bg-black border-white/10"
                    />
                    <Button
                        onClick={testScheduledNotification}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule
                    </Button>
                </div>

                <Button
                    onClick={testTabClosedNotification}
                    className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto"
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Test Tab Closed (5s)
                </Button>
            </div>

            <p className="text-xs text-muted-foreground">
                ⚠️ Note: For "Tab Closed" test, click the button then close the tab/browser within 5 seconds.
            </p>
        </div>
    );
};
