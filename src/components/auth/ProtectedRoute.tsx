import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex">
                {/* Skeleton Sidebar (Desktop) */}
                <div className="hidden md:block fixed w-64 h-full border-r border-border bg-background p-6 space-y-8 z-40">
                    <div className="h-8 w-32 bg-muted/20 rounded-lg animate-pulse" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-10 w-full bg-muted/10 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Skeleton Main Content */}
                <main className="flex-1 md:ml-64 p-4 md:p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-48 bg-muted/20 rounded-lg animate-pulse" />
                        <div className="h-10 w-10 rounded-full bg-muted/20 animate-pulse" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-muted/10 rounded-3xl animate-pulse border border-border/50" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
