import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NeuralLoadWidgetProps {
    percentage: number;
    total: number;
    completed: number;
}

export const NeuralLoadWidget: React.FC<NeuralLoadWidgetProps> = ({ percentage, total, completed }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/dashboard')}
            className="bg-card border border-border p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col items-center justify-between cursor-pointer hover:border-primary/30"
        >
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Reflection Summary</span>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {percentage}%
                </div>
            </div>

            <div className="relative w-20 h-20 my-2 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="transparent"
                        className="text-secondary"
                    />
                    <motion.circle
                        initial={{ strokeDasharray: "0 214" }}
                        animate={{ strokeDasharray: `${(percentage / 100) * 213.6} 214` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeLinecap="round"
                        className="text-primary"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-foreground">{completed}</span>
                    <span className="text-[9px] font-medium text-muted-foreground">/{total}</span>
                </div>
            </div>

            <div className="w-full text-center">
                <p className="text-[10px] text-muted-foreground leading-snug">
                    {percentage === 100
                        ? "Perfectly consistent!"
                        : `${total - completed} left to reflect.`}
                </p>
            </div>
        </div>
    );
};
