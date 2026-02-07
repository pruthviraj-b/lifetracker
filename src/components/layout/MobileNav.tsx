
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, StickyNote, Activity, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavProps {
    onOpenMenu: () => void;
}

export const MobileNav = ({ onOpenMenu }: MobileNavProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: Activity, label: 'Rituals', path: '/protocols' },
        { icon: GraduationCap, label: 'Academy', path: '/courses' },
        { icon: StickyNote, label: 'Notes', path: '/notes' },
        { icon: Menu, label: 'Menu', action: onOpenMenu },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-around py-3 px-2"
            >
                {navItems.map((item) => {
                    // Check active state more loosely for paths
                    const isActive = item.path ? location.pathname.startsWith(item.path) : false;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : navigate(item.path!)}
                            className="flex flex-col items-center gap-1 group relative py-1 px-3"
                        >
                            <div className={`
                                p-2 rounded-xl transition-all duration-300
                                ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                            `}>
                                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
};
