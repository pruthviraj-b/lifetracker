import React from 'react';
import { ChatComponent } from '../components/chat/ChatComponent';

const ChatPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background px-6 py-8">
            <div className="max-w-5xl mx-auto">
                <ChatComponent />
            </div>
        </div>
    );
};

export default ChatPage;
