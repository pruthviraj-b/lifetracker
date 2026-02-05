
import React from 'react';
import { motion } from 'framer-motion';
import { Target, Plus } from 'lucide-react';

interface QuickLogWidgetProps {
    habits: { id: string; title: string; completed: boolean }[];
    onLog: (id: string) => void;
}

export const QuickLogWidget: React.FC<QuickLogWidgetProps> = ({ habits, onLog }) => {
    return (
        <div className="relative group p-4 bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden h-full flex flex-col">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-900/60">Fast Inoculation</span>
                </div>
                <Plus className="w-3 h-3 text-blue-500 group-hover:rotate-90 transition-transform duration-500" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {habits.length === 0 ? (
                    <div className="text-[9px] text-muted-foreground uppercase text-center py-6 opacity-30 italic font-bold">
                        No protocols loaded
                    </div>
                ) : (
                    habits.slice(0, 3).map(habit => (
                        <button
                            key={habit.id}
                            onClick={() => onLog(habit.id)}
                            disabled={habit.completed}
                            className={`w-full p-2 border flex items-center justify-between transition-all group/btn ${habit.completed
                                    ? 'bg-blue-500/20 border-blue-500/30 opacity-70 cursor-default'
                                    : 'bg-black border-white/5 hover:border-blue-500/50 hover:bg-white/[0.03]'
                                }`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[100px] ${habit.completed ? 'text-blue-400' : 'text-gray-300'
                                }`}>
                                {habit.title}
                            </span>
                            <div className={`w-3 h-3 border flex items-center justify-center ${habit.completed ? 'border-blue-500 bg-blue-500 text-black' : 'border-white/20'
                                }`}>
                                {habit.completed && <div className="w-1.5 h-1.5 bg-black" />}
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="mt-2 text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40 text-center">
                Press to log biometric pulse
            </div>
        </div>
    );
};
