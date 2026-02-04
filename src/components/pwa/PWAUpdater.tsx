import React, { useEffect, useState, useRef } from 'react';
import './PWAUpdater.css';

export const PWAUpdater: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
    const hasReloadedRef = useRef(false);
    const updateCheckRef = useRef(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        // ❌ PREVENT DOUBLE-CHECKING
        if (updateCheckRef.current) return;
        updateCheckRef.current = true;

        // Check if we recently dismissed the update
        const checkDismissal = () => {
            const dismissedTime = localStorage.getItem('pwa_update_dismissed');
            if (dismissedTime) {
                const timeDiff = Date.now() - parseInt(dismissedTime);
                if (timeDiff < 3600000) { // 1 hour cooldown
                    return true;
                }
            }
            return false;
        };

        const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
            if (registration.waiting) {
                if (!checkDismissal()) {
                    setWaitingServiceWorker(registration.waiting);
                    setUpdateAvailable(true);
                }
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (!checkDismissal()) {
                                setWaitingServiceWorker(newWorker);
                                setUpdateAvailable(true);
                            }
                        }
                    });
                }
            });
        };

        // Initial check
        navigator.serviceWorker.ready.then(handleUpdateFound);

        // Handle controller change (one-time reload)
        const handleControllerChange = () => {
            if (hasReloadedRef.current) return;
            hasReloadedRef.current = true;
            console.log('PWA: Controller changed, reloading...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const handleUpdate = () => {
        if (waitingServiceWorker) {
            console.log('PWA: Skipping waiting and activating new SW...');
            waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    };

    const handleLater = () => {
        setUpdateAvailable(false);
        localStorage.setItem('pwa_update_dismissed', Date.now().toString());
    };

    if (!updateAvailable) {
        return null;
    }

    return (
        <div className="pwa-updater-container">
            <div className="pwa-updater-banner">
                <div className="pwa-updater-content">
                    <h3>🚀 System Update Available</h3>
                    <p>New protocols and security patches are ready for installation.</p>
                </div>
                <div className="pwa-updater-actions">
                    <button
                        className="pwa-btn-update"
                        onClick={handleUpdate}
                    >
                        Apply Now
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
