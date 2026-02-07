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
import { ServiceWorkerHandler } from './components/pwa/ServiceWorkerHandler';
import { GlobalErrorBoundary } from './components/debug/GlobalErrorBoundary';
import { SystemStatusMonitor } from './components/debug/SystemStatusMonitor';
import { NotificationManagerInstance } from './utils/notificationManager';
import { HabitService } from './services/habit.service';

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

// Lightweight loading fallback to minimize startup rendering overhead
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
            <div className="h-8 w-8 border-2 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
    </div>
);

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

        const initSystem = async () => {
            if (!('serviceWorker' in navigator)) return;

            try {
                // Initialize system (NotificationManager will handle the core registration)
                const registration = await NotificationManagerInstance.init();

                if (registration && typeof registration !== 'boolean') {
                    // Check for updates periodically (every 6 hours)
                    updateCheckInterval = setInterval(() => {
                        registration.update().catch(() => { });
                    }, 6 * 60 * 60 * 1000);
                }
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        };

        initSystem();

        return () => {
            if (updateCheckInterval) clearInterval(updateCheckInterval);
        };
    }, []);

    return (
        <Router>
            <AuthProvider>
                <ServiceWorkerHandler />
                <ThemeProvider>
                    <ToastProvider>
                        <NotificationProvider>
                            <Suspense fallback={<PageLoader />}>
                                <GlobalErrorBoundary>
                                    <SystemStatusMonitor />
                                    <PWAInstaller />
                                    <PWAUpdater />
                                    <CommandPalette />
                                    <FocusOverlay />
                                    {isGraphOpen && <NeuralGraph onClose={() => setIsGraphOpen(false)} />}
                                    <Routes>
                                        <Route path="/" element={<LandingPage />} />

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

                                        {/* Fallback */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </GlobalErrorBoundary>
                            </Suspense>
                        </NotificationProvider>
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
