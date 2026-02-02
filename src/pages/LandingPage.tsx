
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ArrowRight, Activity, Cpu, Shield, Zap } from 'lucide-react';
// import { Button } from '../components/ui/Button';

// Sound Engine using Web Audio API
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle', duration: number, vol: number = 0.1) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
};

const playHoverSound = () => {
    // High tech chirp
    playTone(800, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(1200, 'sine', 0.1, 0.03), 50);
};

const playEnterSound = () => {
    // Heavy confirm sound
    playTone(150, 'square', 0.3, 0.1);
    playTone(100, 'sawtooth', 0.5, 0.1);
};

export default function LandingPage() {
    const navigate = useNavigate();
    const [entered, setEntered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse parallax effect - Smoothed with Springs
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const xPos = (clientX / innerWidth - 0.5) * 20; // Maximum movement in px
            const yPos = (clientY / innerHeight - 0.5) * 20;
            x.set(xPos);
            y.set(yPos);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [x, y]);

    const handleEnter = () => {
        playEnterSound();
        setEntered(true);
        // Delay navigation to allow exit animation
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen bg-black text-white overflow-hidden font-cinzel selection:bg-red-500 selection:text-black"
        >
            {/* Background Grid / Noise */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

            <AnimatePresence>
                {!entered ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
                    >
                        {/* Hero Content */}
                        <motion.div
                            style={{ x: mouseX, y: mouseY }}
                            className="text-center space-y-12"
                        >
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative"
                            >
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <Activity className="w-12 h-12 text-red-500 animate-pulse" />
                                    <span className="text-xs uppercase tracking-[0.5em] text-red-500 font-bold">System Online</span>
                                </div>

                                <h1 className="text-6xl md:text-8xl font-normal tracking-[0.2em] uppercase relative group leading-tight">
                                    <span className="relative z-10">Habit</span>
                                    <br />
                                    <span className="relative z-10 text-transparent stroke-white stroke-[1px]" style={{ WebkitTextStroke: '1px white' }}>Tracker</span>
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="max-w-md mx-auto text-neutral-400 uppercase tracking-widest text-xs leading-loose"
                            >
                                <p>Optimizing human performance protocols.</p>
                                <p>Initialize sequence to synchronize neural pathways.</p>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="pt-8"
                            >
                                <button
                                    onMouseEnter={playHoverSound}
                                    onClick={handleEnter}
                                    className="group relative px-12 py-4 bg-transparent border border-white/20 hover:border-red-500/50 text-white overflow-hidden transition-all duration-300"
                                >
                                    <div className="absolute inset-0 w-0 bg-red-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10" />
                                    <div className="relative flex items-center gap-4 uppercase tracking-[0.2em] text-sm font-bold">
                                        <span>Initialize</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 group-hover:border-red-500 transition-colors" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 group-hover:border-red-500 transition-colors" />
                                </button>
                            </motion.div>
                        </motion.div>

                        {/* Floating UI Elements (Decorations) */}
                        <div className="absolute bottom-8 left-8 text-[10px] text-neutral-600 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                Server Status: Nominal
                            </div>
                            <div className="mt-2">ver 2.4.0-WILD</div>
                        </div>

                        <div className="absolute top-8 right-8 flex gap-4 text-neutral-600">
                            <Cpu className="w-5 h-5 opacity-20" />
                            <Shield className="w-5 h-5 opacity-20" />
                            <Zap className="w-5 h-5 opacity-20" />
                        </div>

                    </motion.div>
                ) : (
                    // Transition State (Optional: could show a loading bar or warp speed effect here)
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-64 h-1 bg-neutral-900 overflow-hidden relative">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-red-600"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS for scanlines or other effects if needed */}
            {/* CSS for scanlines or other effects if needed */}
            {/* <style>{`
                 // Glitch keyframes removed
            `}</style> */}
        </div >
    );
}
