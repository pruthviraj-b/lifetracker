import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AIAssistant, ChatSessionState, createEmptySession } from '../../chat/AIAssistant';
import { ChatMessage as ChatMessageType, ChatAction } from '../../chat/chatTypes';
import { ChatMessage } from './ChatMessage';
import { EMOJI } from '../../chat/chatUtils';
import './Chat.css';

const historyKey = (userId?: string) => `ritu.chat.history.${userId || 'guest'}`;
const sessionKey = (userId?: string) => `ritu.chat.session.${userId || 'guest'}`;

const loadHistory = (userId?: string): ChatMessageType[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(historyKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const loadSession = (userId?: string): ChatSessionState => {
    if (typeof localStorage === 'undefined') return createEmptySession();
    try {
        const raw = localStorage.getItem(sessionKey(userId));
        return raw ? JSON.parse(raw) : createEmptySession();
    } catch {
        return createEmptySession();
    }
};

export const ChatComponent: React.FC = () => {
    const { user } = useAuth();
    const assistantRef = useRef(new AIAssistant());
    const [messages, setMessages] = useState<ChatMessageType[]>(() => loadHistory(user?.id));
    const [session, setSession] = useState<ChatSessionState>(() => loadSession(user?.id));
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: `welcome-${Date.now()}`,
                    role: 'assistant',
                    text: `${EMOJI.spark} Hi${user?.name ? ` ${user.name}` : ''}! I can create, edit, and track everything right here. What would you like to do first?`,
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    }, []);

    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(historyKey(user?.id), JSON.stringify(messages));
    }, [messages, user?.id]);

    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(sessionKey(user?.id), JSON.stringify(session));
    }, [session, user?.id]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMessage: ChatMessageType = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            role: 'user',
            text,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const result = await assistantRef.current.handleInput(text, session, {
                userId: user?.id,
                userName: user?.name
            });

            setMessages(prev => [...prev, ...result.messages]);
            setSession(result.session);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    text: `${EMOJI.warning} Something went wrong. Please try again.`,
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAction = (action: ChatAction) => {
        sendMessage(action.value);
    };

    return (
        <div className="chat-shell">
            <div className="chat-header">
                <div>
                    <div className="chat-title">RITU Chat Assistant</div>
                    <div className="chat-subtitle">Create, manage, and track everything by conversation.</div>
                </div>
                <div className="chat-status">
                    <span className="chat-status-dot" />
                    Online
                </div>
            </div>

            <div className="chat-thread">
                {messages.map(message => (
                    <ChatMessage key={message.id} message={message} onAction={handleAction} />
                ))}
                {isTyping && (
                    <div className="chat-message chat-message-assistant">
                        <div className="chat-bubble chat-bubble-assistant">
                            <div className="chat-typing">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form
                className="chat-input-bar"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                }}
            >
                <input
                    className="chat-input"
                    placeholder="Type a command or ask for help..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(input);
                        }
                    }}
                />
                <button type="submit" className="chat-send" disabled={!input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};
