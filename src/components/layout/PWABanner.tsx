import React from 'react';
import { Download, X, Zap, AlertCircle } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export const PWABanner = () => {
    const { isInstallable, installApp, isInstalled } = usePWA();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [isVisible, setIsVisible] = React.useState(true);

    // Detect if we should show fallback (e.g., iOS or insecure local IP)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInsecure = !window.isSecureContext && window.location.hostname !== 'localhost';
    const showBanner = (isInstallable || (isIOS && !isInstalled) || isInsecure) && isVisible;

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden mb-8 border-2 ${isWild ? 'border-primary bg-primary/10' : 'bg-primary/5 border-primary/20 rounded-2xl shadow-lg'}`}
            >
                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className={`p-3 rounded-xl shrink-0 ${isWild ? 'bg-primary text-black' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                            {isInsecure ? <AlertCircle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                            <h3 className={`font-black uppercase tracking-tight text-lg mb-1 ${isWild ? 'text-primary' : 'text-foreground'}`}>
                                {isInsecure ? 'Security Protocol Required' : 'System Upgrade Available'}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                                {isInsecure
                                    ? 'PWA installation requires HTTPS or localhost. Connect via secure tunnel.'
                                    : isIOS
                                        ? 'Tap "Share" then "Add to Home Screen" to install'
                                        : 'Connect Ritual OS to your core system for offline access.'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {!isInsecure ? (
                            !isIOS ? (
                                <button
                                    onClick={installApp}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 font-black uppercase tracking-wider transition-all
                                        ${isWild
                                            ? 'bg-primary text-black hover:bg-white'
                                            : 'bg-primary text-white hover:opacity-90 shadow-xl'
                                        }
                                    `}
                                >
                                    <Download className="w-5 h-5" />
                                    Initialize PWA
                                </button>
                            ) : (
                                <div className="flex-1 md:flex-none px-6 py-3 border-2 border-primary/20 rounded-xl text-[10px] font-black uppercase text-center">
                                    Use Browser Menu
                                </div>
                            )
                        ) : (
                            <a
                                href="https://web.dev/articles/progressive-web-apps#secure-contexts"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none px-6 py-3 border-2 border-primary/20 rounded-xl text-[10px] font-black uppercase text-center hover:bg-primary/5 transition-colors"
                            >
                                Learn More
                            </a>
                        )}
                        <button
                            onClick={() => setIsVisible(false)}
                            className={`p-3 transition-colors ${isWild ? 'text-primary hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
