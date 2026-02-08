import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, StickyNote, BookOpen, TrendingUp,
    Trophy, Share2, Settings, LogOut, Home, Menu, X, Globe,
    Activity, Zap, Youtube, Download, Eye, Camera, Plus, Search,
    Bell, User
} from 'lucide-react';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedSearch } from '../ui/AdvancedSearch';
import { RitualAssistant } from './RitualAssistant';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    category: 'Main' | 'Growth' | 'System';
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Chats', path: '/chat', icon: <Globe className="w-5 h-5" />, category: 'Main' },
    { label: 'Protocols', path: '/protocols', icon: <Activity className="w-5 h-5" />, category: 'Main' },
    { label: 'Knowledge Base', path: '/notes', icon: <StickyNote className="w-5 h-5" />, category: 'Main' },
    { label: 'Schedule', path: '/reminders', icon: <Bell className="w-5 h-5" />, category: 'Main' },
    { label: 'Academy', path: '/courses', icon: <BookOpen className="w-5 h-5" />, category: 'Main' },
    { label: 'Recall', path: '/recall', icon: <Zap className="w-5 h-5" />, category: 'Main' },
    { label: 'Metrics', path: '/analytics', icon: <TrendingUp className="w-5 h-5" />, category: 'Main' },
    { label: 'Library', path: '/youtube', icon: <Youtube className="w-5 h-5" />, category: 'Main' },
    { label: 'Network', path: '/network', icon: <Share2 className="w-5 h-5" />, category: 'Main' },
    { label: 'Achievements', path: '/achievements', icon: <Trophy className="w-5 h-5" />, category: 'System' },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, category: 'System' },
];


export const SidebarNavigation = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const { isInstallable, installApp } = usePWA();

    const groupedItems = NAV_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4 lg:p-6 relative">
            {isSearchOpen && <AdvancedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}

            {/* Branding - RITU OS */}
            <div className="mb-8 flex items-center justify-between px-2">
                <div onClick={() => navigate('/home')} className="cursor-pointer group">
                    <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                        RITU OS
                    </h1>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Advanced Search (Cmd+K)"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-foreground/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* "New Session" Style Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-secondary border border-border/50 text-foreground/80 hover:bg-secondary/70 transition-all font-medium text-sm mb-6"
            >
                <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                    <Plus className="w-4 h-4 text-foreground/60" />
                </div>
                <span>New Session</span>
            </button>

            <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? 'active-nav-item'
                                    : 'hover:bg-secondary/50 text-foreground/60 hover:text-foreground'
                                }
                            `}
                        >
                            <div className={`transition-colors duration-200 ${isActive ? 'text-foreground' : 'group-hover:text-foreground/80'}`}>
                                {item.icon}
                            </div>
                            <span className="text-sm font-medium font-mono tracking-tight">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>

            <div className="mt-auto pt-8 border-t border-border space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                        {user?.name?.substring(0, 1).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-foreground truncate">{user?.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]" />
                            Active Session
                        </div>
                    </div>
                </div>

                {isInstallable && (
                    <button
                        onClick={installApp}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-secondary text-foreground hover:bg-secondary/70 font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <Download className="w-4 h-4" /> Install Application
                    </button>
                )}

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-2xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                    <LogOut className="w-4 h-4" /> Log Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            <MobileNav onOpenMenu={() => setIsOpen(true)} />

            <RitualAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                isWild={false}
                onInstall={installApp}
                isInstallable={isInstallable}
            />

            <div className="hidden md:block fixed top-0 left-0 h-screen w-64 border-r border-border bg-background z-40">
                <SidebarContent />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 left-0 h-screen w-72 bg-background border-r border-border z-50 md:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
