import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { CommandPalette } from './components/intelligence/CommandPalette';
import { FocusOverlay } from './components/intelligence/FocusOverlay';
import { NeuralGraph } from './components/intelligence/NeuralGraph';
import { SharedLayout } from './components/layout/SharedLayout';
import { PWAInstaller } from './components/pwa/PWAInstaller';
import { PWAUpdater } from './components/pwa/PWAUpdater';

// Layout Helper
const ProtectedLayout = () => (
    <ProtectedRoute>
        <SharedLayout>
            <Outlet />
        </SharedLayout>
    </ProtectedRoute>
);

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const YouTubePage = lazy(() => import('./pages/YouTubePage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const RecallPage = lazy(() => import('./pages/RecallPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const CourseLibraryPage = lazy(() => import('./pages/courses/CourseLibraryPage').then(m => ({ default: m.CourseLibraryPage })));
const CourseDetailsPage = lazy(() => import('./pages/courses/CourseDetailsPage').then(m => ({ default: m.CourseDetailsPage })));
const LessonPlayerPage = lazy(() => import('./pages/courses/LessonPlayerPage').then(m => ({ default: m.LessonPlayerPage })));

// Loading fallback component
const PageLoader = () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-foreground/60 font-medium text-sm tracking-wide">Preparing your workspace...</p>
    </div>
);

import { NotificationManagerInstance } from './utils/notificationManager';
import { HabitService } from './services/habit.service';

function App() {
    const [isGraphOpen, setIsGraphOpen] = useState(false);

    useEffect(() => {
        const toggle = () => setIsGraphOpen((prev: boolean) => !prev);
        window.addEventListener('toggle-graph', toggle);
        return () => window.removeEventListener('toggle-graph', toggle);
    }, []);

    // Initialize Service Worker & Advanced Notification System
    useEffect(() => {
        let updateCheckInterval: NodeJS.Timeout;

        const handleSWMessage = async (event: MessageEvent) => {
            if (event.data && event.data.type === 'NOTIF_ACTION') {
                const { action, habitId, reminderId } = event.data;

                if (action === 'complete' && habitId) {
                    try {
                        const today = new Date().toISOString().split('T')[0];
                        await HabitService.toggleHabitCompletion(habitId, today, true);
                        window.dispatchEvent(new CustomEvent('habit-completed-external', { detail: { habitId } }));
                        console.log('✅ Habit completed via notification action');
                    } catch (err) {
                        console.error('Failed to complete habit from notification:', err);
                    }
                } else if (action === 'snooze' && reminderId) {
                    // We need access to snoozeReminder here, or we can use a custom event
                    window.dispatchEvent(new CustomEvent('reminder-snooze-external', {
                        detail: { reminderId, minutes: 15 }
                    }));
                }
            }
        };

        const initSystem = async () => {
            if (!('serviceWorker' in navigator)) {
                console.warn('⚠️ Service Worker not supported');
                return;
            }

            try {
                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', handleSWMessage);

                // Initialize system (NotificationManager will handle the core registration)
                const registration = await NotificationManagerInstance.init();

                if (registration && typeof registration !== 'boolean') {
                    console.log('✅ Service Worker active with scope:', registration.scope);

                    // ✅ Check for updates periodically (every 6 hours)
                    updateCheckInterval = setInterval(() => {
                        console.log('🔄 Checking for Service Worker updates...');
                        registration.update().catch(err => console.warn('Update check failed:', err));
                    }, 6 * 60 * 60 * 1000);
                }
            } catch (error) {
                console.error('❌ Service Worker registration sequence failed:', error);
            }
        };

        initSystem();

        return () => {
            if (updateCheckInterval) clearInterval(updateCheckInterval);
            navigator.serviceWorker.removeEventListener('message', handleSWMessage);
        };
    }, []);

    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <NotificationProvider>
                            <Suspense fallback={<PageLoader />}>
                                <PWAInstaller />
                                <PWAUpdater />
                                <CommandPalette />
                                <FocusOverlay />
                                {isGraphOpen && <NeuralGraph onClose={() => setIsGraphOpen(false)} />}
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                                    <Route path="/register" element={<PublicRoute><SignupPage /></PublicRoute>} />
                                    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

                                    {/* Protected Routes with Sidebar */}
                                    <Route element={<ProtectedLayout />}>
                                        <Route path="/dashboard" element={<HomePage />} />
                                        <Route path="/protocols" element={<DashboardPage />} />
                                        <Route path="/notes" element={<NotesPage />} />
                                        <Route path="/recall" element={<RecallPage />} />
                                        <Route path="/analytics" element={<AnalyticsPage />} />
                                        <Route path="/network" element={<NetworkPage />} />
                                        <Route path="/achievements" element={<AchievementsPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/courses" element={<CourseLibraryPage />} />
                                        <Route path="/courses/:id" element={<CourseDetailsPage />} />
                                        <Route path="/youtube" element={<YouTubePage />} />
                                        <Route path="/reminders" element={<RemindersPage />} />
                                    </Route>

                                    {/* Immersive Protected Routes (No Sidebar) */}
                                    <Route path="/courses/:courseId/learn/:lessonId" element={
                                        <ProtectedRoute>
                                            <LessonPlayerPage />
                                        </ProtectedRoute>
                                    } />

                                    {/* Default Route */}
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes >
                            </Suspense >
                        </NotificationProvider >
                    </ToastProvider >
                </ThemeProvider >
            </AuthProvider >
        </Router>
    );
}

export default App;
