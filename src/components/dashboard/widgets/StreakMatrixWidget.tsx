
import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StreakMatrixWidgetProps {
    data: number[]; // Last 21 days maybe
}

export const StreakMatrixWidget: React.FC<StreakMatrixWidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    // Fill with zero if less than 21
    const filledData = [...Array(Math.max(0, 21 - data.length)).fill(0), ...data].slice(-21);

    return (
        <div
            onClick={() => navigate('/dashboard')}
            className="bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between cursor-pointer hover:border-primary/30"
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">System Health</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-2">
                <div className="grid grid-cols-7 gap-1">
                    {filledData.map((val, i) => (
                        <div
                            key={i}
                            className={`
                                aspect-square rounded-[3px] transition-all duration-300
                                ${val > 0
                                    ? 'bg-primary/80 shadow-[0_0_8px_rgba(217,119,87,0.1)]'
                                    : 'bg-secondary'
                                }
                            `}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">State</span>
                    <span className="text-xs font-bold text-foreground">Stable</span>
                </div>
                <div className="px-2 py-0.5 bg-green-50/50 text-green-600 rounded-full text-[8px] font-bold">
                    ACTIVE
                </div>
            </div>
        </div>
    );
};
