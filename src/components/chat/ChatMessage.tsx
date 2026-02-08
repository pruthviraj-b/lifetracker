import React from 'react';
import { ChatAction, ChatMessage as ChatMessageType } from '../../chat/chatTypes';

interface ChatMessageProps {
    message: ChatMessageType;
    onAction: (action: ChatAction) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onAction }) => {
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}>
            <div className={`chat-bubble ${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                <div className="chat-text">{message.text}</div>
                <div className="chat-meta">{time}</div>
            </div>

            {message.actions && message.actions.length > 0 && (
                <div className="chat-actions">
                    {message.actions.map(action => (
                        <button
                            key={action.id}
                            type="button"
                            className={`chat-action chat-action-${action.variant || 'secondary'}`}
                            onClick={() => onAction(action)}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
