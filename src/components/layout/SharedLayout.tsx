
import React from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { useTheme } from '../../context/ThemeContext';

export const SharedLayout = ({ children }: { children: React.ReactNode }) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    return (
        <div className={`min-h-screen bg-background text-foreground flex ${isWild ? 'wild' : ''}`}>

            {/* Persistent Sidebar */}
            <SidebarNavigation />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-60 min-h-screen relative z-10 w-full overflow-x-hidden">
                {/* 
                     We don't need a top bar here because the sidebar handles nav. 
                     The content will just scroll naturally. 
                */}
                <div className="w-full relative">
                    {children}
                </div>
            </main>
        </div>
    );
};
