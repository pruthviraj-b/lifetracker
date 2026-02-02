import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-muted rounded ${className}`}></div>
    );
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 animate-pulse space-y-12">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                    <div className="h-8 w-48 bg-muted rounded"></div>
                    <div className="h-4 w-64 bg-muted/50 rounded"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-muted rounded"></div>
                    <div className="h-10 w-24 bg-muted rounded"></div>
                    <div className="h-10 w-24 bg-muted rounded"></div>
                </div>
            </div>

            {/* Heatmap Skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-32 bg-muted rounded"></div>
                <div className="h-32 w-full bg-muted/30 rounded-xl"></div>
            </div>

            {/* Sections Skeleton */}
            <div className="space-y-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <div className="h-6 w-6 bg-muted rounded-full"></div>
                            <div className="h-6 w-32 bg-muted rounded"></div>
                        </div>
                        <div className="grid gap-3">
                            <div className="h-20 w-full bg-muted/20 border border-muted/50 rounded-xl"></div>
                            <div className="h-20 w-full bg-muted/20 border border-muted/50 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
