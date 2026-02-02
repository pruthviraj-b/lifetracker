import React from 'react';
import { cn } from '@/lib/utils';

// Simplified props - removed variants
interface AnimeCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default'; // Kept for compatibility but unused
}

export function AnimeCard({
    children,
    className,
    ...props
}: AnimeCardProps) {
    return (
        <div
            className={cn(
                "bg-card text-card-foreground rounded-lg border border-border shadow-sm",
                "transition-all duration-200 hover:shadow-md",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
