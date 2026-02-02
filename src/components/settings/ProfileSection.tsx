import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Phone, UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function ProfileSection() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    // Sync state when user loads
    useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await updateProfile({ name });
            showToast("Profile updated successfully", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to update profile", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-xl font-semibold mb-1">User Information</h2>
                <p className="text-sm text-muted-foreground">Manage your personal details and public profile.</p>
            </div>

            <div className="flex items-center gap-6 p-6 bg-card border rounded-xl">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold uppercase overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">Member since {new Date().getFullYear()}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <div className="relative">
                        <UserCircle className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={name.toLowerCase().replace(/\s+/g, '')}
                            disabled
                            className="pl-9 bg-muted/50"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input value={user?.email || ''} className="pl-9" disabled />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="+1 (555) 000-0000" className="pl-9" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    placeholder="Tell us a little about yourself..."
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
