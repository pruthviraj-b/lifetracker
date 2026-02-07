import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Check, Brain, ChevronRight, Plus, Archive } from 'lucide-react';
import { FlashcardService } from '../services/flashcard.service';
import { Flashcard } from '../types/flashcard';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

import { ThemedCard } from '../components/ui/ThemedCard';

export default function RecallPage() {
    const navigate = useNavigate();
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

    // Blocking loader removed for instant UI

    // --- Empty / Error State ---
    if (!loading && (!queue || queue.length === 0) && !sessionComplete) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-12 animate-claude-in">
                <ThemedCard className="max-w-md w-full p-12 space-y-8 rounded-[3rem]">
                    <div className="relative mx-auto w-fit">
                        <div className="p-6 bg-primary/10 rounded-[2rem]">
                            <Zap className="w-12 h-12 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">All caught up</h1>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            Your knowledge is well-maintained. Return tomorrow to continue your growth journey.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="claude-button w-full h-14 bg-background border-border text-sm font-bold"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </ThemedCard>
            </div>
        );
    }

    const currentCard = queue[currentIndex];

    // --- Review Interface ---
    return (
        <div className="p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto space-y-10 min-h-screen">
            {/* Header / Progress */}
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Zap className="w-6 h-6 text-primary fill-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Recall Session</h1>
                        <p className="text-sm font-medium text-muted-foreground">Reinforce your knowledge and memory.</p>
                    </div>
                </div>
                <div className="px-5 py-2.5 bg-secondary rounded-2xl border border-border text-xs font-bold text-muted-foreground">
                    {loading ? '...' : `Item ${currentIndex + 1} of ${queue.length}`}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${loading || queue.length === 0 ? 0 : ((currentIndex) / queue.length) * 100}%` }}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="w-full max-w-2xl space-y-12">
                    <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-secondary/20 rounded-[3.5rem] animate-pulse border-2 border-dashed border-border/50 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
                    </div>
                </div>
            ) : sessionComplete ? (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md"
                >
                    <ThemedCard className="text-center p-12 space-y-10 rounded-[3rem] shadow-xl">
                        <div className="w-24 h-24 mx-auto bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Check className="w-12 h-12" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Session Complete</h2>
                            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Great job! Your memory has been reinforced. Every session makes your knowledge base stronger.</p>
                        </div>
                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="claude-button w-full h-14 bg-primary text-white shadow-xl shadow-primary/20 text-sm font-bold"
                        >
                            Back to Dashboard
                        </Button>
                    </ThemedCard>
                </motion.div>
            ) : (
                /* Active Flashcard */
                <div className="w-full max-w-2xl space-y-12">
                    <div className="perspective-1000">
                        <motion.div
                            className="relative w-full aspect-[4/3] md:aspect-[16/9] cursor-pointer"
                            onClick={() => !isFlipped && setIsFlipped(true)}
                            initial={false}
                            animate={{ rotateX: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* FRONT */}
                            <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateX(0deg)' }}>
                                <ThemedCard className="h-full w-full flex flex-col items-center justify-center text-center p-12 rounded-[3.5rem] shadow-lg group">
                                    <span className="absolute top-10 left-10 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Question</span>
                                    <div className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight px-6 text-balance">
                                        {currentCard?.front}
                                    </div>
                                    {!isFlipped && (
                                        <div className="absolute bottom-10 flex items-center gap-2 text-xs font-bold text-muted-foreground animate-pulse">
                                            Tap to reveal answer
                                        </div>
                                    )}
                                </ThemedCard>
                            </div>

                            {/* BACK */}
                            <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateX(180deg)' }}>
                                <ThemedCard className="h-full w-full flex flex-col items-center justify-center text-center p-12 rounded-[3.5rem] border-primary/20 bg-primary/5 shadow-xl">
                                    <span className="absolute top-10 left-10 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Answer</span>
                                    <div className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground/90 leading-relaxed px-6 text-balance">
                                        {currentCard?.back}
                                    </div>
                                </ThemedCard>
                            </div>
                        </motion.div>
                    </div>

                    {/* Controls (Only visible when flipped) */}
                    <AnimatePresence>
                        {isFlipped && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-6"
                            >
                                <Button
                                    variant="outline"
                                    className="claude-button h-20 flex flex-col gap-1 border-border bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                                >
                                    <span className="font-bold text-sm">Need Help</span>
                                    <span className="text-[10px] font-medium opacity-50">Review again</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="claude-button h-20 flex flex-col gap-1 border-border bg-background hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                                    onClick={(e) => { e.stopPropagation(); handleRate(2); }}
                                >
                                    <span className="font-bold text-sm">Hard</span>
                                    <span className="text-[10px] font-medium opacity-50">Slightly difficult</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="claude-button h-20 flex flex-col gap-1 border-border bg-background hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    onClick={(e) => { e.stopPropagation(); handleRate(3); }}
                                >
                                    <span className="font-bold text-sm">Good</span>
                                    <span className="text-[10px] font-medium opacity-50">Familiar</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="claude-button h-20 flex flex-col gap-1 border-border bg-background hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                    onClick={(e) => { e.stopPropagation(); handleRate(4); }}
                                >
                                    <span className="font-bold text-sm">Easy</span>
                                    <span className="text-[10px] font-medium opacity-50">Instant recall</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
