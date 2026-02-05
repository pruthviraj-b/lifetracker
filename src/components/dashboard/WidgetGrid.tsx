
import React from 'react';
import { NeuralLoadWidget } from './widgets/NeuralLoadWidget';
import { ProtocolPulseWidget } from './widgets/ProtocolPulseWidget';
import { StreakMatrixWidget } from './widgets/StreakMatrixWidget';
import { QuickLogWidget } from './widgets/QuickLogWidget';
import { motion } from 'framer-motion';

interface WidgetGridProps {
    stats: {
        percentage: number;
        total: number;
        completed: number;
    };
    nextReminder: { title: string; time: string } | null;
    streakData: number[];
    habits: { id: string; title: string; completed: boolean }[];
    onLog: (id: string) => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ stats, nextReminder, streakData, habits, onLog }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <NeuralLoadWidget {...stats} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <ProtocolPulseWidget nextReminder={nextReminder} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <StreakMatrixWidget data={streakData} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <QuickLogWidget habits={habits} onLog={onLog} />
            </motion.div>
        </div>
    );
};
