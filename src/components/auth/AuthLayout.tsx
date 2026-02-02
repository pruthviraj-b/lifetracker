import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    return (
        <div className={`flex min-h-screen flex-col items-center justify-center p-4 relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="w-full max-w-[400px] space-y-6 relative z-10">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className={`text-2xl font-semibold tracking-tight text-white ${isWild ? 'animate-glitch uppercase tracking-tighter font-black' : ''}`}>
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                {/* Card-like container */}
                <div className={`border p-6 shadow-sm text-card-foreground ${isWild ? 'bg-black border-primary rounded-none shadow-primary/20' : 'bg-card border-border rounded-xl'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
