import React, { useEffect, useState, useRef } from 'react';
import './PWAUpdater.css';

export const PWAUpdater: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
    const hasReloadedRef = useRef(false);
    const updateCheckRef = useRef(false);

    useEffect(() => {
        if (updateCheckRef.current) return;
        updateCheckRef.current = true;

        if (!('serviceWorker' in navigator)) return;

        // Capture initial controller state to distinguish between first-load claim and true update
        const hadControllerOnLoad = !!navigator.serviceWorker.controller;
        console.log('PWA: Initial controller state:', hadControllerOnLoad);

        navigator.serviceWorker.ready.then((registration) => {
            // Check for waiting SW
            const checkWaiting = () => {
                const dismissedTime = localStorage.getItem('pwa_update_dismissed');
                const isRecentlyDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime) < 3600000);

                if (registration.waiting && !isRecentlyDismissed) {
                    console.log('🔄 Found waiting Service Worker');
                    setWaitingServiceWorker(registration.waiting);
                    setUpdateAvailable(true);
                }
            };

            checkWaiting();

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        checkWaiting();
                    }
                });
            });

            const handleControllerChange = () => {
                // 🛑 CRITICAL: Only reload if we were ALREADY being controlled by an old SW.
                // If hadControllerOnLoad is false, this is just the first-time installation claiming the page.
                if (!hadControllerOnLoad) {
                    console.log('PWA: Controller acquired for the first time, skipping reload.');
                    return;
                }

                if (hasReloadedRef.current) return;

                // Extra throttle via sessionStorage to survive page reloads
                const lastReload = sessionStorage.getItem('pwa_reload_gate');
                if (lastReload && Date.now() - parseInt(lastReload) < 5000) {
                    console.warn('PWA: Suppressing rapid reload loop');
                    return;
                }

                hasReloadedRef.current = true;
                sessionStorage.setItem('pwa_reload_gate', Date.now().toString());

                console.log('✓ Service Worker updated - triggering one-time reload');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            };

            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            };
        });
    }, []);

    const handleUpdate = () => {
        if (waitingServiceWorker) {
            console.log('📲 User accepted update');
            setUpdateAvailable(false);
            waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    const handleLater = () => {
        setUpdateAvailable(false);
        localStorage.setItem('pwa_update_dismissed', Date.now().toString());
    };

    if (!updateAvailable || !waitingServiceWorker) return null;

    return (
        <div className="pwa-updater-container">
            <div className="pwa-updater-banner">
                <div className="pwa-updater-content">
                    <h3>🎉 System Update</h3>
                    <p>New version ready. Refresh to apply latest protocols.</p>
                </div>
                <div className="pwa-updater-actions">
                    <button className="pwa-btn-update" onClick={handleUpdate}>Refresh Now</button>
                    <button className="pwa-btn-later" onClick={handleLater}>Later</button>
                </div>
            </div>
        </div>
    );
};

export default PWAUpdater;
