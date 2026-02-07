import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[440px] space-y-8 relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col space-y-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
                        {title}
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60 max-w-xs mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* Main Card */}
                <div className={`
                    bg-card p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden group
                    border border-border/60
                    ${isWild ? 'shadow-[0_0_40px_rgba(0,0,0,0.2)]' : ''}
                `}>
                    {/* Scanline / Grid effect overlay */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="text-center opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        LifeTracker OS v2.0
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
