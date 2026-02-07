import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { preferences } = useTheme();

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
            setError('IDENTITY NAME INVALID (>2 CHARS)');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            setError('COMMUNICATION ID INVALID (EMAIL)');
            return;
        }

        if (formData.password.length < 8) {
            setError('SECURITY KEY TOO WEAK (>8 CHARS)');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
            // On success, we might redirect or show a "Confirm Email" message
            // Depending on Supabase settings. Usually, AuthContext sets user and we go to dashboard.
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'IDENTITY CREATION FAILED');
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Designation Required"
            subtitle="Initialize your neural profile."
        >
            <div className="space-y-6">
                {/* Google Sign Up Button */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-primary/20 hover:bg-primary/5 text-foreground flex items-center justify-center gap-3 font-bold uppercase tracking-wider transition-all duration-300"
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
                    Initialize with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
                        <span className="bg-card px-4 text-muted-foreground">Or Manual Registration</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Codename</label>
                            <Input
                                placeholder="OPERATOR NAME"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={loading}
                                className="h-12 border-2 border-border/50 focus:border-primary font-mono bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Identity (Email)</label>
                            <Input
                                type="email"
                                placeholder="ACCESS ID (EMAIL)"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={loading}
                                className="h-12 border-2 border-border/50 focus:border-primary font-mono bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Encryption Key</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={8}
                                disabled={loading}
                                className="h-12 border-2 border-border/50 focus:border-primary font-mono bg-background/50"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl uppercase tracking-wider"
                        >
                            ⚠ {error}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-14 bg-primary text-primary-foreground text-lg font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all duration-300"
                        isLoading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Generate Identity'}
                    </Button>
                </form>

                <div className="text-center text-xs font-medium text-muted-foreground pt-4">
                    PROFILE EXISTS?{' '}
                    <Link to="/login" className="text-primary hover:text-primary/80 underline underline-offset-4 font-bold uppercase tracking-wider ml-1">
                        ACCESS EXISTING MATRIX
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
