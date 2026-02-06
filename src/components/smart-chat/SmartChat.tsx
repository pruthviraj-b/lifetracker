import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, X, ChevronRight, HelpCircle, ArrowUpRight } from 'lucide-react';
import smartChatAnalyzer, { ChatAction, ChatLink, ChatAnalysis } from '../../utils/smartChatAnalyzer';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
    actions?: ChatAction[];
    links?: ChatLink[];
    help?: string | null;
    timestamp: Date;
}

export const SmartChat = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: Date.now(),
                    type: 'bot',
                    content: "Hello. I am your RITU AI Assistant. How can I optimize your workflow today?",
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        const currentInput = input;
        setInput('');

        // Simulate network delay for realism
        setTimeout(() => {
            try {
                const analysis = smartChatAnalyzer.analyzeMessage(currentInput);
                const response = createResponse(analysis);

                const botMessage: Message = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: response.text,
                    actions: analysis.actions,
                    links: analysis.suggestedLinks,
                    help: analysis.contextualHelp,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, botMessage]);
            } catch (error) {
                console.error('Chat error:', error);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: "I encountered a neural error processing that request. Please try again.",
                    timestamp: new Date()
                }]);
            } finally {
                setLoading(false);
            }
        }, 800);
    };

    const createResponse = (analysis: ChatAnalysis) => {
        const { intents } = analysis;
        let text = '';

        if (!intents || intents.length === 0) {
            text = "I'm interpreting... Could you clarify? I specialize in habits, reminders, tasks, and system analytics.";
        } else {
            const mainIntent = intents[0];
            switch (mainIntent.type) {
                case 'greeting':
                    text = `Greetings, User. I am RITU. How may I assist your optimization today?`;
                    break;
                case 'habit':
                    text = mainIntent.action === 'create'
                        ? `Initiating habit creation protocol. What ritual shall we establish?`
                        : `Accessing your daily rituals. Visualization active.`;
                    break;
                case 'reminder':
                    text = mainIntent.action === 'create'
                        ? `I can set that reminder. When should I alert you?`
                        : `Reminder modified.`;
                    break;
                case 'task':
                    text = mainIntent.action === 'create'
                        ? `Task definition received. Ready to log.`
                        : `Task marked complete. Efficiency increased.`;
                    break;
                case 'course':
                    text = `Accessing Learning Management System modules...`;
                    break;
                case 'analytics':
                    text = `Scanning performance metrics... Here is your data.`;
                    break;
                default:
                    text = 'How can I assist you further?';
            }
        }

        return { text };
    };

    const handleActionClick = (action: ChatAction) => {
        // Here we would hook into the actual app logic (e.g. open modals)
        // For now, we'll simulate the response or navigate
        console.log('Action triggered:', action);

        // If it's a dialog handler, we might need a context to open global modals
        // For this demo, we'll reply as the bot
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: `Opening ${action.label}... (Feature Integration Pending)`,
            timestamp: new Date()
        }]);
    };

    const handleLinkClick = (url: string) => {
        navigate(url);
        if (window.innerWidth < 768) {
            onClose(); // Close chat on mobile navigation
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100] backdrop-blur-xl"
            >
                {/* Header */}
                <div className="bg-primary/5 p-4 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">RITU Assistant</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Online</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.type === 'bot' && (
                                <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                                    <Bot className="w-3.5 h-3.5 text-foreground/70" />
                                </div>
                            )}

                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-secondary/80 text-foreground border border-border/50 rounded-tl-sm'
                                    }`}>
                                    {msg.content}
                                </div>

                                {/* Bot Extras (Actions, Links, Help) */}
                                {msg.type === 'bot' && (
                                    <div className="space-y-2">
                                        {msg.help && (
                                            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-600 dark:text-yellow-400">
                                                <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                <span>{msg.help}</span>
                                            </div>
                                        )}

                                        {msg.actions && msg.actions.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {msg.actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleActionClick(action)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium hover:bg-secondary hover:border-primary/30 transition-all text-foreground/80 hover:text-primary"
                                                    >
                                                        <span>{action.icon}</span>
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {msg.links && msg.links.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                                {msg.links.map((link, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleLinkClick(link.url)}
                                                        className="flex items-center justify-between w-full px-3 py-2 bg-secondary/30 hover:bg-secondary border border-transparent hover:border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{link.icon}</span>
                                                            <span className="font-medium">{link.label}</span>
                                                        </div>
                                                        <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.type === 'user' && (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                                <Bot className="w-3.5 h-3.5 text-foreground/70" />
                            </div>
                            <div className="p-3 bg-secondary/80 rounded-2xl rounded-tl-sm border border-border/50">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-3 bg-background border-t border-border">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask RITU..."
                            className="w-full bg-secondary/50 border border-border focus:border-primary/50 text-sm rounded-xl py-3 pl-4 pr-12 outline-none transition-all placeholder:text-muted-foreground/50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </motion.div>
        </AnimatePresence>
    );
};
