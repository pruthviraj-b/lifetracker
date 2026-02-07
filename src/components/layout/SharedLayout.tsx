import React from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { GlobalAdvancedSearch } from '../ui/GlobalAdvancedSearch';
import { useTheme } from '../../context/ThemeContext';

export const SharedLayout = ({ children }: { children: React.ReactNode }) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    return (
        <div className={`min-h-screen bg-background text-foreground flex ${isWild ? 'wild' : ''}`}>

            {/* Persistent Sidebar (Hidden on mobile by its own implementation) */}
            <SidebarNavigation />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-60 min-h-screen relative z-10 w-full overflow-x-hidden">
                {/* Global search (sticky) - click or Cmd/Ctrl+K to open */}
                <GlobalAdvancedSearch />
                <div className="sticky top-0 z-30 w-full bg-background/60 backdrop-blur-sm px-4 py-3 border-b border-border hidden md:block">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => window.dispatchEvent(new Event('open-advanced-search'))}
                        onKeyDown={(e) => { if (e.key === 'Enter') window.dispatchEvent(new Event('open-advanced-search')); }}
                        className="max-w-3xl mx-auto bg-card border border-border rounded-xl px-4 py-2 flex items-center gap-3 cursor-text hover:shadow-sm"
                    >
                        <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="11" cy="11" r="6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex-1 text-left text-sm text-muted-foreground">Search habits, create reminders, or type command... <span className="ml-2 text-[11px] text-muted-foreground/60">(⌘K)</span></div>
                    </div>
                </div>
                {/* 
                     We don't need a top bar here because the sidebar handles nav. 
                     The content will just scroll naturally. 
                */}
                <div className="w-full relative pb-20 md:pb-0">
                    {children}
                </div>
            </main>

            {/* Bottom Mobile Navigation - Now handled by SidebarNavigation */}
        </div>
    );
};
