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
const StillNotDonePage = lazy(() => import('./pages/StillNotDonePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const YouTubePage = lazy(() => import('./pages/YouTubePage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const CourseLibraryPage = lazy(() => import('./pages/courses/CourseLibraryPage').then(m => ({ default: m.CourseLibraryPage })));
const CourseDetailsPage = lazy(() => import('./pages/courses/CourseDetailsPage').then(m => ({ default: m.CourseDetailsPage })));
const LessonPlayerPage = lazy(() => import('./pages/courses/LessonPlayerPage').then(m => ({ default: m.LessonPlayerPage })));

// Loading fallback component
const PageLoader = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-red-500 font-mono text-sm tracking-widest animate-pulse">SYSTEM LOADING...</p>
    </div>
);

function App() {
    const [isGraphOpen, setIsGraphOpen] = useState(false);

    useEffect(() => {
        const toggle = () => setIsGraphOpen((prev: boolean) => !prev);
        window.addEventListener('toggle-graph', toggle);
        return () => window.removeEventListener('toggle-graph', toggle);
    }, []);

    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <NotificationProvider>
                            <Suspense fallback={<PageLoader />}>
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
                                        <Route path="/analytics" element={<AnalyticsPage />} />
                                        <Route path="/network" element={<NetworkPage />} />
                                        <Route path="/achievements" element={<AchievementsPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/courses" element={<CourseLibraryPage />} />
                                        <Route path="/courses/:id" element={<CourseDetailsPage />} />
                                        <Route path="/youtube" element={<YouTubePage />} />
                                        <Route path="/reminders" element={<RemindersPage />} />
                                        <Route path="/still-not-done" element={<StillNotDonePage />} />
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
