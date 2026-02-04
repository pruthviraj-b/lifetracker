import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mic, Send, MessageSquare, Zap, Target,
    BookOpen, LayoutDashboard, StickyNote, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RitualAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    isWild: boolean;
    onInstall?: () => void;
    isInstallable?: boolean;
}


// ... imports remain the same ...

const INTENTS = [
    {
        id: 'NAV_NOTES',
        keywords: ['note', 'write', 'journal', 'idea', 'jot', 'record', 'take note'],
        action: (navigate: any, close: any) => { navigate('/notes'); close(); },
        response: 'Opening Neural Notes Protocol.'
    },
    {
        id: 'NAV_DASHBOARD',
        keywords: ['dashboard', 'home', 'flow', 'main', 'hub', 'panel', 'overview', 'start'],
        action: (navigate: any, close: any) => { navigate('/dashboard'); close(); },
        response: 'Navigating to Central Flow.'
    },
    {
        id: 'NAV_SETTINGS',
        keywords: ['setting', 'config', 'preference', 'system', 'option', 'adjust', 'control'],
        action: (navigate: any, close: any) => { navigate('/settings'); close(); },
        response: 'Accessing System Configuration.'
    },
    {
        id: 'NAV_ACADEMY',
        keywords: ['study', 'learn', 'course', 'python', 'academy', 'class', 'lesson', 'teach', 'education'],
        action: (navigate: any, close: any) => { navigate('/courses'); close(); },
        response: 'Initializing Learning Module.'
    },
    {
        id: 'ACT_CREATE_HABIT',
        keywords: ['create', 'new', 'habit', 'add', 'start', 'form', 'build', 'track'],
        action: (navigate: any, close: any) => { navigate('/dashboard?action=create'); close(); },
        response: 'Initiating New Protocol Sequence.'
    },
    {
        id: 'ACT_INSTALL',
        keywords: ['install', 'app', 'download', 'pwa', 'mobile', 'phone', 'offline'],
        action: (navigate: any, close: any, props: any) => {
            if (props.onInstall && props.isInstallable) {
                props.onInstall();
                close();
            } else {
                return false; // Action failed
            }
        },
        response: 'Executing Installation Sequence.'
    },
    {
        id: 'NAV_DATA',
        keywords: ['export', 'import', 'data', 'backup', 'save', 'json', 'transfer'],
        action: (navigate: any, close: any) => { navigate('/settings?tab=data'); close(); },
        response: 'Opening Data Vault.'
    },
    {
        id: 'NAV_STATS',
        keywords: ['stat', 'profile', 'level', 'chart', 'graph', 'progress', 'rank', 'xp'],
        action: (navigate: any, close: any) => { navigate('/settings?tab=stats'); close(); },
        response: 'Analyzing Biometric Performance.'
    }
];

export const RitualAssistant: React.FC<RitualAssistantProps> = ({ isOpen, onClose, isWild, onInstall, isInstallable }) => {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string, confidence?: number }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const processCommand = (rawCommand: string) => {
        const normalized = rawCommand.toLowerCase().trim();
        const words = normalized.split(/\s+/);

        let bestMatch = { intent: null as any, score: 0 };

        INTENTS.forEach(intent => {
            let score = 0;
            // 1. Exact match bonus
            if (normalized.includes(intent.keywords[0])) score += 50;

            // 2. Keyword density analysis
            intent.keywords.forEach(keyword => {
                if (normalized.includes(keyword)) score += 20;
                // Bonus for exact word match vs substring
                if (words.includes(keyword)) score += 10;
            });

            if (score > bestMatch.score) {
                bestMatch = { intent, score };
            }
        });

        // Threshold for action (tune this)
        if (bestMatch.score >= 20 && bestMatch.intent) {
            const success = bestMatch.intent.action(navigate, onClose, { onInstall, isInstallable });
            if (success !== false) {
                // Action succeeded (navigation usually closes modal, but for feedback we might want to delay slightly if not closing)
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: `Protocol '${bestMatch.intent.id}' unavailable in current state.`,
                    confidence: Math.min(bestMatch.score, 100)
                }]);
            }
        } else {
            // General AI Fallback or Help
            if (normalized.includes('help') || normalized.includes('what')) {
                setMessages(prev => [...prev, { role: 'assistant', text: 'Commands: Install, Note, Create, Study, Data, Stats.', confidence: 100 }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: `Command hazy. Reliability: ${bestMatch.score}%. Try rephrasing with key verb (e.g. "Create", "Go").`,
                    confidence: bestMatch.score
                }]);
            }
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        processCommand(input);
        setInput('');
    };

    // Voice recognition (Web Speech API)
    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setMessages(prev => [...prev, { role: 'assistant', text: "HARDWARE ERROR: Audio Input Module Missing." }]);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            setIsListening(false);
            setMessages(prev => [...prev, { role: 'assistant', text: `SENSOR MALFUNCTION: ${event.error}` }]);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput('');
            setMessages(prev => [...prev, { role: 'user', text: transcript }]);
            processCommand(transcript);
        };

        if (isListening) recognition.stop();
        else recognition.start();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
                >
                    {/* Simplified Backdrop for speed */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Assistant Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.2 }} // Fast, snappy transition
                        className={`
                            relative w-full max-w-2xl bg-[#09090b] border-2 overflow-hidden shadow-2xl flex flex-col
                            ${isWild ? 'border-primary rounded-none' : 'border-white/10 rounded-3xl'}
                        `}
                        style={{ height: '600px', maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${isWild ? 'bg-primary text-black' : 'bg-white/10 text-white'} rounded-lg`}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <h2 className="text-lg font-black uppercase tracking-tighter">Ritual <span className="text-primary">Core</span></h2>
                                    <div className="text-[10px] text-muted-foreground font-mono uppercase">System V2.2 // Ready</div>
                                </div>
                            </div>
                            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Messages Area - Terminal Style */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar font-mono text-sm">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                    <p className="mb-4 text-xs font-bold uppercase tracking-widest">Awaiting Input...</p>
                                    <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                                        {['Create Habit', 'Open Stats', 'Install App', 'Go to Academy'].map(cmd => (
                                            <button
                                                key={cmd}
                                                onClick={() => processCommand(cmd)}
                                                className="px-3 py-1 border border-white/20 rounded text-[10px] hover:bg-white/10 hover:border-white/50 transition-all"
                                            >
                                                {cmd}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] p-3 text-xs md:text-sm
                                        ${m.role === 'user'
                                            ? 'text-right text-primary'
                                            : 'text-left text-foreground bg-white/5 border-l-2 border-white/20 pl-4'
                                        }
                                    `}>
                                        <p className="leading-relaxed">{m.text}</p>
                                        {m.confidence !== undefined && (
                                            <div className="mt-1 text-[9px] opacity-40 uppercase tracking-widest">
                                                Reliability: {m.confidence}%
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Sharper */}
                        <div className="p-4 bg-black/50 border-t border-white/5">
                            <div className={`flex items-center gap-2 border p-1 pr-2 ${isWild ? 'border-primary' : 'border-white/20 rounded-lg'} bg-black transition-colors focus-within:border-primary/70`}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Execute command..."
                                    className="flex-1 bg-transparent border-none outline-none p-3 text-sm font-bold font-mono tracking-wide text-foreground placeholder:text-muted-foreground/50"
                                />
                                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                                <button
                                    onClick={toggleListening}
                                    className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSend}
                                    className={`p-2 ${isWild ? 'text-primary' : 'text-white'} hover:scale-110 transition-transform`}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
