import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mic, Send, Zap, Activity, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RitualAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    isWild: boolean;
    onInstall?: () => void;
    isInstallable?: boolean;
}

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
                return false;
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
        response: 'Analyzing Performance Matrix.'
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
            setTimeout(() => inputRef.current?.focus(), 300);
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
            if (normalized.includes(intent.keywords[0])) score += 50;
            intent.keywords.forEach(keyword => {
                if (normalized.includes(keyword)) score += 20;
                if (words.includes(keyword)) score += 20;
            });

            if (score > bestMatch.score) {
                bestMatch = { intent, score };
            }
        });

        if (bestMatch.score >= 20 && bestMatch.intent) {
            setMessages(prev => [...prev, { role: 'assistant', text: bestMatch.intent.response, confidence: 100 }]);
            setTimeout(() => {
                const success = bestMatch.intent.action(navigate, onClose, { onInstall, isInstallable });
                if (success === false) {
                    setMessages(prev => [...prev, { role: 'assistant', text: `Protocol restricted. Hardware mismatch.` }]);
                }
            }, 800);
        } else {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: input.length > 3 ? "Command syntax unrecognizable. Check Core manual or try 'Dashboard'." : "How can I assist your workflow?",
                confidence: bestMatch.score
            }]);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        processCommand(input);
        setInput('');
    };

    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setMessages(prev => [...prev, { role: 'user', text: transcript }]);
            processCommand(transcript);
        };
        recognition.start();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Gemini-Style Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`
                            relative w-full max-w-lg mx-auto bg-[#121214] overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col
                            ${isWild ? 'rounded-none border-t-2 border-primary' : 'rounded-t-[2.5rem] border-t border-white/10'}
                        `}
                        style={{ height: '70vh' }}
                    >
                        {/* Gemini Glow Bar */}
                        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-1/2 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 blur-sm"
                            />
                        </div>

                        {/* Top Notch / Handle */}
                        <div className="flex items-center justify-center pt-4 pb-2">
                            <div className="w-12 h-1 bg-white/10 rounded-full" />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="space-y-8 mt-4">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black tracking-tighter text-white">Hey_Ritual</h2>
                                        <p className="text-muted-foreground text-sm font-medium">System ready for neural handshake.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { t: 'Open Dashboard', desc: 'Central Control Hub' },
                                            { t: 'Take a Note', desc: 'Protocol Recording' },
                                            { t: 'Start Learning', desc: 'Academy Access' }
                                        ].map(cmd => (
                                            <button
                                                key={cmd.t}
                                                onClick={() => { setInput(cmd.t); setMessages([{ role: 'user', text: cmd.t }]); processCommand(cmd.t); }}
                                                className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group"
                                            >
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-white">{cmd.t}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{cmd.desc}</div>
                                                </div>
                                                <Zap className="w-4 h-4 text-primary opacity-20 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[90%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed
                                        ${m.role === 'user'
                                            ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                                            : 'text-white bg-white/5 font-medium'
                                        }
                                    `}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Gemini Style */}
                        <div className="p-8 bg-gradient-to-t from-black/80 to-transparent">
                            <div className={`flex items-center gap-3 bg-[#1A1A1C] p-2 pr-4 shadow-2xl ${isWild ? 'rounded-none border-2 border-primary' : 'rounded-[1.5rem] border border-white/10'}`}>
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type or Ask..."
                                    className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder:text-muted-foreground/40"
                                />
                                <button
                                    onClick={toggleListening}
                                    className={`p-2 transition-all ${isListening ? 'text-blue-500 scale-125' : 'text-muted-foreground hover:text-white'}`}
                                >
                                    <Mic className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
