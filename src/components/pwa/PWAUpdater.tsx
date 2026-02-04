import React, { useEffect, useState } from 'react';
import './PWAUpdater.css';

export const PWAUpdater: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Handle controller change (reload on update)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('PWA: Update applied, reloading...');
                window.location.reload();
            });

            // Check for waiting workers on load
            navigator.serviceWorker.ready.then((registration) => {
                // Check if we recently showed an update prompt (within last 5 minutes)
                const lastPrompt = localStorage.getItem('pwa_last_update_prompt');
                const now = Date.now();
                if (lastPrompt && (now - parseInt(lastPrompt)) < 5 * 60 * 1000) {
                    console.log('PWA: Update prompt shown recently, skipping');
                    return;
                }

                if (registration.waiting) {
                    setWaitingServiceWorker(registration.waiting);
                    setUpdateAvailable(true);
                    localStorage.setItem('pwa_last_update_prompt', now.toString());
                }

                // Listen for new installing workers
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Check cooldown again
                                const lastPrompt = localStorage.getItem('pwa_last_update_prompt');
                                const now = Date.now();
                                if (lastPrompt && (now - parseInt(lastPrompt)) < 5 * 60 * 1000) {
                                    return;
                                }

                                // New content is available; please refresh.
                                setWaitingServiceWorker(newWorker);
                                setUpdateAvailable(true);
                                localStorage.setItem('pwa_last_update_prompt', now.toString());
                            }
                        });
                    }
                });
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
                        onClick={() => {
                            setUpdateAvailable(false);
                            localStorage.setItem('pwa_last_update_prompt', (Date.now() + 25 * 60 * 1000).toString());
                        }}
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
};
