
import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface NeuralLoadWidgetProps {
    percentage: number;
    total: number;
    completed: number;
}

export const NeuralLoadWidget: React.FC<NeuralLoadWidgetProps> = ({ percentage, total, completed }) => {
    return (
        <div className="relative group p-4 bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all duration-500 overflow-hidden h-full">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-scanline pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity" />

            <div className="relative z-10 flex flex-col items-center justify-between h-full">
                <div className="w-full flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-900/60">Neural Load</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-500 font-bold">{percentage}%</span>
                </div>

                <div className="relative w-24 h-24 my-2 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r="38"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <motion.circle
                            initial={{ strokeDasharray: "0 240" }}
                            animate={{ strokeDasharray: `${(percentage / 100) * 240} 240` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="48"
                            cy="48"
                            r="38"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black italic">{completed}</span>
                        <div className="w-8 h-[1px] bg-white/10 my-0.5" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{total} Nodes</span>
                    </div>
                </div>

                <div className="w-full text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                        Biometric Synchronization: <span className={percentage === 100 ? "text-green-500" : "text-yellow-500/70"}>
                            {percentage === 100 ? 'OPTIMAL' : 'INCOMPLETE'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};
