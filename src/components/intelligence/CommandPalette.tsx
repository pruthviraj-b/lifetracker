import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Command,
    Zap,
    Star,
    BookOpen,
    Settings,
    Eye,
    Terminal,
    Home,
    Youtube,
    FileText,
    Flame,
    Box
} from 'lucide-react';
import { CourseService } from '../../services/course.service';
import { HabitService } from '../../services/habit.service';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const { preferences, updatePreferences } = useTheme();
    const isWild = preferences.wild_mode;

    // Toggle Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setResults(DEFAULT_ACTIONS);
            return;
        }

        const runSearch = async () => {
            const searchPromises = [
                CourseService.getCourses(),
                HabitService.getHabits()
            ];

            const [courses, habits] = await Promise.all(searchPromises);

            const filteredCourses = courses
                .filter((c: any) => c.title.toLowerCase().includes(query.toLowerCase()))
                .map((c: any) => ({ ...c, type: 'course', icon: BookOpen }));

            const filteredHabits = habits
                .filter((h: any) => h.title.toLowerCase().includes(query.toLowerCase()))
                .map((h: any) => ({ ...h, type: 'habit', icon: Star }));

            setResults([...filteredCourses, ...filteredHabits].slice(0, 8));
        };

        runSearch();
    }, [query]);

    const handleSelect = useCallback((item: any) => {
        if (item.action) {
            item.action();
        } else if (item.type === 'course') {
            navigate(`/courses/${item.id}`);
        } else if (item.type === 'habit') {
            navigate(`/dashboard`);
        }
        setIsOpen(false);
        setQuery('');
    }, [navigate]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                handleSelect(results[selectedIndex]);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, results, selectedIndex, handleSelect]);

    const DEFAULT_ACTIONS = [
        { title: 'Go Home', icon: Home, action: () => navigate('/home') },
        { title: 'Neural Library', icon: BookOpen, action: () => navigate('/courses') },
        { title: 'Neural Knowledge Graph', icon: Box, action: () => window.dispatchEvent(new CustomEvent('toggle-graph')) },
        { title: 'Intelligence Store', icon: Youtube, action: () => navigate('/youtube') },
        { title: 'Toggle Wild Mode', icon: Zap, action: () => updatePreferences({ wild_mode: !isWild }) },
        { title: 'Focus Protocol', icon: Terminal, action: () => window.dispatchEvent(new CustomEvent('toggle-focus')) },
        { title: 'System Settings', icon: Settings, action: () => navigate('/settings') },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className={cn(
                            "relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl overflow-hidden",
                            isWild ? "rounded-none border-primary/40 shadow-primary/20" : "rounded-2xl"
                        )}
                    >
                        <div className="flex items-center px-4 h-16 border-b border-white/5 bg-white/5">
                            <Search className="w-5 h-5 text-muted-foreground mr-3" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Execute command..."
                                className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-muted-foreground"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/10 text-[10px] font-bold text-muted-foreground">
                                <Command className="w-3 h-3" /> K
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {results.length > 0 ? (
                                results.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(i)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group",
                                            selectedIndex === i ? (isWild ? "bg-primary text-black" : "bg-primary/10 text-primary") : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                selectedIndex === i ? (isWild ? "bg-black/20" : "bg-primary/20") : "bg-white/5"
                                            )}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{item.title}</div>
                                                <div className="text-[10px] opacity-60 uppercase tracking-widest leading-none mt-1">
                                                    {item.type || 'Action'}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedIndex === i && (
                                            <div className="text-[10px] font-mono opacity-50">EXE</div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground italic">
                                    No matches in local memory.
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[10px] font-mono text-muted-foreground px-6 uppercase tracking-extra-widest">
                            <span>{results.length} Nodes Found</span>
                            <div className="flex gap-4">
                                <span>↑↓ Navigate</span>
                                <span>↵ Execute</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
