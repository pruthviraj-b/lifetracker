import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: string) => void;
    initialNote?: string;
    title?: string;
}

export function NoteModal({ isOpen, onClose, onSave, initialNote = '', title = 'Add Note' }: NoteModalProps) {
    const [note, setNote] = useState(initialNote);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">{title}</h2>

                <textarea
                    className="w-full h-32 bg-muted/50 border border-input rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                    placeholder="Reflect on this completion..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={280}
                    autoFocus
                />

                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                        {note.length}/280
                    </span>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => onSave(note)}>Save Note</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
