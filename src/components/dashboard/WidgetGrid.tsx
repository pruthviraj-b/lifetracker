
import React from 'react';
import { NeuralLoadWidget } from './widgets/NeuralLoadWidget';
import { ProtocolPulseWidget } from './widgets/ProtocolPulseWidget';
import { StreakMatrixWidget } from './widgets/StreakMatrixWidget';
import { QuickLogWidget } from './widgets/QuickLogWidget';
import { motion } from 'framer-motion';
import { Reminder } from '../../types/reminder';

interface WidgetGridProps {
    stats: {
        percentage: number;
        total: number;
        completed: number;
    };
    nextReminder: { title: string; time: string } | null;
    allReminders?: Reminder[];
    streakData: number[];
    habits: { id: string; title: string; completed: boolean }[];
    onLog: (id: string) => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ stats, nextReminder, allReminders, streakData, habits, onLog }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sm:col-span-2"
            >
                <ProtocolPulseWidget nextReminder={nextReminder} allReminders={allReminders} />
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
