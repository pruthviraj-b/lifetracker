import React, { useState, useEffect } from 'react';
import './PWAInstaller.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstaller: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        checkIfInstalled();

        // Handle beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            setShowPrompt(true);
            console.log('PWA: beforeinstallprompt event received');
        };

        // Handle app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            console.log('PWA: App installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if running in standalone mode (iOS or PWA)
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const checkIfInstalled = () => {
        const isInstalledBefore = localStorage.getItem('pwa_installed') === 'true';
        if (isInstalledBefore) {
            setIsInstalled(true);
        }
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // If weird state, verify if we can show instructions for iOS
            console.log('PWA: Install prompt not available. (iOS maybe?)');
            return;
        }

        try {
            // Show the install prompt
            await deferredPrompt.prompt();

            // Wait for user response
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('PWA: User accepted installation');
                setIsInstalled(true);
                setShowPrompt(false);
                localStorage.setItem('pwa_installed', 'true');
            } else {
                console.log('PWA: User dismissed installation');
            }

            setDeferredPrompt(null);
        } catch (error) {
            console.error('PWA: Installation error', error);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    // If already installed or not showing prompt, return null
    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className="pwa-installer-container">
            <div className="pwa-installer-banner">
                <div className="pwa-installer-content">
                    <div className="pwa-installer-icon">
                        <img src="/icons/icon-192x192.png" alt="Habit Tracker" />
                    </div>

                    <div className="pwa-installer-text">
                        <h3>Install Habit Tracker</h3>
                        <p>Get the full app experience on your device</p>
                        <ul className="pwa-features">
                            <li>✓ Works offline</li>
                            <li>✓ No ads or distractions</li>
                            <li>✓ Quick access from home screen</li>
                            <li>✓ Instant notifications</li>
                        </ul>
                    </div>
                </div>

                <div className="pwa-installer-actions">
                    <button
                        className="pwa-btn-install"
                        onClick={handleInstallClick}
                    >
                        Install App
                    </button>
                    <button
                        className="pwa-btn-dismiss"
                        onClick={handleDismiss}
                    >
                        Not Now
                    </button>
                </div>
            </div>
        </div>
    );
};
