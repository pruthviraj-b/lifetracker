import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service'; // Added
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import { useTheme } from '../context/ThemeContext';

export default function SignupPage() {
    const { register } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation Rules
        if (formData.name.trim().length < 2) {
            setError('Please enter a valid name (at least 2 characters).');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // Block extremely short domains or obvious fakes (simple heuristic)
        if (formData.email.split('@')[0].length < 3) {
            setError('Email username is too short.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters for your security.');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join the journey of mindful growth."
        >
            <div className="space-y-6 transition-all duration-300">
                <Button
                    type="button"
                    variant="outline"
                    className="claude-button w-full border-border hover:bg-secondary text-foreground flex items-center justify-center gap-3 h-12"
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await AuthService.loginWithGoogle();
                        } catch (err: any) {
                            setError(err.message);
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-4 text-muted-foreground font-medium">or email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground ml-1">Your Name</label>
                            <Input
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={loading}
                                className="claude-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground ml-1">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={loading}
                                className="claude-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground ml-1">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                disabled={loading}
                                className="claude-input w-full"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 text-xs font-semibold text-destructive bg-destructive/5 border border-destructive/10 rounded-xl animate-claude-in">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="claude-button w-full h-12 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                        isLoading={loading}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-muted-foreground pt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline underline-offset-4 font-semibold">
                        Sign in instead
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
