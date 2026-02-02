import React from 'react';
import { Achievement } from '../../services/achievement.service';
import { Button } from '../ui/Button';
import { Trophy, Star, Sparkles, Share2, X } from 'lucide-react';

interface NewAchievementModalProps {
    achievement: Achievement;
    isOpen: boolean;
    onClose: () => void;
}

export function NewAchievementModal({ achievement, isOpen, onClose }: NewAchievementModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-card border-2 border-primary shadow-2xl rounded-[3rem] p-8 text-center space-y-6 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

                <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="relative">
                    <div className="w-24 h-24 mx-auto bg-primary/20 rounded-[2rem] flex items-center justify-center animate-bounce duration-1000">
                        <Trophy className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute top-0 right-1/4 animate-pulse">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Achievement Unlocked</h2>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">{achievement.name}</h1>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed px-4">
                        {achievement.description}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 py-4">
                    <div className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Star className="w-5 h-5 fill-current" />
                        +{achievement.points} pts
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                        onClick={() => {
                            // Share logic placeholder
                            console.log("Sharing achievement...");
                        }}
                    >
                        <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Brag About It
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground font-bold hover:text-foreground"
                        onClick={onClose}
                    >
                        Maybe Later
                    </Button>
                </div>
            </div>
        </div>
    );
}
