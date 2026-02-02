import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Moon, Zap, Save } from 'lucide-react';
import { UserPreferences, UserPreferencesService, defaultPreferences } from '../../services/userPreferences.service';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export function NotificationSettingsSection() {
    const { showToast } = useToast();
    const [prefs, setPrefs] = useState<UserPreferences>(defaultPreferences);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const data = await UserPreferencesService.getPreferences();
            setPrefs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updatePref = async (key: keyof UserPreferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));

        try {
            await UserPreferencesService.updatePreferences({ [key]: value });
        } catch (error) {
            console.error(error);
            showToast("Failed to save setting", "error");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-xl font-semibold mb-1">Notification Settings</h2>
                <p className="text-sm text-muted-foreground">Manage how and when you want to be notified.</p>
            </div>

            <div className="space-y-6">
                {/* Push Toggle */}
                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive daily reminders and updates.</p>
                        </div>
                    </div>
                    <div
                        onClick={() => updatePref('notify_push', !prefs.notify_push)}
                        className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${prefs.notify_push ? 'bg-primary' : 'bg-gray-700'}`}
                    >
                        <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.notify_push ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </div>
                </div>

                {/* Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">Email Digest</p>
                            <p className="text-sm text-muted-foreground">Weekly summary of your progress.</p>
                        </div>
                    </div>
                    <div
                        onClick={() => updatePref('notify_email', !prefs.notify_email)}
                        className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${prefs.notify_email ? 'bg-primary' : 'bg-gray-700'}`}
                    >
                        <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.notify_email ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </div>
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">SMS Reminders</p>
                            <p className="text-sm text-muted-foreground">Get text alerts for high priority habits.</p>
                        </div>
                    </div>
                    <div
                        onClick={() => updatePref('notify_sms', !prefs.notify_sms)}
                        className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${prefs.notify_sms ? 'bg-primary' : 'bg-gray-700'}`}
                    >
                        <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs.notify_sms ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </div>
                </div>
            </div>

            <section className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Quiet Hours
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Time</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-lg bg-background"
                            value={prefs.quiet_hours_start || "22:00"}
                            onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Time</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-lg bg-background"
                            value={prefs.quiet_hours_end || "07:00"}
                            onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
