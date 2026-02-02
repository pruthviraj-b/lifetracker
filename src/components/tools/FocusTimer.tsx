import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Play, Pause, RotateCcw, X } from 'lucide-react';

interface FocusTimerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FocusTimer({ isOpen, onClose }: FocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    // Simple Web Audio API Beep
    const playSound = (type: 'start' | 'end') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'start') {
                // High-pitch "Ping"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            } else {
                // Success "Chord" (Arpeggio)
                const now = ctx.currentTime;

                // Note 1
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.frequency.value = 523.25; // C5
                gain1.gain.setValueAtTime(0.1, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 1);
                osc1.start(now);
                osc1.stop(now + 1);

                // Note 2
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 659.25; // E5
                gain2.gain.setValueAtTime(0.1, now + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
                osc2.start(now + 0.1);
                osc2.stop(now + 1.1);

                // Note 3
                const osc3 = ctx.createOscillator();
                const gain3 = ctx.createGain();
                osc3.connect(gain3);
                gain3.connect(ctx.destination);
                osc3.frequency.value = 783.99; // G5
                gain3.gain.setValueAtTime(0.1, now + 0.2);
                gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                osc3.start(now + 0.2);
                osc3.stop(now + 1.2);
            }

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer FINISHED
            setIsActive(false);
            playSound('end');
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) {
            playSound('start');
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode: 'FOCUS' | 'BREAK') => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
        // Optional: Play start sound when switching modes to confirm action
        playSound('start');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight">Focus Mode</h2>
                        <p className="text-sm text-muted-foreground">
                            {mode === 'FOCUS' ? 'Stay tracking.' : 'Take a breather.'}
                        </p>
                    </div>

                    <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums">
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex justify-center gap-2">
                        <div className="flex gap-1 bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => switchMode('FOCUS')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'FOCUS' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Focus
                            </button>
                            <button
                                onClick={() => switchMode('BREAK')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'BREAK' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Break
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={resetTimer}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>

                        <Button
                            size="lg"
                            className="w-32 rounded-full"
                            onClick={toggleTimer}
                        >
                            {isActive ? (
                                <>
                                    <Pause className="w-4 h-4 mr-2" /> Pause
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" /> Start
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
