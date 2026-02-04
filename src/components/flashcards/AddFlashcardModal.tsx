import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { FlashcardService } from '../../services/flashcard.service';
import { useToast } from '../../context/ToastContext';

interface AddFlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId?: string; // Optional: Link to a specific note
}

export const AddFlashcardModal = ({ isOpen, onClose, noteId }: AddFlashcardModalProps) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const { showToast } = useToast();

    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;

        try {
            setIsSubmitting(true);
            await FlashcardService.createFlashcard({
                front,
                back,
                noteId
            });

            showToast("Protocol Added", "Flashcard injected into Neural Net.", { type: 'success' });
            setFront('');
            setBack('');
            onClose();
        } catch (error: any) {
            console.error(error);
            showToast("Injection Failed", error.message, { type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`relative w-full max-w-lg overflow-hidden ${isWild ? 'bg-black border-2 border-primary rounded-none shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'bg-card border border-white/10 rounded-3xl shadow-2xl'}`}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isWild ? 'bg-primary border border-primary text-black' : 'bg-primary/10 text-primary'}`}>
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-black uppercase tracking-wider ${isWild ? 'text-primary' : ''}`}>Inject Protocol</h2>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Create Memory Trace</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Front (Query)</label>
                            <textarea
                                value={front}
                                onChange={(e) => setFront(e.target.value)}
                                placeholder="e.g., What is the Time Complexity of QuickSort?"
                                className={`w-full h-24 bg-secondary/50 border-2 border-transparent focus:border-primary/50 text-lg p-4 resize-none transition-all outline-none ${isWild ? 'rounded-none font-mono placeholder:text-primary/30' : 'rounded-xl'}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Back (Response)</label>
                            <textarea
                                value={back}
                                onChange={(e) => setBack(e.target.value)}
                                placeholder="e.g., O(n log n) average, O(n^2) worst case."
                                className={`w-full h-24 bg-secondary/50 border-2 border-transparent focus:border-primary/50 text-lg p-4 resize-none transition-all outline-none ${isWild ? 'rounded-none font-mono placeholder:text-primary/30' : 'rounded-xl'}`}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                Abort
                            </Button>
                            <Button type="submit" isLoading={isSubmitting} className={isWild ? 'rounded-none border-2' : ''}>
                                Inject Trace
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
