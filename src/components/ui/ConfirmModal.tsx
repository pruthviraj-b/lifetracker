import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false, onConfirm, onCancel
}) => {
    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-lg font-semibold">
                        {isDestructive && <AlertTriangle className="w-6 h-6 text-red-500" />}
                        {title}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {message}
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button
                            className={`flex-1 ${isDestructive ? 'bg-red-500 hover:bg-red-600' : ''}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
