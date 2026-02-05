
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

interface ProtocolPulseWidgetProps {
    nextReminder: {
        title: string;
        time: string;
    } | null;
}

export const ProtocolPulseWidget: React.FC<ProtocolPulseWidgetProps> = ({ nextReminder }) => {
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
        <div className="relative group p-4 bg-white/[0.02] border border-white/5 hover:border-yellow-500/30 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-900/60">Protocol Pulse</span>
                </div>
                <div className="px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[8px] font-black text-yellow-500 uppercase">Active</div>
            </div>

            <div className="py-2">
                {nextReminder ? (
                    <>
                        <h3 className="text-xl font-black italic tracking-tighter truncate text-white/90">
                            {nextReminder.title}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-mono tracking-widest uppercase">Scheduled Pulse @ {nextReminder.time}</span>
                        </div>
                    </>
                ) : (
                    <div className="text-muted-foreground italic text-[10px] uppercase font-bold opacity-30">
                        No protocols queued in matrix
                    </div>
                )}
            </div>

            <div className="bg-black/40 border border-white/5 p-2 rounded flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">T-Minus</span>
                <span className="text-lg font-black font-mono text-yellow-500/80 tracking-tighter tabular-nums">
                    {timeLeft}
                </span>
            </div>
        </div>
    );
};
