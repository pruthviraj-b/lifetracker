
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ThemedCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    interactive?: boolean;
    noPadding?: boolean;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
    children,
    className = '',
    onClick,
    hoverable = true,
    interactive = false,
    noPadding = false
}) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    const baseStyles = 'claude-card';

    const hoverStyles = hoverable
        ? 'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300'
        : '';

    const interactiveStyles = interactive ? 'active:scale-[0.98] cursor-pointer' : '';
    const paddingStyles = noPadding ? '' : 'p-6 md:p-8';

    return (
        <div
            onClick={onClick}
            className={`${baseStyles} ${hoverStyles} ${interactiveStyles} ${paddingStyles} ${className} relative overflow-hidden group`}
        >
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};
