import React, { useEffect, useState, useRef } from 'react';
import './PWAUpdater.css';

export const PWAUpdater: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
    const hasReloadedRef = useRef(false);
    const updateCheckRef = useRef(false);

    useEffect(() => {
        // ❌ PREVENT DOUBLE-CHECKING
        if (updateCheckRef.current) {
            return;
        }
        updateCheckRef.current = true;

        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return;
        }

        navigator.serviceWorker.ready.then((registration) => {
            console.log('✓ Service Worker ready');

            // ✅ Check if we recently dismissed the update
            const dismissedTime = localStorage.getItem('pwa_update_dismissed');
            const isRecentlyDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime) < 3600000);

            // ✅ Check for waiting SW ONLY ONCE on load
            if (registration.waiting && !isRecentlyDismissed) {
                console.log('🔄 Found waiting Service Worker - prompting update');
                setWaitingServiceWorker(registration.waiting);
                setUpdateAvailable(true);
            }

            // ✅ Listen for new SW installations
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    // ✅ ONLY show update prompt if there's an active controller
                    // This means the app is already running (not first install)
                    if (
                        newWorker.state === 'installed' &&
                        navigator.serviceWorker.controller &&
                        !updateAvailable && // ✅ Don't show twice
                        !isRecentlyDismissed
                    ) {
                        console.log('🔄 New Service Worker installed - prompting user');
                        setWaitingServiceWorker(newWorker);
                        setUpdateAvailable(true);
                    }
                });
            });

            // ✅ Listen for controller change (SW update applied)
            const handleControllerChange = () => {
                console.log('✓ Service Worker updated - reloading app');
                if (!hasReloadedRef.current) {
                    hasReloadedRef.current = true;
                    // ✅ Add small delay to ensure new SW is active
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            };

            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            };
        }).catch((error) => {
            console.error('✗ Service Worker error:', error);
        });
    }, [updateAvailable]);

    const handleUpdate = () => {
        if (!waitingServiceWorker) {
            console.error('No waiting Service Worker available');
            return;
        }

        console.log('📲 User accepted update - activating new Service Worker');
        setUpdateAvailable(false);
        waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    };

    const handleLater = () => {
        console.log('⏭️ User dismissed update');
        setUpdateAvailable(false);
        localStorage.setItem('pwa_update_dismissed', Date.now().toString());
    };

    if (!updateAvailable || !waitingServiceWorker) {
        return null;
    }

    return (
        <div className="pwa-updater-container">
            <div className="pwa-updater-banner">
                <div className="pwa-updater-content">
                    <h3>🎉 Update Available</h3>
                    <p>A new version of RITU OS is ready to install</p>
                </div>
                <div className="pwa-updater-actions">
                    <button
                        className="pwa-btn-update"
                        onClick={handleUpdate}
                    >
                        Update Now
                    </button>
                    <button
                        className="pwa-btn-later"
                        onClick={handleLater}
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAUpdater;
