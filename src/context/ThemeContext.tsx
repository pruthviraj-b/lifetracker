import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences, UserPreferencesService, defaultPreferences } from '../services/userPreferences.service';
import { useAuth } from './AuthContext';

interface ThemeContextType {
    preferences: UserPreferences;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    resolvedTheme: 'light' | 'dark'; // Final theme after auto/schedule logic
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        if (user) {
            loadPrefs();
        } else {
            setPreferences(defaultPreferences);
        }
    }, [user]);

    const loadPrefs = async () => {
        try {
            const data = await UserPreferencesService.getPreferences();
            setPreferences(data);
        } catch (error) {
            console.error('Failed to load theme preferences:', error);
        }
    };

    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        setPreferences(prev => ({ ...prev, ...updates }));
        if (user) {
            try {
                await UserPreferencesService.updatePreferences(updates);
            } catch (error) {
                console.error('Failed to save preferences:', error);
            }
        }
    };

    // Theme Resolution Logic (Auto/Schedule)
    useEffect(() => {
        const resolve = () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            if (preferences.theme === 'auto') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                return isDark ? 'dark' : 'light';
            }

            if (preferences.theme_schedule_enabled) {
                const { theme_schedule_start: start, theme_schedule_end: end } = preferences;
                if (start && end) {
                    if (end < start) {
                        if (currentTimeStr >= start || currentTimeStr < end) return 'dark';
                        return 'light';
                    } else {
                        if (currentTimeStr >= start && currentTimeStr < end) return 'dark';
                        return 'light';
                    }
                }
            }

            return preferences.theme === 'light' ? 'light' : 'dark';
        };

        const updateTheme = () => {
            const theme = resolve();
            setResolvedTheme(theme);
        };

        updateTheme();

        // Update every minute to catch schedule changes
        const interval = setInterval(updateTheme, 60000);
        return () => clearInterval(interval);

    }, [preferences]);

    // Apply Styles to Document
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'high-contrast', 'wild');
        root.classList.add(resolvedTheme);
        if (preferences.high_contrast) root.classList.add('high-contrast');
        if (preferences.wild_mode) root.classList.add('wild');

        root.setAttribute('data-theme', resolvedTheme);
        root.setAttribute('data-font-size', preferences.font_size);

        // Apply dynamic primary color (Wild Mode uses fixed Red)
        const accent = preferences.wild_mode ? '0 100% 50%' : preferences.accent_color;
        const [h, s, l] = accent.split(' ');
        root.style.setProperty('--primary-h', h);
        root.style.setProperty('--primary-s', s);
        root.style.setProperty('--primary-l', l);

        let filter = '';
        if (preferences.brightness < 100) filter += `brightness(${preferences.brightness}%) `;
        if (preferences.eye_strain_mode) filter += `sepia(0.2) saturate(0.8) hue-rotate(-15deg) `;
        root.style.filter = filter.trim();
    }, [resolvedTheme, preferences]);

    return (
        <ThemeContext.Provider value={{ preferences, updatePreferences, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
