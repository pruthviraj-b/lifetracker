import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, StickyNote, BookOpen, TrendingUp,
    Trophy, Share2, Settings, LogOut, Home, Menu, X, Globe,
    Activity, Zap, Youtube, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';
import { RitualAssistant } from './RitualAssistant';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    category: 'Main' | 'Growth' | 'System';
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, category: 'Main' },
    { label: 'Protocols', path: '/protocols', icon: <Activity className="w-5 h-5" />, category: 'Main' },
    { label: 'Neural Notes', path: '/notes', icon: <StickyNote className="w-5 h-5" />, category: 'Main' },
    { label: 'Neural Recall', path: '/recall', icon: <Zap className="w-5 h-5" />, category: 'Main' },
    { label: 'Academy', path: '/courses', icon: <BookOpen className="w-5 h-5" />, category: 'Growth' },
    { label: 'Video Tracker', path: '/youtube', icon: <Youtube className="w-5 h-5" />, category: 'Growth' },
    { label: 'Analytics', path: '/analytics', icon: <TrendingUp className="w-5 h-5" />, category: 'Growth' },
    { label: 'Network', path: '/network', icon: <Share2 className="w-5 h-5" />, category: 'Growth' },
    { label: 'Achievements', path: '/achievements', icon: <Trophy className="w-5 h-5" />, category: 'System' },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, category: 'System' },
];

