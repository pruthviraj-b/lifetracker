
import React from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { useTheme } from '../../context/ThemeContext';

export const SharedLayout = ({ children }: { children: React.ReactNode }) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    return (
        <div className={`min-h-screen bg-background text-foreground flex ${isWild ? 'wild-mode' : ''}`}>
            {/* Persistent Sidebar */}
            <SidebarNavigation />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 min-h-screen relative w-full overflow-x-hidden">
                {/* 
                     We don't need a top bar here because the sidebar handles nav. 
                     The content will just scroll naturally. 
                     We add some padding to top/left for mobile where sidebar is hidden relative.
                */}
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};
