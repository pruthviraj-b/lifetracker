import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems: { id: SettingsTab; label: string; icon: React.ReactNode; group: string }[] = [
        // Group 1: Account
        { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" />, group: 'Account' },
        { id: 'account', label: 'Security & Login', icon: <Shield className="w-4 h-4" />, group: 'Account' },
        { id: 'billing', label: 'Billing & Plan', icon: <CreditCard className="w-4 h-4" />, group: 'Account' },

        // Group 2: App
        { id: 'preferences', label: 'Appearance', icon: <Layout className="w-4 h-4" />, group: 'App Settings' },
        { id: 'habits', label: 'Habit Config', icon: <Settings className="w-4 h-4" />, group: 'App Settings' },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, group: 'App Settings' },

        // Group 3: Data & Integrations
        { id: 'stats', label: 'Statistics', icon: <PieChart className="w-4 h-4" />, group: 'Data' },
        { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" />, group: 'Data' },
        { id: 'connections', label: 'Integrations', icon: <LinkIcon className="w-4 h-4" />, group: 'Data' },
        { id: 'data', label: 'Data & Export', icon: <Database className="w-4 h-4" />, group: 'Data' },

        // Group 4: Other
        { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" />, group: 'Legal' },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle className="w-4 h-4" />, group: 'Support' },
    ];

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
            default: return <ProfileSection />;
        }
    };

    // Group items for sidebar
    const groupedItems = menuItems.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof menuItems>);

    return (
        <div className={`flex h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'} overflow-hidden`}>
            {isWild && <div className="vignette pointer-events-none" />}


            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-xl md:shadow-none
                transform transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Button variant="ghost" size="sm" className="p-0 h-auto md:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <span className={isWild ? 'animate-glitch uppercase tracking-tighter' : ''}>Settings</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    {Object.entries(groupedItems).map(([group, items]) => (
                        <div key={group}>
                            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</h3>
                            <div className="space-y-1">
                                {items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${activeTab === item.id
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }
                                        `}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center p-4 border-b bg-card">
                    <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                        <Menu className="w-6 h-6" />
                    </Button>
                    <span className="ml-3 font-semibold">
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </span>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
