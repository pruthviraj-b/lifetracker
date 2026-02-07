import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DayLog } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

interface HeatmapProps {
    logs: Record<string, DayLog>; // Map of date -> log
    daysToShow?: number;
    /**
     * 'auto' = desktop shows current month, mobile shows 30 days
     * '30' = always 30 days
     * 'month' = show days in current month
     */
    daysMode?: 'auto' | '30' | 'month';
    className?: string;
    onDayClick?: (date: string) => void;
}

export function Heatmap({ logs, daysToShow = 30, daysMode = 'auto', className, onDayClick }: HeatmapProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    const [cellSize, setCellSize] = useState<number>(24);
    const [computedDays, setComputedDays] = useState<number>(daysToShow);

    // Compute number of days to show and cell size based on viewport and mode
    useEffect(() => {
        const compute = () => {
            const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const isMobile = w < 640;

            let finalDays = daysToShow;
            if (daysMode === '30') finalDays = 30;
            else if (daysMode === 'month') {
                const today = new Date();
                finalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            } else {
                // auto
                if (isMobile) finalDays = 30;
                else {
                    const today = new Date();
                    finalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                }
            }

            const size = isMobile ? 18 : (w < 1024 ? 22 : 28);

            setComputedDays(finalDays);
            setCellSize(size);
        };

        compute();
        window.addEventListener('resize', compute);
        return () => window.removeEventListener('resize', compute);
    }, [daysMode, daysToShow]);

    const generateDates = () => {
        const dates: Date[] = [];
        const today = new Date();
        for (let i = 0; i < computedDays; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }
        return dates.reverse();
    };

    const dates = generateDates();

    const getIntensity = (dateStr: string) => {
        const log = logs[dateStr];
        if (!log || log.totalHabits === 0) return 0;
        const percent = log.completedHabitIds.length / log.totalHabits;

        if (percent === 0) return 0;
        if (percent < 0.25) return 1;
        if (percent < 0.50) return 2;
        if (percent < 0.75) return 3;
        return 4;
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <div className={cn(
            "p-4 border-2 shadow-sm overflow-x-auto relative group",
            isWild ? "bg-[#050505] border-red-600 rounded-none shadow-[0_0_30px_rgba(220,38,38,0.1)]" : "bg-card text-card-foreground rounded-xl",
            className
        )}>
            {/* Decoration Lines */}
            {isWild && (
                <>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-600 animate-pulse" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-red-600" />
                </>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <h3 className={cn("font-black text-base uppercase tracking-tighter flex items-center gap-2", isWild ? "text-red-600" : "")}>
                        {isWild ? "NEURAL_CONSISTENCY_GRID" : "Consistency Map"}
                    </h3>
                    {isWild && <p className="text-[10px] font-mono text-red-900/80 tracking-widest uppercase">Visualizing_Daily_Adherence_Protocols</p>}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("uppercase text-[10px] font-bold", isWild && "text-red-900")}>Min</span>
                    <div className="flex gap-[2px]">
                        <div className={cn("w-2.5 h-2.5", isWild ? "bg-white/5 rounded-none" : "bg-muted/50 rounded-sm")} />
                        <div className={cn("w-2.5 h-2.5", isWild ? "bg-red-900/30 rounded-none" : "bg-primary/20 rounded-sm")} />
                        <div className={cn("w-2.5 h-2.5", isWild ? "bg-red-800/60 rounded-none" : "bg-primary/40 rounded-sm")} />
                        <div className={cn("w-2.5 h-2.5", isWild ? "bg-red-600 rounded-none" : "bg-primary/60 rounded-sm")} />
                        <div className={cn("w-2.5 h-2.5", isWild ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] rounded-none" : "bg-primary rounded-sm")} />
                    </div>
                    <span className={cn("uppercase text-[10px] font-bold", isWild && "text-red-500")}>Max</span>
                </div>
            </div>

            {/* Grid Container - 7 columns (week) with responsive cell sizing */}
            <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-[3px] md:gap-[4px]" style={{ gridAutoRows: `${cellSize}px` }}>
                    {/* Day Labels (Optional, can add later) */}
                    {dates.map((date, i) => {
                        const dateStr = formatDate(date);
                        const log = logs[dateStr];
                        const count = log?.completedHabitIds.length || 0;
                        const intensity = getIntensity(dateStr);

                        return (
                            <motion.button
                                key={dateStr}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                                onClick={() => onDayClick?.(dateStr)}
                                title={`${dateStr}: ${count} completions`}
                                style={{ minWidth: `${cellSize}px`, height: `${cellSize}px` }}
                                className={cn(
                                    "rounded-sm transition-all relative group/cell flex items-center justify-center",
                                    intensity === 0 && "bg-secondary/30 hover:bg-secondary/50",
                                    intensity === 1 && "bg-primary/20 hover:bg-primary/30",
                                    intensity === 2 && "bg-primary/40 hover:bg-primary/50",
                                    intensity === 3 && "bg-primary/60 hover:bg-primary/70",
                                    intensity === 4 && "bg-primary hover:bg-primary/90 shadow-[0_0_8px_rgba(var(--primary),0.4)]",
                                    isWild && "rounded-none border border-red-900/20"
                                )}
                            >
                                {/* Tooltip on Hover */}
                                <span className="opacity-0 group-hover/cell:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 py-0.5 rounded pointer-events-none whitespace-nowrap z-20 mb-1">
                                    {new Date(date).getDate()}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
