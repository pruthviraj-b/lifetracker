import React from 'react';
import { Target, Flag, TrendingUp, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function GoalsSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Goals & Milestones</h2>
                <p className="text-sm text-muted-foreground">Set targets and track your long-term progress.</p>
            </div>

            <div className="p-6 bg-card border rounded-xl space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4 text-red-500" />
                            Daily Goal
                        </h3>
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Complete 5 habits every day.</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[60%]" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>3 completed</span>
                        <span>Target: 5</span>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Flag className="w-4 h-4 text-yellow-500" />
                        Next Milestone
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border-2 border-yellow-500 text-yellow-500 font-bold text-xl">
                            30
                        </div>
                        <div>
                            <h4 className="font-bold">30 Day Streak</h4>
                            <p className="text-sm text-muted-foreground">Keep your streak alive for 30 consecutive days.</p>
                            <Button variant="ghost" size="sm" className="mt-2 h-auto p-0 text-primary hover:text-primary/80">
                                Share Progress <Share2 className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
