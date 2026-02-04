import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    X,
    Activity,
    Clock,
    Zap,
    Cloud,
    Power,
    Star
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export const FocusOverlay = () => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 Min
    const [isRunning, setIsRunning] = useState(false);
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    useEffect(() => {
        const toggle = () => setIsActive(prev => !prev);
        window.addEventListener('toggle-focus', toggle);
        return () => window.removeEventListener('toggle-focus', toggle);
    }, []);

    useEffect(() => {
        let interval: any;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Play Completion Sound
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);
                gain.gain.setValueAtTime(0.1, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start();
                oscillator.stop(context.currentTime + 0.5);
            } catch (e) {
                console.error("Audio failed", e);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 pointer-events-auto"
                >
                    {/* CRT Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 z-10 overflow-hidden text-primary">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] animate-scan" />
                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    </div>

                    <div className="relative z-20 w-full max-w-4xl flex flex-col items-center space-y-12">
                        {/* Terminal Header */}
                        <div className="w-full flex items-center justify-between border-b border-primary/20 pb-4 font-mono text-[10px] tracking-widest text-primary uppercase">
                            <div className="flex items-center gap-4">
                                <Terminal className="w-4 h-4" />
                                <span>Focus Protocol v3.0.4 - Initialized</span>
                            </div>
                            <button onClick={() => setIsActive(false)} className="hover:bg-primary/10 p-2 rounded transition-colors">
                                <Power className="w-4 h-4 cursor-pointer" />
                            </button>
                        </div>

                        {/* Large Timer */}
                        <div className="text-center relative">
                            <motion.div
                                animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-[10rem] md:text-[16rem] font-black italic tracking-tighter text-primary font-mono leading-none"
                            >
                                {formatTime(timeLeft)}
                            </motion.div>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 text-xs font-bold uppercase tracking-widest">
                                {isRunning ? 'CONCENTRATION ACTIVE' : 'SYSTEM IDLE'}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                            {!isRunning ? (
                                <button
                                    onClick={() => setIsRunning(true)}
                                    className="px-8 md:px-12 py-4 bg-primary text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-lg md:text-xl"
                                >
                                    Engage Focus
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsRunning(false)}
                                    className="px-8 md:px-12 py-4 border-2 border-primary text-primary font-black uppercase tracking-widest hover:bg-primary/10 transition-all text-lg md:text-xl"
                                >
                                    Disengage
                                </button>
                            )}
                            <button
                                onClick={() => setTimeLeft(25 * 60)}
                                className="px-6 md:px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all text-lg md:text-xl"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full pt-12 border-t border-primary/10 text-center">
                            <div>
                                <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Efficiency</div>
                                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                    <Activity className="w-5 h-5 text-green-500" />
                                    <span>98.2%</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Sync Status</div>
                                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                    <Cloud className="w-5 h-5 text-blue-500" />
                                    <span>Cloud Active</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-2">Reward</div>
                                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span>+15 XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="animate-reveal text-center">
                            <p className="text-muted-foreground font-mono text-xs opacity-40 uppercase tracking-widest px-4">
                                Your environment is locked. External protocols suppressed.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
