import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';
import { supabase } from '../lib/supabase';

const mapSupabaseUser = (sbUser: any): User => ({
    id: sbUser.id,
    name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email || '',
});

export const AuthService = {
    async login({ email, password }: LoginCredentials): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Supabase Login Error:", error);
            // Help user identify email confirmation issue
            if (error.message.includes("Email not confirmed")) {
                throw new Error("Please confirm your email address before logging in. Check your inbox.");
            }
            if (error.message === "Invalid login credentials") {
                throw new Error("Invalid email or password. (Note: You may need to confirm your email)");
            }
            throw new Error(error.message);
        }

        if (!data.user || !data.session) {
            throw new Error('Login failed: No user data returned');
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
            },
        });

        if (error) {
            throw new Error(error.message);
        }

        if (!data.user) {
            // Note: If email confirmation is enabled, we might not get a session immediately.
            // For now, we assume implicit login or handle it gracefully.
            throw new Error('Registration successful! Please check your email to confirm your account.');
        }

        // If auto-login happens after signup (Supabase default usually), session exists.
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
                scopes: 'https://www.googleapis.com/auth/calendar',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
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
                redirectTo: window.location.origin + '/home',
                scopes: 'https://www.googleapis.com/auth/calendar', // Ensure scope is requested here too
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
    }
};
