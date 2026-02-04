import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Check, Brain, ChevronRight, Plus, Archive } from 'lucide-react';
import { FlashcardService } from '../services/flashcard.service';
import { Flashcard } from '../types/flashcard';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function RecallPage() {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const { showToast } = useToast();

    // State
    const [queue, setQueue] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const data = await FlashcardService.getDueFlashcards();
            setQueue(data);
            if (data.length === 0) setSessionComplete(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (rating: 1 | 2 | 3 | 4) => {
        if (!queue[currentIndex]) return;

        const card = queue[currentIndex];
        const nextStats = FlashcardService.calculateNextReview(card, rating);

        // Optimistic UI update
        try {
            await FlashcardService.reviewFlashcard(card.id, nextStats);
            setIsFlipped(false);

            // Move to next card after delay
            setTimeout(() => {
                if (currentIndex + 1 >= queue.length) {
                    setSessionComplete(true);
                } else {
                    setCurrentIndex(prev => prev + 1);
                }
            }, 200);

        } catch (error) {
            console.error("Failed to save review", error);
            showToast("Sync Error", "Could not save progress", { type: 'error' });
        }
    };

    // --- Loading State ---
    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center space-y-4 animate-pulse">
                <Brain className="w-16 h-16 mx-auto text-primary" />
                <h2 className="text-xl font-black uppercase tracking-widest">Calibrating Neural Net...</h2>
            </div>
        </div>
    );

    // --- Empty / Error State ---
    if (!loading && (!queue || queue.length === 0)) {
        return (
            <div className={`min-h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-8 ${isWild ? 'wild' : ''}`}>
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Brain className="w-24 h-24 text-primary relative z-10" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Neural Sync Complete</h1>
                    <p className="text-muted-foreground font-mono max-w-md mx-auto">
                        All memory traces reinforced. Decay prevented.
                        Return tomorrow for further optimization.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Check Again
                    </Button>
                </div>
            </div>
        );
    }

    const currentCard = queue[currentIndex];

    // Safety check for crash prevention
    if (!currentCard) return null;

    // --- Review Interface ---
    return (
        <div className={`min-h-screen bg-background p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto ${isWild ? 'wild font-mono' : ''}`}>
            {/* Header / Progress */}
            <div className="w-full flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <h1 className="text-xl font-bold uppercase tracking-wider">Neural Gym</h1>
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                    CARD {currentIndex + 1} / {queue.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-secondary mb-12 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                />
            </div>

            {/* Completion State (End of Session) */}
            {sessionComplete ? (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-8 py-20"
                >
                    <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20">
                        <Check className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black uppercase">Session Verified</h2>
                    <p className="text-muted-foreground">Memory index updated successfully.</p>
                    <Button onClick={() => window.location.href = '/dashboard'}>Return to Hub</Button>
                </motion.div>
            ) : (
                /* Active Flashcard */
                <div className="w-full max-w-2xl perspective-1000">
                    <motion.div
                        className={`
                            relative w-full aspect-[4/3] md:aspect-[16/9] cursor-pointer perspective-1000
                        `}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                        initial={false}
                        animate={{ rotateX: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* FRONT */}
                        <div className={`
                            absolute inset-0 backface-hidden rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center border-2
                            ${isWild ? 'bg-black border-primary shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'bg-card border-border shadow-2xl'}
                        `}>
                            <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Query Protocol</span>
                            <div className="text-2xl md:text-4xl font-bold leading-tight">
                                {currentCard.front}
                            </div>
                            <div className="absolute bottom-6 text-xs text-muted-foreground animate-pulse">
                                TAP TO DECRYPT
                            </div>
                        </div>

                        {/* BACK */}
                        <div className={`
                            absolute inset-0 backface-hidden rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center border-2 border-t-0
                            ${isWild ? 'bg-zinc-900 border-primary shadow-[0_0_50px_rgba(59,130,246,0.2)]' : 'bg-secondary/50 border-primary/20 shadow-2xl'}
                        `} style={{ transform: 'rotateX(180deg)' }}>
                            <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-primary">Decrypted Data</span>
                            <div className="text-xl md:text-3xl font-medium leading-relaxed text-foreground/90">
                                {currentCard.back}
                            </div>
                        </div>
                    </motion.div>

                    {/* Controls (Only visible when flipped) */}
                    <AnimatePresence>
                        {isFlipped && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="grid grid-cols-4 gap-4 mt-8"
                            >
                                <Button
                                    variant="outline"
                                    className="h-14 flex flex-col gap-1 border-red-900/50 hover:bg-red-900/20 hover:text-red-500"
                                    onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                                >
                                    <span className="font-black text-lg">AGAIN</span>
                                    <span className="text-[10px] opacity-60">Reset</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-14 flex flex-col gap-1 border-orange-900/50 hover:bg-orange-900/20 hover:text-orange-500"
                                    onClick={(e) => { e.stopPropagation(); handleRate(2); }}
                                >
                                    <span className="font-black text-lg">HARD</span>
                                    <span className="text-[10px] opacity-60">1.2x</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-14 flex flex-col gap-1 border-blue-900/50 hover:bg-blue-900/20 hover:text-blue-500"
                                    onClick={(e) => { e.stopPropagation(); handleRate(3); }}
                                >
                                    <span className="font-black text-lg">GOOD</span>
                                    <span className="text-[10px] opacity-60">2.5x</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-14 flex flex-col gap-1 border-green-900/50 hover:bg-green-900/20 hover:text-green-500"
                                    onClick={(e) => { e.stopPropagation(); handleRate(4); }}
                                >
                                    <span className="font-black text-lg">EASY</span>
                                    <span className="text-[10px] opacity-60">3.5x</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
