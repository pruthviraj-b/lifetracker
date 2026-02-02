import React from 'react';
import { Trophy, Flame, CheckCircle, Target, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ProfileStatsSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Statistics & Overview</h2>
                <p className="text-sm text-muted-foreground">Your journey in numbers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-orange-600">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Current Streak</span>
                    </div>
                    <div className="text-2xl font-bold">12 Days</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Total Done</span>
                    </div>
                    <div className="text-2xl font-bold">148</div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Target className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Active Habits</span>
                    </div>
                    <div className="text-2xl font-bold">6</div>
                </div>
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-purple-600">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Level 5</span>
                    </div>
                    <div className="text-2xl font-bold">2,450 XP</div>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity Summary
                </h3>
                <div className="space-y-4">
                    {/* Activity Item Mock */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 text-sm">
                            <div className="mt-1 w-2 h-2 rounded-full bg-primary" />
                            <div>
                                <p className="font-medium">Completed "Check Emails"</p>
                                <p className="text-muted-foreground text-xs">Today, 9:00 AM</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
