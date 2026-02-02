import { cn } from '@/lib/utils';
import { DayLog } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';

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
            "p-4 border shadow-sm overflow-x-auto",
            isWild ? "bg-black border-primary rounded-none" : "bg-card text-card-foreground rounded-xl",
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold text-sm uppercase tracking-tighter", isWild && "italic")}>Consistency Map</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="uppercase text-[10px]">Min</span>
                    <div className="flex gap-1">
                        <div className={cn("w-2 h-2", isWild ? "bg-primary/5 rounded-none" : "bg-muted/50 rounded-sm")} />
                        <div className={cn("w-2 h-2", isWild ? "bg-primary/25 rounded-none" : "bg-primary/20 rounded-sm")} />
                        <div className={cn("w-2 h-2", isWild ? "bg-primary/50 rounded-none" : "bg-primary/40 rounded-sm")} />
                        <div className={cn("w-2 h-2", isWild ? "bg-primary/75 rounded-none" : "bg-primary/60 rounded-sm")} />
                        <div className={cn("w-2 h-2", isWild ? "bg-primary rounded-none" : "bg-primary rounded-sm")} />
                    </div>
                    <span className="uppercase text-[10px]">Max</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                {dates.map((date) => {
                    const dateStr = formatDate(date);
                    const intensity = getIntensity(dateStr);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDayClick?.(dateStr)}
                            title={`${dateStr}: ${logs[dateStr]?.completedHabitIds.length || 0} completions. Click for details.`}
                            className={cn(
                                "w-2.5 h-2.5 transition-all hover:scale-150 hover:ring-2 hover:ring-ring hover:z-10 cursor-pointer",
                                !isWild && "rounded-sm",
                                isWild && "rounded-none",
                                intensity === 0 && (isWild ? "bg-white/5 hover:bg-white/10" : "bg-muted/20 hover:bg-muted"),
                                intensity === 1 && (isWild ? "bg-primary/20" : "bg-green-900/50"),
                                intensity === 2 && (isWild ? "bg-primary/40" : "bg-green-700/60"),
                                intensity === 3 && (isWild ? "bg-primary/70" : "bg-green-500/80"),
                                intensity === 4 && (isWild ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-green-400")
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
}
