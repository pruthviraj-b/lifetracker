
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, StickyNote, Activity, Menu, TrendingUp, Zap } from 'lucide-react';
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
        // User requested "all add there give side scroll", but 5 fits nicely. 
        // If they want more, we can add 'Recall' or 'Metrics' but typically 5 is standard for mobile nav.
        // Let's stick to 5 core ones for now as per "5 have all add there" request interpretation.
        // Wait, "have 5 have all add there" might mean there ARE 5, but maybe they want MORE?
        // "give side scroll options" implies more than screen width.
        // Let's add a few more useful ones to demonstrate the scroll.
    ];

    // Extended list for scroll purposes based on "all add there"
    const scrollableNavItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: Activity, label: 'Rituals', path: '/protocols' },
        { icon: GraduationCap, label: 'Academy', path: '/courses' },
        { icon: StickyNote, label: 'Notes', path: '/notes' },
        { icon: TrendingUp, label: 'Metrics', path: '/analytics' },
        { icon: Zap, label: 'Recall', path: '/recall' },
        { icon: Menu, label: 'Menu', action: onOpenMenu },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pb-4">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl py-2"
            >
                <div className="flex items-center gap-1 overflow-x-auto px-2 no-scrollbar scroll-smooth">
                    {scrollableNavItems.map((item) => {
                        // Check active state more loosely for paths
                        const isActive = item.path ? location.pathname.startsWith(item.path) : false;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                onClick={() => item.action ? item.action() : navigate(item.path!)}
                                className="flex flex-col items-center gap-1 group relative py-2 px-3 min-w-[70px] flex-shrink-0"
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
                </div>
            </motion.div>
        </div>
    );
};
