import { cn } from '@/lib/utils';
import { DayLog } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

interface HeatmapProps {
    logs: Record<string, DayLog>; // Map of date -> log
    daysToShow?: number;
    className?: string;
    onDayClick?: (date: string) => void;
}

export function Heatmap({ logs, daysToShow = 365, className, onDayClick }: HeatmapProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    // Generate dates backwards from today
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < daysToShow; i++) {
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
            "p-6 border-4 shadow-sm overflow-x-auto relative group",
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

            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h3 className={cn("font-black text-xl uppercase tracking-tighter flex items-center gap-2", isWild ? "text-red-600" : "")}>
                        {isWild ? "NEURAL_CONSISTENCY_GRID" : "Consistency Map"}
                    </h3>
                    {isWild && <p className="text-[10px] font-mono text-red-900/80 tracking-widest uppercase">Visualizing_Daily_Adherence_Protocols</p>}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("uppercase text-[10px] font-bold", isWild && "text-red-900")}>Min</span>
                    <div className="flex gap-[2px]">
                        <div className={cn("w-3 h-3", isWild ? "bg-white/5 rounded-none" : "bg-muted/50 rounded-sm")} />
                        <div className={cn("w-3 h-3", isWild ? "bg-red-900/30 rounded-none" : "bg-primary/20 rounded-sm")} />
                        <div className={cn("w-3 h-3", isWild ? "bg-red-800/60 rounded-none" : "bg-primary/40 rounded-sm")} />
                        <div className={cn("w-3 h-3", isWild ? "bg-red-600 rounded-none" : "bg-primary/60 rounded-sm")} />
                        <div className={cn("w-3 h-3", isWild ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] rounded-none" : "bg-primary rounded-sm")} />
                    </div>
                    <span className={cn("uppercase text-[10px] font-bold", isWild && "text-red-500")}>Max</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-[3px] justify-center md:justify-start">
                {dates.map((date, i) => {
                    const dateStr = formatDate(date);
                    const intensity = getIntensity(dateStr);

                    return (
                        <motion.button
                            key={dateStr}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={
                                isWild && intensity === 4
                                    ? { opacity: 1, scale: 1, boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 10px rgba(239,68,68,0.6)", "0 0 0px rgba(239,68,68,0)"] }
                                    : { opacity: 1, scale: 1 }
                            }
                            transition={{
                                duration: isWild && intensity === 4 ? 2 : 0.2, // Longer duration for pulse
                                delay: Math.min(i * 0.005, 1.5), // Cap delay to avoid waiting too long
                                ease: "easeOut",
                                repeat: isWild && intensity === 4 ? Infinity : 0, // Repeat pulse indefinitely
                                repeatType: "loop"
                            }}
                            onClick={() => onDayClick?.(dateStr)}
                            title={`${dateStr}: ${logs[dateStr]?.completedHabitIds.length || 0} completions`}
                            className={cn(
                                "w-3 h-3 transition-colors cursor-pointer relative",
                                !isWild && "rounded-sm hover:scale-125 hover:z-10",
                                isWild && "rounded-none hover:border hover:border-white z-0 hover:z-20",
                                intensity === 0 && (isWild ? "bg-white/5" : "bg-muted/20 hover:bg-muted"),
                                intensity === 1 && (isWild ? "bg-red-900/30" : "bg-green-900/50"),
                                intensity === 2 && (isWild ? "bg-red-800/60" : "bg-green-700/60"),
                                intensity === 3 && (isWild ? "bg-red-600" : "bg-green-500/80"),
                                intensity === 4 && (isWild ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] z-10" : "bg-green-400")
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
}
