import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReminderToast, ToastProps } from '../components/ui/ReminderToast';

interface ToastContextType {
    showToast: (title: string, message: string, options?: {
        duration?: number;
        onAction?: () => void;
        actionLabel?: string;
        type?: 'success' | 'error' | 'info';
    }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = (title: string, message: string, options: any = {}) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastProps = {
            id,
            title,
            message,
            onDismiss: (toastId) => setToasts(prev => prev.filter(t => t.id !== toastId)),
            onSnooze: (toastId, mins) => {
                // Snooze logic handled by callback if passed, otherwise default dismiss
                setToasts(prev => prev.filter(t => t.id !== toastId));
            }
            // Note: ReminderToast might need refactoring to accept generic actions instead of just 'onSnooze'
            // For now, we will reuse it as is or slightly modify render logic
        };

        // If we want generic "Undo" action, we might need to update ReminderToast props
        // or create a new GenericToast component.
        // Let's assume we update ReminderToast to take `actionLabel` and `onAction` in a future step
        // For now, this is a placeholder structure.

        setToasts(prev => [...prev, newToast]);

        if (options.duration !== 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, options.duration || 3000);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <ReminderToast key={toast.id} {...toast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
