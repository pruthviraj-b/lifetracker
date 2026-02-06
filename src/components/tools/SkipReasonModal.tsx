
import React, { useState, useEffect } from 'react';
import { X, CalendarOff } from 'lucide-react';
import { Button } from '../ui/Button';

interface SkipReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    habitTitle: string;
}

export function SkipReasonModal({ isOpen, onClose, onConfirm, habitTitle }: SkipReasonModalProps) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto p-4">
            <div className="min-h-screen flex items-start justify-center py-12">
                <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <CalendarOff className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold">Skip {habitTitle}?</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Skipping maintains your streak if you have a valid reason, but you won't gain XP.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                Reason (Optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="I'm sick, traveling, etc..."
                                className="w-full bg-muted/50 border border-input rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={() => onConfirm(reason)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                                Skip Day
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
