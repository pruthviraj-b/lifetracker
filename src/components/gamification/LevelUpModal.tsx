import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
}

export function LevelUpModal({ isOpen, onClose, level }: LevelUpModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl animate-slide-up overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Animated Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/20 blur-3xl rounded-full -z-10 animate-pulse" />

                {/* Icon */}
                <div className="mb-6 relative inline-block">
                    <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Trophy className="w-10 h-10 text-black fill-black/20" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 animate-bounce delay-100">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 animate-bounce delay-200">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase tracking-widest">
                    Level Up!
                </h2>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-4 font-sans">
                    {level}
                </div>
                <p className="text-zinc-400 mb-8">
                    You've reached a new tier of discipline. Keep building your momentum.
                </p>

                {/* Action */}
                <Button
                    onClick={onClose}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                >
                    Continue
                </Button>

                {/* CSS Confetti (Simple implementation) */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-500 rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `-10%`,
                                    animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                                    animationDelay: `${Math.random() * 1}s`,
                                    backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d'][Math.floor(Math.random() * 4)]
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
