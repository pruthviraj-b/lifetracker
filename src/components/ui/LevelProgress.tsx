import React from 'react';
import { cn } from '@/lib/utils';

interface LevelProgressProps {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    title: string;
    className?: string;
}

export function LevelProgress({
    level,
    currentXP,
    nextLevelXP,
    title,
    className
}: LevelProgressProps) {
    const percentage = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Current Rank</span>
                    <div className="text-xl font-bold text-primary animate-pulse shadow-primary text-shadow-glow">
                        LV.{level} <span className="text-white ml-2">{title}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-primary font-mono">
                        {currentXP} / {nextLevelXP} XP
                    </span>
                </div>
            </div>

            {/* XP Bar Container */}
            <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                {/* Glow behind */}
                <div
                    className="absolute top-0 left-0 h-full bg-primary/20 blur-md transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />

                {/* Actual Bar */}
                <div
                    className="h-full bg-gradient-to-r from-blue-500 via-primary to-purple-500 transition-all duration-500 relative"
                    style={{ width: `${percentage}%` }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </div>
            </div>
        </div>
    );
}
