import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth'; // Ensure types are correct
import { AuthService } from '../services/auth.service';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: { name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize session and listen for auth changes
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                // 1. Get initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    if (session?.user) {
                        setUser({
                            id: session.user.id,
                            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            email: session.user.email || '',
                        });
                    }
                    // CRITICAL: Always finish loading after initial check
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Auth Init Error:", error);
                if (mounted) setIsLoading(false);
            }
        };

        initSession();

        // 2. Set up listener for updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setUser({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email || '',
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (credentials: LoginCredentials) => {
        // Wrap login in a timeout/race to prevent UI hang
        const loginPromise = AuthService.login(credentials);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Login timed out. Please check your connection.")), 15000)
        );

        const { user, token } = await Promise.race([loginPromise, timeoutPromise]);

        AuthService.setSession(token, user);
        setUser(user);

        // Give Supabase time to persist the session
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    const register = async (credentials: RegisterCredentials) => {
        try {
            const { user, token } = await AuthService.register(credentials);
            AuthService.setSession(token, user);
            setUser(user);

            // Give Supabase time to persist the session
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error("AuthContext Registration Error:", error);
            throw error;
        }
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
    };

    const updateProfile = async (updates: { name?: string }) => {
        const updatedUser = await AuthService.updateProfile(updates);
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
