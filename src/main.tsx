import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ui/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
// PWA Auto-update
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('New update available. Reload?')) {
            updateSW(true)
        }
    },
    onOfflineReady() {
        console.log('App ready for offline use');
    },
    onRegisterError(error) {
        console.error('SW registration error', error);
    }
})
