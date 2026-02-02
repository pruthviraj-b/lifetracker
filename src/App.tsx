
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import LandingPage from './pages/LandingPage';

import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import NotesPage from './pages/NotesPage';
import RemindersPage from './pages/RemindersPage';
import StillNotDonePage from './pages/StillNotDonePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import YouTubePage from './pages/YouTubePage';
import NetworkPage from './pages/NetworkPage';
import AchievementsPage from './pages/AchievementsPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <Routes>
                            {/* Public Routes - Only accessible if NOT logged in */}
                            <Route path="/login" element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            } />

                            <Route path="/signup" element={
                                <PublicRoute>
                                    <SignupPage />
                                </PublicRoute>
                            } />

                            {/* Protected Routes - Only accessible if logged in */}
                            <Route path="/home" element={
                                <ProtectedRoute>
                                    <HomePage />
                                </ProtectedRoute>
                            } />

                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/notes" element={
                                <ProtectedRoute>
                                    <NotesPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/reminders" element={
                                <ProtectedRoute>
                                    <RemindersPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/analytics" element={
                                <ProtectedRoute>
                                    <AnalyticsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/settings" element={
                                <ProtectedRoute>
                                    <SettingsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/still-not-done" element={
                                <ProtectedRoute>
                                    <StillNotDonePage />
                                </ProtectedRoute>
                            } />

                            <Route path="/youtube" element={
                                <ProtectedRoute>
                                    <YouTubePage />
                                </ProtectedRoute>
                            } />

                            <Route path="/network" element={
                                <ProtectedRoute>
                                    <NetworkPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/achievements" element={
                                <ProtectedRoute>
                                    <AchievementsPage />
                                </ProtectedRoute>
                            } />

                            {/* Default Root - Landing Page (accessible to all, acts as splash) */}
                            <Route path="/" element={<LandingPage />} />
                        </Routes>
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
