import { supabase } from '../lib/supabase';

export interface UserPreferences {
    user_id?: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    date_format: string;
    time_format: '12-hour' | '24-hour';

    notify_push: boolean;
    notify_email: boolean;
    notify_sms: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;

    default_category: string;
    default_reminder_time: string;
    auto_archive: boolean;
    show_completed: boolean;

    // Theme Customization & Accessibility
    accent_color: string;
    high_contrast: boolean;
    eye_strain_mode: boolean;
    font_size: 'sm' | 'md' | 'lg' | 'xl';
    theme_schedule_enabled: boolean;
    theme_schedule_start: string;
    theme_schedule_end: string;
    brightness: number;
    wild_mode: boolean;
}

export const defaultPreferences: UserPreferences = {
    theme: 'dark',
    language: 'en-US',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    time_format: '12-hour',
    notify_push: true,
    notify_email: false,
    notify_sms: false,
    default_category: 'General',
    default_reminder_time: '09:00',
    auto_archive: false,
    show_completed: true,
    accent_color: '142 71% 45%',
    high_contrast: false,
    eye_strain_mode: false,
    font_size: 'md',
    theme_schedule_enabled: false,
    theme_schedule_start: '20:00',
    theme_schedule_end: '07:00',
    brightness: 100,
    wild_mode: true
};

export const UserPreferencesService = {
    async getPreferences(): Promise<UserPreferences> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // If no preferences found, return defaults (and maybe create them)
            if (error.code === 'PGRST116') {
                return defaultPreferences;
            }
            console.error('Error fetching preferences:', error);
            return defaultPreferences;
        }

        return { ...defaultPreferences, ...data } as UserPreferences;
    },

    async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('Not authenticated');

        // Check if row exists first, if not insert, else update
        const { data: existing } = await supabase
            .from('user_preferences')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        let error;
        let data;

        if (!existing) {
            // Insert
            const result = await supabase
                .from('user_preferences')
                .insert({
                    user_id: user.id,
                    ...defaultPreferences,
                    ...updates
                })
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Update
            const result = await supabase
                .from('user_preferences')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;
        return data as UserPreferences;
    }
};
