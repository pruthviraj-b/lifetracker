import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-8 p-10 bg-card rounded-3xl border border-border shadow-2xl animate-pulse">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20" />
                    <div className="space-y-4">
                        <div className="h-8 w-3/4 mx-auto bg-muted/20 rounded" />
                        <div className="h-4 w-1/2 mx-auto bg-muted/10 rounded" />
                    </div>
                    <div className="space-y-6 pt-6">
                        <div className="h-14 w-full bg-muted/10 rounded-2xl" />
                        <div className="h-14 w-full bg-muted/10 rounded-2xl" />
                        <div className="h-14 w-full bg-primary/10 rounded-2xl mt-8" />
                    </div>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
