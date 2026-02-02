import { supabase } from '../lib/supabase';

export const GoogleCalendarService = {
    async createEvent(event: {
        summary: string;
        description?: string;
        startTime: string; // ISO string
        endTime: string;   // ISO string
        reminders?: { useDefault: boolean; overrides?: { method: 'email' | 'popup', minutes: number }[] };
    }) {
        const { data: { session } } = await supabase.auth.getSession();

        // Note: provider_token is often only available on the initial callback unless configured otherwise.
        // We attempt to get it from the session. 
        const providerToken = session?.provider_token;

        if (!providerToken) {
            console.error('Google Calendar Sync: Missing provider token.');
            throw new Error('MISSING_TOKEN');
        }

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: event.summary,
                    description: event.description,
                    start: { dateTime: event.startTime },
                    end: { dateTime: event.endTime },
                    reminders: event.reminders || {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 10 }, // Default to email as requested
                            { method: 'popup', minutes: 10 }
                        ]
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Google Calendar API Error: ${errorData.error?.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create Google Calendar event:', error);
            throw error;
        }
    }
};
