import React, { useState } from 'react';
import { Lock, Eye, Users, FileText } from 'lucide-react';

export function PrivacySection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Privacy & Security</h2>
                <p className="text-sm text-muted-foreground">Control who can see your profile and activity.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-muted-foreground">Manage who can view your profile details.</p>
                        </div>
                    </div>
                    <select className="p-2 border rounded-lg bg-background text-sm">
                        <option>Public</option>
                        <option>Friends Only</option>
                        <option>Private</option>
                    </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">Social Connections</p>
                            <p className="text-sm text-muted-foreground">Allow others to find you by email.</p>
                        </div>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">Data Usage</p>
                            <p className="text-sm text-muted-foreground">Allow anonymous usage data collection.</p>
                        </div>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
            </div>
        </div>
    );
}
