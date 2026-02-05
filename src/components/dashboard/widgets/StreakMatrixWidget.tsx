
import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface StreakMatrixWidgetProps {
    data: number[]; // Last 21 days maybe
}

export const StreakMatrixWidget: React.FC<StreakMatrixWidgetProps> = ({ data }) => {
    // Fill with zero if less than 21
    const filledData = [...Array(Math.max(0, 21 - data.length)).fill(0), ...data].slice(-21);

    return (
        <div className="relative group p-4 bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all duration-500 overflow-hidden h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-900/60">Streak Matrix</span>
                </div>
                <span className="text-[9px] font-mono text-purple-500 tracking-tighter uppercase font-bold">21D Buffer</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 py-4">
                {filledData.map((val, i) => (
                    <div
                        key={i}
                        className={`aspect-square rounded-[2px] border transition-all duration-500 ${val > 0
                                ? 'bg-purple-600 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)] scale-[1.05]'
                                : 'bg-white/5 border-white/5 group-hover:bg-white/10'
                            }`}
                        title={val > 0 ? 'Pulse Recorded' : 'Flatline'}
                    />
                ))}
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-2">
                <div className="flex flex-col">
                    <span className="text-[14px] font-black text-white italic">07D AVG</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-black">Performance Profile</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-black text-purple-500">STABLE</span>
                </div>
            </div>
        </div>
    );
};
