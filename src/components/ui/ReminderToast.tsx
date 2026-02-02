import React from 'react';
import { Bell, X, Clock } from 'lucide-react';

export interface ToastProps {
    id: string;
    title: string;
    message: string;
    onDismiss: (id: string) => void;
    onSnooze?: (id: string, minutes: number) => void;
    actionLabel?: string;
    onAction?: () => void;
}

export const ReminderToast: React.FC<ToastProps> = ({ id, title, message, onDismiss, onSnooze, actionLabel, onAction }) => {
    return (
        <div className="bg-card border border-border shadow-2xl rounded-lg p-4 w-80 md:w-96 flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-full shrink-0">
                    <Bell className="w-5 h-5 text-blue-500 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground">{message}</p>
                </div>
                <button onClick={() => onDismiss(id)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onDismiss(id)}
                    className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded hover:bg-primary/90 transition-colors"
                >
                    Done
                </button>
                {onSnooze && (
                    <div className="flex gap-1 flex-1">
                        <button
                            onClick={() => onSnooze(id, 5)}
                            className="flex-1 bg-muted text-muted-foreground text-xs font-medium py-2 rounded hover:bg-muted/80 flex items-center justify-center gap-1"
                        >
                            <Clock className="w-3 h-3" /> 5m
                        </button>
                        <button
                            onClick={() => onSnooze(id, 15)}
                            className="flex-1 bg-muted text-muted-foreground text-xs font-medium py-2 rounded hover:bg-muted/80 flex items-center justify-center gap-1"
                        >
                            15m
                        </button>
                    </div>
                )}
                {onAction && actionLabel && (
                    <button
                        onClick={() => { onAction(); onDismiss(id); }}
                        className="flex-1 bg-secondary text-secondary-foreground text-xs font-medium py-2 rounded hover:bg-secondary/80"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};