const FloatingAssistant = ({ onOpenMenu, onOpenAssistant, isWild, navigate, location }: any) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isLongPressing, setIsLongPressing] = React.useState(false);
    const [isPressing, setIsPressing] = React.useState(false); // New state for immediate feedback
    const containerRef = React.useRef<HTMLDivElement>(null);
    const ballRef = React.useRef<HTMLDivElement>(null);
    const [alignment, setAlignment] = React.useState({ x: 'center', y: 'bottom' });
    const timerRef = React.useRef<any>(null);
    const wasLongPressRef = React.useRef(false);

    const handlePointerDown = () => {
        setIsPressing(true); // Start visual charge immediately
        wasLongPressRef.current = false;
        timerRef.current = setTimeout(() => {
            setIsLongPressing(true); // Trigger actua logic
            wasLongPressRef.current = true;
            // Optional: Vibrate if supported
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPressing(false); // Stop visual charge
        if (isLongPressing) {
            e.preventDefault();
            onOpenAssistant();
        }
        clearTimeout(timerRef.current);
        setIsLongPressing(false);
    };

    const handleDragStart = () => {
        setIsPressing(false); // Cancel charge on drag
        clearTimeout(timerRef.current);
        setIsLongPressing(false);
        wasLongPressRef.current = false;
    };

    const toggleExpand = (e: React.MouseEvent) => {
        if (wasLongPressRef.current) return;

        if (!isExpanded && ballRef.current) {
            const rect = ballRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            const newAlign = {
                x: rect.left < 140 ? 'left' : rect.right > screenWidth - 140 ? 'right' : 'center',
                y: rect.top < 250 ? 'bottom' : 'top'
            };
            setAlignment(newAlign);
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    };

    const quickActions = [
        { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" />, path: '/home' },
        { id: 'dash', label: 'Flow', icon: <LayoutDashboard className="w-6 h-6" />, path: '/dashboard' },
        { id: 'academy', label: 'Study', icon: <BookOpen className="w-6 h-6" />, path: '/courses' },
        { id: 'notes', label: 'Notes', icon: <StickyNote className="w-6 h-6" />, path: '/notes' },
        { id: 'settings', label: 'Sys', icon: <Settings className="w-6 h-6" />, path: '/settings' },
        { id: 'menu', label: 'Menu', icon: <Menu className="w-6 h-6" />, action: onOpenMenu },
        { id: 'close', label: 'Back', icon: <X className="w-6 h-6" />, action: () => setIsExpanded(false) },
    ];

    const getMenuClasses = () => {
        let xClass = 'left-1/2 -translate-x-1/2';
        if (alignment.x === 'left') xClass = 'left-0';
        if (alignment.x === 'right') xClass = 'right-0';

        let yClass = 'bottom-0';
        if (alignment.y === 'bottom') yClass = 'top-full mt-4';
        else yClass = 'bottom-full mb-4';

        return `${xClass} ${yClass}`;
    };

    const getInitialAndExit = () => {
        return {
            scale: 0.5,
            opacity: 0,
            y: alignment.y === 'top' ? 20 : -20,
            x: alignment.x === 'center' ? '-50%' : '0%'
        };
    };

    const getAnimate = () => {
        return {
            scale: 1,
            opacity: 1,
            y: 0,
            x: alignment.x === 'center' ? '-50%' : '0%'
        };
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]" ref={containerRef}>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExpanded(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />
                )}
            </AnimatePresence>

            <motion.div
                drag
                dragConstraints={containerRef}
                dragElastic={0.1}
                dragMomentum={false}
                onDragStart={handleDragStart}
                initial={{ x: 20, y: 100 }}
                className="absolute pointer-events-auto"
                style={{ zIndex: 101 }}
            >
                {/* Assistant Ball */}
                <motion.div ref={ballRef} className="relative">
                    {/* Charging Ring */}
                    <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none rotate-[-90deg]" viewBox="0 0 60 60">
                        <motion.circle
                            cx="30"
                            cy="30"
                            r="28"
                            stroke={isWild ? "#3b82f6" : "#ffffff"}
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: isPressing ? 1 : 0,
                                opacity: isPressing ? 1 : 0
                            }}
                            transition={{
                                duration: isPressing ? 0.5 : 0.2, // Match 500ms timeout
                                ease: "linear"
                            }}
                        />
                    </svg>

                    {isLongPressing && (
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{
                                scale: [1, 2, 1.5],
                                opacity: [0.5, 0, 0],
                                rotate: isWild ? [0, 90, 0] : 0
                            }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className={`absolute inset-0 rounded-full border-2 ${isWild ? 'border-primary' : 'border-white/40'}`}
                        />
                    )}
                    <motion.button
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onClick={toggleExpand}
                        animate={isLongPressing ? {
                            scale: 1.2,
                            boxShadow: isWild ? "0 0 30px rgba(255,0,0,0.8)" : "0 0 20px rgba(255,255,255,0.4)"
                        } : {
                            scale: 1,
                            boxShadow: "0 0 0px rgba(0,0,0,0)"
                        }}
                        className={`
                            w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 cursor-grab active:cursor-grabbing relative z-10
                            ${isExpanded ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-80 hover:opacity-100'}
                            ${isWild
                                ? 'bg-primary border-primary text-black'
                                : 'bg-black/60 backdrop-blur-xl border-white/20 text-white'
                            }
                        `}
                    >
                        <div className="w-8 h-8 rounded-full border-4 border-current opacity-30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                        </div>
                    </motion.button>

                    {/* Expanded Menu */}
                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={getInitialAndExit()}
                                animate={getAnimate()}
                                exit={getInitialAndExit()}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`
                                    absolute w-[320px] p-6 grid grid-cols-4 gap-4
                                    ${getMenuClasses()}
                                    ${isWild ? 'bg-black border-2 border-primary' : 'bg-[#1A1A1A]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem]'}
                                    shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[102]
                                `}
                            >
                                {quickActions.map((action, index) => {
                                    const isActive = location.pathname === action.path;
                                    return (
                                        <motion.button
                                            key={action.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (action.path) {
                                                    navigate(action.path);
                                                    setIsExpanded(false);
                                                } else if (action.action) {
                                                    action.action();
                                                    if (action.id !== 'menu') setIsExpanded(false);
                                                }
                                            }}
                                            className="flex flex-col items-center gap-2 group"
                                        >
                                            <div className={`
                                                w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative
                                                ${isActive
                                                    ? (isWild ? 'bg-primary text-black scale-110 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'bg-primary text-white scale-110 shadow-lg shadow-primary/40')
                                                    : (isWild
                                                        ? 'bg-primary/10 border border-primary/50 text-primary group-hover:bg-primary group-hover:text-black'
                                                        : 'bg-white/5 border border-white/10 text-white group-hover:bg-white/10 group-hover:scale-110')
                                                }
                                            `}>
                                                {action.icon}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-float"
                                                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-current"
                                                    />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100 text-primary' : 'opacity-60 group-hover:opacity-100'}`}>
                                                {action.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    );
};

export const SidebarNavigation = () => {
    const { logout, user } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
    const { isInstallable, installApp } = usePWA();

    // Group items for rendering
    const groupedItems = NAV_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => navigate('/home')}
                >
                    <div className={`p-2 rounded-lg border-2 ${isWild ? 'bg-primary border-primary text-black' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-black uppercase tracking-tighter leading-none flex items-center gap-1 ${isWild ? 'animate-glitch' : ''}`}>
                            RITU
                            <span className="bg-red-600 text-black px-1.5 py-0.5 rounded-[4px] text-xs font-bold tracking-widest font-mono">
                                OS
                            </span>
                        </h1>
                        <span className="text-[10px] text-red-900/60 font-mono uppercase tracking-widest">v2.1.0</span>
                    </div>
                </div>
                {/* Mobile Close */}
                <button onClick={() => setIsOpen(false)} className="md:hidden p-2">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                        <h3 className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-[0.2em] pl-3 mb-2">{category}</h3>
                        {items.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                                        ${isActive
                                            ? isWild
                                                ? 'bg-primary text-black font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] translate-x-1'
                                                : 'bg-primary/10 text-primary font-bold translate-x-1'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground hover:translate-x-1'
                                        }
                                    `}
                                >
                                    <div className="relative z-10 flex items-center gap-3">
                                        {item.icon}
                                        <span className="uppercase text-xs tracking-wider">{item.label}</span>
                                    </div>

                                    {/* Active Indicator Line */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className={`absolute left-0 top-0 bottom-0 w-1 ${isWild ? 'bg-white' : 'bg-primary'}`}
                                        />
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Footer / User */}
            <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-xs">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold truncate">{user?.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            ONLINE
                        </div>
                    </div>
                </div>

                {isInstallable && (
                    <button
                        onClick={installApp}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all
                            ${isWild
                                ? 'bg-primary text-black shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }
                        `}
                    >
                        <Download className="w-4 h-4" /> Install Ritual OS
                    </button>
                )}

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
                >
                    <LogOut className="w-4 h-4" /> Disconnect
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Advanced Floating Assistant (Mobile Only) */}
            <div className="md:hidden">
                <FloatingAssistant
                    onOpenMenu={() => setIsOpen(true)}
                    onOpenAssistant={() => setIsAssistantOpen(true)}
                    isWild={isWild}
                    navigate={navigate}
                    location={location}
                />
            </div>

            {/* Ritual AI Assistant Overlay */}
            <RitualAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                isWild={isWild}
                onInstall={installApp}
                isInstallable={isInstallable}
            />

            {/* Desktop Sidebar */}
            <div className={`
                hidden md:block fixed top-0 left-0 h-screen w-60 
                border-r border-white/5 bg-[#050505] z-40
                ${isWild ? 'font-mono' : 'font-sans'}
            `}>
                <SidebarContent />
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className={`
                                fixed top-0 left-0 h-screen w-72 
                                bg-[#0A0A0A] border-r border-white/10 z-50 md:hidden
                                shadow-2xl
                                ${isWild ? 'font-mono' : 'font-sans'}
                            `}
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
