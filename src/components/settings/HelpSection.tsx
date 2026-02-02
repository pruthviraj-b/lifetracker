import React from 'react';
import { HelpCircle, MessageCircle, FileQuestion, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';

export function HelpSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Help & Support</h2>
                <p className="text-sm text-muted-foreground">Get help, report bugs, or send feedback.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 border rounded-xl space-y-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <FileQuestion className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">FAQ</h3>
                        <p className="text-sm text-muted-foreground mt-1">Browse frequently asked questions and tutorials.</p>
                    </div>
                </div>

                <div className="p-6 border rounded-xl space-y-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Contact Support</h3>
                        <p className="text-sm text-muted-foreground mt-1">Chat with our support team for personalized help.</p>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl space-y-4">
                <h3 className="font-semibold">Send Feedback</h3>
                <textarea
                    className="w-full p-3 rounded-lg border bg-background min-h-[100px]"
                    placeholder="Tell us what you love or what we could improve..."
                />
                <Button>Submit Feedback</Button>
            </div>

            <div className="text-center pt-8">
                <p className="text-xs text-muted-foreground">Version 1.0.0 (Build 2026.02.02)</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="#" className="text-xs text-primary hover:underline">Release Notes</a>
                    <a href="#" className="text-xs text-primary hover:underline">Privacy Policy</a>
                </div>
            </div>
        </div>
    );
}
