import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ThemedCard } from '../ui/ThemedCard';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background overflow-hidden">
            <div className="w-full max-w-[440px] space-y-12 relative z-10 transition-all duration-500 animate-claude-in">
                <div className="flex flex-col space-y-4 text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    <p className="text-base text-muted-foreground max-w-xs mx-auto">
                        {subtitle}
                    </p>
                </div>

                <div className="bg-card border border-border p-10 space-y-8 rounded-[2rem] shadow-sm">
                    {children}
                </div>

                <div className="text-center opacity-30 italic">
                    <p className="text-xs font-medium text-muted-foreground">
                        Simple. Intuitive. Human.
                    </p>
                </div>
            </div>
        </div>
    );
}
