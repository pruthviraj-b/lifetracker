import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Shield, Bell, CreditCard, Layout, Link as LinkIcon,
    PieChart, HelpCircle, Database, LogOut, Menu, X, Target, Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Home } from 'lucide-react';

// Import Sections
import { ProfileSection } from '../components/settings/ProfileSection';
import { AccountSection } from '../components/settings/AccountSection';
import { PreferencesSection } from '../components/settings/PreferencesSection';
import { NotificationSettingsSection } from '../components/settings/NotificationSettingsSection';
import { PrivacySection } from '../components/settings/PrivacySection';
import { BillingSection } from '../components/settings/BillingSection';
import { ConnectionsSection } from '../components/settings/ConnectionsSection';
import { ProfileStatsSection } from '../components/settings/ProfileStatsSection';
import { HelpSection } from '../components/settings/HelpSection';
import { DataSection } from '../components/settings/DataSection';
import { HabitSettingsSection } from '../components/settings/HabitSettingsSection';
import { GoalsSection } from '../components/settings/GoalsSection';

type SettingsTab =
    | 'profile' | 'account' | 'preferences' | 'notifications'
    | 'privacy' | 'billing' | 'connections' | 'stats'
    | 'help' | 'data' | 'habits' | 'goals';

import { ThemedCard } from '../components/ui/ThemedCard';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);

    const menuItems: { id: SettingsTab; label: string; icon: React.ReactNode; group: string; description: string }[] = [
        { id: 'profile', label: 'My Profile', icon: <User className="w-5 h-5" />, group: 'Account', description: 'Manage your biological identity.' },
        { id: 'account', label: 'Security & Login', icon: <Shield className="w-5 h-5" />, group: 'Account', description: 'Update encryption keys.' },
        { id: 'preferences', label: 'Appearance', icon: <Layout className="w-5 h-5" />, group: 'App Settings', description: 'Adjust neuro-theming.' },
        { id: 'habits', label: 'Habit Config', icon: <Settings className="w-5 h-5" />, group: 'App Settings', description: 'Configure behavioral tracking.' },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, group: 'App Settings', description: 'Manage neural alerts.' },
        { id: 'stats', label: 'Statistics', icon: <PieChart className="w-5 h-5" />, group: 'Data', description: 'Review system performance.' },
        { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" />, group: 'Data', description: 'Set long-term directives.' },
        { id: 'connections', label: 'Integrations', icon: <LinkIcon className="w-5 h-5" />, group: 'Data', description: 'Sync with external banks.' },
        { id: 'data', label: 'Data & Export', icon: <Database className="w-5 h-5" />, group: 'Data', description: 'Manage local data.' },
        { id: 'privacy', label: 'Privacy', icon: <Shield className="w-5 h-5" />, group: 'Legal', description: 'View protection protocols.' },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" />, group: 'Support', description: 'Access tech support.' },
    ];

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as SettingsTab;
        if (tab && menuItems.some(item => item.id === tab)) {
            setActiveTab(tab);
        }
    }, [window.location.search]);


    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSection />;
            case 'account': return <AccountSection />;
            case 'billing': return <BillingSection />;
            case 'preferences': return <PreferencesSection />;
            case 'habits': return <HabitSettingsSection />;
            case 'notifications': return <NotificationSettingsSection />;
            case 'stats': return <ProfileStatsSection />;
            case 'goals': return <GoalsSection />;
            case 'connections': return <ConnectionsSection />;
            case 'data': return <DataSection />;
            case 'privacy': return <PrivacySection />;
            case 'help': return <HelpSection />;
            default: return null;
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2 border-primary/20' : ''}`}
                        onClick={() => activeTab ? setActiveTab(null) : navigate('/')}
                    >
                        {activeTab ? <X className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                    </Button>
                    <div>
                        <h1 className={`text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>System_Config</h1>
                        <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-[0.3em] opacity-60">Neural Protocol Configuration</p>
                    </div>
                </div>

                {activeTab && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4">
                        Modifying Node: {activeTab.toUpperCase()}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {!activeTab ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {menuItems.map((item, idx) => (
                            <ThemedCard
                                key={item.id}
                                interactive
                                onClick={() => setActiveTab(item.id)}
                                className="group h-full flex flex-col p-6 space-y-4"
                            >
                                <div className={`
                                    w-12 h-12 flex items-center justify-center transition-all
                                    ${isWild ? 'rounded-none border-2 border-primary/20 text-primary' : 'rounded-2xl bg-primary/10 border border-primary/20 text-primary'}
                                `}>
                                    {item.icon}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {item.label}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed opacity-60">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="pt-4 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-40 border-t border-primary/5">
                                    <span>PROTOCOL.{item.id.toUpperCase()}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </ThemedCard>
                        ))}

                        {/* Terminate Session Node */}
                        <ThemedCard
                            onClick={() => logout()}
                            className="col-span-full md:col-span-2 lg:col-span-3 xl:col-span-4 mt-8 flex flex-col items-center justify-center p-12 text-center group border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5"
                        >
                            <LogOut className="w-10 h-10 mb-4 text-red-500 group-hover:scale-125 transition-transform" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-red-500">Terminate_Session</h3>
                            <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mt-2 max-w-sm">
                                Disconnect from neural network and purge local encryption keys.
                            </p>
                        </ThemedCard>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto"
                    >
                        <ThemedCard className="p-8 md:p-12 min-h-[60vh] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                            <div className="md:hidden flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    {menuItems.find(i => i.id === activeTab)?.icon}
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">
                                    {menuItems.find(i => i.id === activeTab)?.label}
                                </h2>
                            </div>

                            {renderContent()}
                        </ThemedCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
