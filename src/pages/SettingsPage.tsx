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

export default function SettingsPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);

    const menuItems: { id: SettingsTab; label: string; icon: React.ReactNode; group: string; description: string }[] = [
        { id: 'profile', label: 'My Profile', icon: <User className="w-6 h-6" />, group: 'Account', description: 'Manage your biological identity and public presence.' },
        { id: 'account', label: 'Security & Login', icon: <Shield className="w-6 h-6" />, group: 'Account', description: 'Update encryption keys and access protocols.' },
        { id: 'billing', label: 'Billing & Plan', icon: <CreditCard className="w-6 h-6" />, group: 'Account', description: 'Manage credit allocation and subscription status.' },
        { id: 'preferences', label: 'Appearance', icon: <Layout className="w-6 h-6" />, group: 'App Settings', description: 'Adjust visual interfaces and neuro-theming.' },
        { id: 'habits', label: 'Habit Config', icon: <Settings className="w-6 h-6" />, group: 'App Settings', description: 'Configure behavioral tracking parameters.' },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-6 h-6" />, group: 'App Settings', description: 'Manage neural alerts and timing.' },
        { id: 'stats', label: 'Statistics', icon: <PieChart className="w-6 h-6" />, group: 'Data', description: 'Review system performance and biometric data.' },
        { id: 'goals', label: 'Goals', icon: <Target className="w-6 h-6" />, group: 'Data', description: 'Set long-term objective directives.' },
        { id: 'connections', label: 'Integrations', icon: <LinkIcon className="w-6 h-6" />, group: 'Data', description: 'Sync with external data banks and tools.' },
        { id: 'data', label: 'Data & Export', icon: <Database className="w-6 h-6" />, group: 'Data', description: 'Manage local data and cloud redundancy.' },
        { id: 'privacy', label: 'Privacy', icon: <Shield className="w-6 h-6" />, group: 'Legal', description: 'View data protection protocols.' },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle className="w-6 h-6" />, group: 'Support', description: 'Access documentation and tech support.' },
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
        <div className={`min-h-screen bg-background text-foreground p-6 md:p-12 space-y-12 relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : ''}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            {/* Back Button & Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className={`rounded-full w-12 h-12 p-0 bg-white/5 border border-white/10 ${isWild ? 'rounded-none border-2 border-primary' : ''}`}
                    onClick={() => activeTab ? setActiveTab(null) : navigate('/home')}
                >
                    {activeTab ? <X className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                </Button>
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase relative inline-block">
                        System Configuration
                        <span className="absolute -top-4 -right-12 opacity-20 rotate-12">
                            <Settings className="w-16 h-16" />
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-70 mt-4">
                        {activeTab
                            ? `Modifying Protocol: ${menuItems.find(i => i.id === activeTab)?.label}`
                            : 'Select a system module to reconfigure core protocols'
                        }
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!activeTab ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-24"
                    >
                        {menuItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                onClick={() => setActiveTab(item.id)}
                                className="group relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 cursor-pointer hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] transition-all duration-500 overflow-hidden"
                            >
                                {/* Abstract Cyber Background */}
                                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }}
                                />

                                <div className="relative z-10 space-y-4">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                                        ${isWild ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/5 border border-white/10 text-white group-hover:bg-primary group-hover:text-white'}
                                    `}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                            {item.label}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed mt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between text-[10px] font-mono opacity-50">
                                        <span>PROTOCOL.{item.id.toUpperCase()}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Logout Card */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            onClick={() => logout()}
                            className="col-span-1 md:col-span-2 lg:col-span-3 mt-8 border-2 border-dashed border-red-500/20 rounded-3xl p-12 text-center group cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all"
                        >
                            <LogOut className="w-12 h-12 mx-auto mb-4 text-red-500 group-hover:scale-125 transition-transform" />
                            <h3 className="text-2xl font-black uppercase text-red-500">Terminate Session</h3>
                            <p className="text-xs font-bold text-red-500/60 uppercase tracking-widest mt-2">Disconnect from neural network and clear cache</p>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-4xl mx-auto pb-24"
                    >
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[60vh]">
                            {/* Content Header (Mobile) */}
                            <div className="flex md:hidden items-center gap-4 mb-8 pb-8 border-b border-white/5">
                                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                    {menuItems.find(i => i.id === activeTab)?.icon}
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">
                                    {menuItems.find(i => i.id === activeTab)?.label}
                                </h2>
                            </div>

                            {renderContent()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
