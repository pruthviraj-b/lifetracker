
import React, { useState, useEffect } from 'react';
import { Quote } from '../../types/achievement';
import { Sparkles, Quote as QuoteIcon } from 'lucide-react';

const QUOTES: Quote[] = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
];

export function QuoteWidget() {
    const [quote, setQuote] = useState<Quote>(QUOTES[0]);

    useEffect(() => {
        // Pick one based on date so it persists for the day
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);
    }, []);

    return (
        <div className="relative p-6 rounded-xl bg-card border overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <QuoteIcon className="w-16 h-16 text-primary" />
            </div>

            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Daily Motivation
                </div>
                <blockquote className="text-lg font-medium leading-relaxed">
                    "{quote.text}"
                </blockquote>
                <cite className="text-sm text-muted-foreground not-italic mt-1">
                    — {quote.author}
                </cite>
            </div>
        </div>
    );
}
