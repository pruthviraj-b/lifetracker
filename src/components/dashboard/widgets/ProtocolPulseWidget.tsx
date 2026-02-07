import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { Reminder } from '../../../types/reminder';
import { useNavigate } from 'react-router-dom';

interface ProtocolPulseWidgetProps {
    nextReminder: {
        title: string;
        time: string;
    } | null;
    allReminders?: Reminder[];
}

export const ProtocolPulseWidget: React.FC<ProtocolPulseWidgetProps> = ({ nextReminder, allReminders }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState<string>('--:--:--');

    useEffect(() => {
        if (!nextReminder) return;

        const timer = setInterval(() => {
            const now = new Date();
            const [hours, minutes] = nextReminder.time.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            if (target < now) target.setDate(target.getDate() + 1);

            const diff = target.getTime() - now.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

            setTimeLeft(`${h}:${m}:${s}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [nextReminder]);

    return (
        <div
            onClick={() => navigate('/reminders')}
            className="bg-card border border-border p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between cursor-pointer hover:border-primary/30"
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Active Pattern</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {allReminders && allReminders.length > 0 ? (
                    <div className="space-y-2">
                        {allReminders.slice(0, 3).map((r, i) => (
                            <div key={r.id} className={`flex items-start justify-between ${i === 0 ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="space-y-0.5">
                                    <h3 className="text-[12px] font-medium text-foreground truncate max-w-[120px]">
                                        {r.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span className="text-[9px] font-medium tracking-wide">{r.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : nextReminder ? (
                    <div className="space-y-1">
                        <h3 className="text-[12px] font-medium text-foreground truncate">
                            {nextReminder.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Next: {nextReminder.time}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-muted-foreground text-[10px] text-center py-4">
                        System idle
                    </div>
                )}
            </div>

            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded-lg flex items-center justify-between mt-2">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">In</span>
                <span className="text-sm font-bold text-primary tabular-nums">
                    {timeLeft}
                </span>
            </div>
        </div>
    );
};
