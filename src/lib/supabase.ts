import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'implicit' // Swithing to Implicit flow to bypass PKCE hang
    },
    db: {
        schema: 'public'
    },
    // Adding debug mode to help trace client issues
    global: {
        headers: { 'x-client-info': 'habit-tracker-v1' }
    }
});

// Debug hook
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Supabase Auth Event: ${event}`, session?.user?.id ? `User: ${session.user.id}` : 'No User');
});
