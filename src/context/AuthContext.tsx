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
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.warn("Auth check timed out - forcing UI render");
            setIsLoading(false);
        }, 3000);

        // Initial check
        AuthService.checkSession().then(currentUser => {
            // Only update if we haven't timed out (optional check, but setState is safe)
            setUser(currentUser);
            setIsLoading(false);
            clearTimeout(timeoutId);
        }).catch((err) => {
            console.error("Session check failed", err);
            setIsLoading(false);
            clearTimeout(timeoutId);
        });

        // Realtime listener for OAuth redirects and session updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const user = await AuthService.checkSession(); // Or map session.user directly
                setUser(user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
            clearTimeout(timeoutId);
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const { user, token } = await AuthService.login(credentials);
        AuthService.setSession(token, user);
        setUser(user);
    };

    const register = async (credentials: RegisterCredentials) => {
        try {
            const { user, token } = await AuthService.register(credentials);
            AuthService.setSession(token, user);
            setUser(user);
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
