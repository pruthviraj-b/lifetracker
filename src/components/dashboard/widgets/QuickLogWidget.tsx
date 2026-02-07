import React from 'react';
import { motion } from 'framer-motion';
import { Target, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickLogWidgetProps {
    habits: { id: string; title: string; completed: boolean }[];
    onLog: (id: string) => void;
}

export const QuickLogWidget: React.FC<QuickLogWidgetProps> = ({ habits, onLog }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Reflection Log</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {habits.length > 0 ? (
                    habits.slice(0, 4).map((h) => (
                        <button
                            key={h.id}
                            onClick={() => !h.completed && onLog(h.id)}
                            className={`
                                w-full flex items-center justify-between p-2 rounded-xl transition-all border
                                ${h.completed
                                    ? 'bg-secondary/30 border-border opacity-60 grayscale cursor-default'
                                    : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                                }
                            `}
                        >
                            <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                                {h.title}
                            </span>
                            {h.completed ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/20" />
                            )}
                        </button>
                    ))
                ) : (
                    <div className="text-muted-foreground text-[10px] text-center py-4">
                        Log empty
                    </div>
                )}
            </div>

            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">State</span>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};
