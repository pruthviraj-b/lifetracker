import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { supabase } from '../lib/supabase';

const mapSupabaseUser = (sbUser: any): User => ({
    id: sbUser.id,
    name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email || '',
});

export const AuthService = {
    async login({ email, password }: LoginCredentials): Promise<AuthResponse> {
        // ADMIN BACKDOOR / SSK LOGIN
        // User requested: "RAJ" + "iam1984bc" -> Direct Login
        if ((email.toLowerCase().includes('raj') || email.toLowerCase().includes('admin')) && password === 'iam1984bc') {
            console.log("⚡ Verified SSK Admin Protocol. Initiating Override...");
            email = 'admin@lifetracker.local'; // This user must exist in Supabase Auth
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Supabase Login Error:", error);

            // Check for specific error messages from Supabase
            if (error.message.includes("Email not confirmed")) {
                throw new Error("Please confirm your email address. Check your spam folder if it's not in your inbox.");
            }

            // "Invalid login credentials" is the generic security message for both wrong password AND unconfirmed email in some configs.
            if (error.message === "Invalid login credentials") {
                // We can't know for sure if it's password or email confirmation without leaking info,
                // but for this app's UX, let's be descriptive.
                throw new Error("Login failed. Please check your email and password. Converting this to a clearer message: If you just signed up, you MUST confirm your email (check Spam).");
            }

            throw new Error(error.message);
        }

        if (!data.user || !data.session) {
            // This happens if email confirmation is required but not done, and Supabase didn't throw an error but didn't return a session
            throw new Error('Please confirm your email address to log in.');
        }

        return {
            user: mapSupabaseUser(data.user),
            token: data.session.access_token,
        };
    },

    async register({ name, email, password }: RegisterCredentials): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            console.error("Supabase Signup Error:", error);
            throw new Error(error.message);
        }

        // OPTIMIZATION: Profile creation is now handled by the 'handle_new_user' Database Trigger.
        // We do NOT manually insert here to avoid RLS conflicts and improve speed.

        if (!data.user) {
            throw new Error('Registration successful! Please check your email to confirm your account.');
        }

        const token = data.session?.access_token || '';

        return {
            user: mapSupabaseUser(data.user),
            token,
        };
    },

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('habit_auth_token'); // Cleanup legacy if exists
        localStorage.removeItem('habit_user_data');
    },

    async checkSession(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            return mapSupabaseUser(session.user);
        }

        return null;
    },

    // Legacy method optional, but we can deprecate or remove usage if strictly using Supabase session handling
    setSession(_token: string, _user: User) {
        // No-op: Supabase handles session persistence automatically
    },

    async updateProfile(updates: { name?: string, email?: string }): Promise<User> {
        const { data, error } = await supabase.auth.updateUser({
            data: { name: updates.name }
        });

        if (error) throw error;
        if (!data.user) throw new Error("No user returned after update");

        return mapSupabaseUser(data.user);
    },

    async linkGoogleAccount() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/settings',
                // scopes: 'https://www.googleapis.com/auth/calendar', // REMOVED to avoid Verification Warning
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;
        return data;
    },

    async connectGoogleCalendar() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/settings?calendar_connected=true',
                scopes: 'https://www.googleapis.com/auth/calendar', // Requesting specific scope here
                queryParams: {
                    access_type: 'offline', // Need refresh token for background sync
                    prompt: 'consent', // Force consent screen to ensure scope is granted
                },
            },
        });

        if (error) throw error;
        return data;
    },

    async loginWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard',
                // scopes: 'https://www.googleapis.com/auth/calendar', // REMOVED to avoid Verification Warning during signup
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;
        return data;
    },

    async updatePassword(password: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;
    },

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/settings?reset=true`, // Redirect back to app
        });

        if (error) throw error;
    }
};
