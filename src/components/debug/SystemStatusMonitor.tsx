import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const SystemStatusMonitor: React.FC = () => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastPing, setLastPing] = useState<number>(Date.now());
    const [latency, setLatency] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Ping simulation
        const interval = setInterval(() => {
            const start = Date.now();
            // Simulate a "ping" - in a real app this would fetch a health endpoint
            setTimeout(() => {
                setLatency(Date.now() - start);
                setLastPing(Date.now());
            }, Math.random() * 200 + 50);
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Only show full detail in wild mode or if offline
    if (!isWild && isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 font-mono text-[10px] pointer-events-none">
            <div className={`
                flex flex-col items-end gap-2 pointer-events-auto transition-all duration-500
                ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-80 hover:opacity-100'}
            `}>

                {/* Detail Panel */}
                {isOpen && (
                    <div className="bg-black/90 border border-primary/20 p-4 rounded-lg backdrop-blur-md mb-2 w-64 space-y-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-muted-foreground uppercase tracking-wider">System Diagnostic</span>
                            <Activity className="w-3 h-3 text-primary animate-pulse" />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Network Status</span>
                                <span className={isOnline ? "text-green-500" : "text-red-500"}>
                                    {isOnline ? "OPERATIONAL" : "OFFLINE"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Latency</span>
                                <span className="text-primary">{latency ? `${latency}ms` : '--'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Sync</span>
                                <span className="text-muted-foreground">{new Date(lastPing).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Environment</span>
                                <span className="text-orange-500">DEV_BUILD_v0.9.4</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 text-xs text-center text-muted-foreground opacity-50">
                            NOIR_SYSTEMS // {new Date().getFullYear()}
                        </div>
                    </div>
                )}

                {/* Minimized Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black shadow-lg transition-all
                        ${!isOnline
                            ? 'border-red-500 text-red-500 animate-pulse'
                            : 'border-primary/20 text-primary hover:border-primary/50'
                        }
                    `}
                >
                    {isOnline ? (
                        <>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_currentColor]" />
                            <span className="tracking-widest font-bold">SYSTEM_OK</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3 h-3" />
                            <span className="tracking-widest font-bold">NET_DOWN</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
