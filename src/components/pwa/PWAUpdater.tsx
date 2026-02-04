import React, { useEffect, useState } from 'react';
import './PWAUpdater.css';

export const PWAUpdater: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Check for waiting workers on load
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    setWaitingServiceWorker(registration.waiting);
                    setUpdateAvailable(true);
                }

                // Listen for new installing workers
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available; please refresh.
                                setWaitingServiceWorker(newWorker);
                                setUpdateAvailable(true);
                            }
                        });
                    }
                });
            });

            // Handle controller change (reload on update)
            // CRITICAL: We only reload if we were the ones who triggered the skipWaiting
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }
    }, []);

    const handleUpdate = () => {
        if (waitingServiceWorker) {
            waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // Fallback
            window.location.reload();
        }
    };

    if (!updateAvailable) {
        return null;
    }

    return (
        <div className="pwa-updater-container">
            <div className="pwa-updater-banner">
                <div className="pwa-updater-content">
                    <h3>🎉 Update Available</h3>
                    <p>A new version of Habit Tracker is ready to install</p>
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
                        onClick={() => setUpdateAvailable(false)}
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
};
