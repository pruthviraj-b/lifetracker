import React, { useState } from 'react';
import { Shield, Key, LogOut, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

export function AccountSection() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    const handlePasswordUpdate = async () => {
        if (!passwords.new || !passwords.confirm) {
            showToast("Please enter new password", "error");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showToast("Passwords do not match", "error");
            return;
        }
        if (passwords.new.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        setLoading(true);
        try {
            await AuthService.updatePassword(passwords.new);
            showToast("Password updated successfully", "success");
            setPasswords({ new: '', confirm: '' });
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Failed to update password", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-xl font-semibold mb-1">Account & Security</h2>
                <p className="text-sm text-muted-foreground">Protect your account and manage login sessions.</p>
            </div>

            {/* Password Change */}
            <section className="space-y-4 p-6 bg-card border rounded-xl">
                <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Change Password
                </h3>
                <div className="grid gap-4 max-w-md">
                    {/* Note: Standard Supabase auth doesn't require "current" password for updates if logged in, 
                        but good practice to re-auth in sensitive apps. For simple flow, we update directly. */}
                    <Input
                        type="password"
                        placeholder="New Password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    />
                    <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    />
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handlePasswordUpdate}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </section>

            {/* 2FA */}
            <section className="space-y-4 p-6 bg-card border rounded-xl opacity-60 pointer-events-none">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline">Coming Soon</Button>
                </div>
            </section>

            {/* Danger Zone */}
            <div className="pt-8 border-t">
                <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
                <div className="flex flex-col gap-3">
                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => AuthService.logout()}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out of all devices
                    </Button>
                </div>
            </div>
        </div>
    );
}
