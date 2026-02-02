import React, { useEffect, useState } from 'react';
import { Settings, Clock, CheckSquare, Archive } from 'lucide-react';
import { UserPreferences, UserPreferencesService, defaultPreferences } from '../../services/userPreferences.service';
import { useToast } from '../../context/ToastContext';

export function HabitSettingsSection() {
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
                <h2 className="text-xl font-semibold mb-1">Habit Preferences</h2>
                <p className="text-sm text-muted-foreground">Configure global defaults for your habits.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Default Category</label>
                    <select
                        value={prefs.default_category}
                        onChange={(e) => updatePref('default_category', e.target.value)}
                        className="w-full p-2 border rounded-lg bg-background"
                    >
                        <option>General</option>
                        <option>Health</option>
                        <option>Productivity</option>
                        <option>Learning</option>
                        <option>Finance</option>
                        <option>Mindfulness</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Default Reminder Time</label>
                    <input
                        type="time"
                        className="w-full p-2 border rounded-lg bg-background"
                        value={prefs.default_reminder_time}
                        onChange={(e) => updatePref('default_reminder_time', e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                        <Archive className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Auto-archive Old Habits</p>
                            <p className="text-xs text-muted-foreground">Archive habits inactive for 30+ days.</p>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary"
                        checked={prefs.auto_archive}
                        onChange={(e) => updatePref('auto_archive', e.target.checked)}
                    />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Show Completed Habits</p>
                            <p className="text-xs text-muted-foreground">Keep completed habits visible in the list.</p>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary"
                        checked={prefs.show_completed}
                        onChange={(e) => updatePref('show_completed', e.target.checked)}
                    />
                </div>

                {/* Note: 'Extend Undo Window' is not yet in the DB schema, so leaving it as visual-only or implicit for now, 
                     or removing if not supported */}
            </div>
        </div>
    );
}
