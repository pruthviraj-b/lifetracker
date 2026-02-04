import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, Trash2, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { DataService } from '../../services/data.service';
import { HabitService } from '../../services/habit.service';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PythonCourseData } from '../../data/python-course';
import { DSACourseData } from '../../data/dsa-course';
import { WebDatabasesCourseData } from '../../data/web-databases-course';
import { GitProjectsCourseData } from '../../data/git-projects-course';
import { SoftSkillsCourseData } from '../../data/soft-skills-course';
import { AptitudeInterviewsCourseData } from '../../data/aptitude-interviews-course';
import { ResumePortfolioCourseData } from '../../data/resume-portfolio-course';
import { SeedAcademyData } from '../debug/SeedAcademyData';
import { NoteService } from '../../services/note.service';
import { CourseService } from '../../services/course.service';

export function DataSection() {
    const { showToast } = useToast();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ habits: number; logs: number; estimatedSize: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [installing, setInstalling] = useState(false); // New state
    const [importing, setImporting] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const s = await DataService.getStorageUsage();
        setStats(s);
    };

    const handleResetAccount = async () => {
        try {
            setLoading(true);
            setConfirmReset(false);

            // 1. Wipe Backend Data
            await HabitService.resetAccount();
            await CourseService.resetAllAcademyData();

            // 2. Wipe Local Data (Fixes Notes/Video persistence)
            localStorage.clear();
            sessionStorage.clear();

            // 3. Wipe Service Worker Caches (PWA)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            showToast("System Reset Complete", "All data has been wiped.", { type: 'success' });

            // 4. Force Hard Reload
            setTimeout(() => window.location.href = '/', 1000);

        } catch (error) {
            console.error(error);
            showToast("Reset Failed", "Could not wipe data completely.", { type: 'error' });
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            await DataService.downloadExport();
            showToast("Data exported successfully", "success");
        } catch (error) {
            showToast("Failed to export data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInstallCourse = async (courseData: any, courseName: string) => {
        try {
            setInstalling(true);
            const { habit, note } = courseData;

            // 1. Create Habit (Personal Tracker)
            await HabitService.createHabit(habit as any);

            // 2. Create Syllabus Note (Personal Roadmap)
            await NoteService.createNote(note);

            // 3. Ensure Course exists in Academy DB (Seeding)
            // Extract a thumbnail from the note or use a default one based on course name
            const thumbnail = courseName.includes('Python') ? "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800"
                : courseName.includes('DSA') ? "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800"
                    : courseName.includes('Web') ? "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=800"
                        : courseName.includes('Git') ? "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800"
                            : courseName.includes('Soft') ? "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
                                : courseName.includes('Aptitude') ? "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800"
                                    : "https://images.unsplash.com/photo-1586281380117-0a632d671f98?auto=format&fit=crop&q=80&w=800"; // Resume/Default

            const tags = note.title.toLowerCase().split(' ').filter((w: string) => w.length > 3);

            // Use CourseService to seed if missing
            // We need to extend the CourseService first to include this method, which we did.
            // Casting to 'any' to avoid TS errors            // 3. Ensure Course exists in Academy DB (Seeding) and FORCE UPDATE content
            // We pass 'true' to force content update so that new resources/syllabus changes are reflected.
            // This might reset lesson progress if IDs regenerate, but it ensures "Perfect" content.
            const courseId = await (CourseService as any).ensureCourseExists(courseData, thumbnail, "Intermediate", tags, true);

            // 4. Enroll User in Academy Course
            try {
                await CourseService.enrollInCourse(courseId);
            } catch (e) {
                // Ignore unique constraint violation if already enrolled
                console.warn("Already enrolled or enrollment failed", e);
            }

            showToast(`${courseName} Installed!`, "Added to Academy & Notes successfully.", { type: 'success' });
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error(error);
            showToast("Install Failed", error.message || "Could not install course.", { type: 'error' });
        } finally {
            setInstalling(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            const text = await file.text();
            await DataService.importData(text);
            showToast("Data imported successfully! Reloading...", "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            console.error(error);
            showToast("Import Failed", error.message || "Invalid file format", { type: "error" });
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold mb-1">Data Management</h2>
                <p className="text-sm text-muted-foreground">Control your data, export backups, or import from other devices.</p>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-6">
                {/* Usage Stats */}
                <div className="grid grid-cols-3 gap-4 text-center pb-6 border-b">
                    <div>
                        <div className="text-2xl font-bold">{stats?.habits || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Habits</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats?.logs || 0}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">History Logs</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats?.estimatedSize || '0 KB'}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Est. Size</div>
                    </div>
                </div>

                {/* Course Installation Section */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">📚 Install Learning Courses</h3>
                        <p className="text-xs text-muted-foreground">
                            Install curated 60-day learning tracks with habits and syllabus notes.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Button
                            onClick={() => handleInstallCourse(PythonCourseData, "Python Mastery")}
                            disabled={installing || loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Python
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(DSACourseData, "DSA Mastery")}
                            disabled={installing || loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            DSA
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(WebDatabasesCourseData, "Web & Databases")}
                            disabled={installing || loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Web & DB
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(GitProjectsCourseData, "Git & Projects")}
                            disabled={installing || loading}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Git & Projects
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(SoftSkillsCourseData, "Soft Skills")}
                            disabled={installing || loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Soft Skills
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(AptitudeInterviewsCourseData, "Aptitude & Interviews")}
                            disabled={installing || loading}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Aptitude
                        </Button>
                        <Button
                            onClick={() => handleInstallCourse(ResumePortfolioCourseData, "Resume & Portfolio")}
                            disabled={installing || loading}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white sm:col-span-2 lg:col-span-3"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Resume & Portfolio
                        </Button>
                    </div>
                </div>

                {/* Export/Import Actions */}
                <div className="pt-4 border-t space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">💾 Backup & Restore</h3>
                        <p className="text-xs text-muted-foreground">
                            Export your data or import from another device.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" onClick={handleExport} disabled={loading} className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                        </Button>
                        <div className="relative flex-1">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                disabled={importing}
                            />
                            <Button variant="outline" className="w-full" disabled={importing}>
                                <Upload className="w-4 h-4 mr-2" />
                                {importing ? 'Importing...' : 'Import JSON'}
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        Importing data will merge new entries with your existing data. Duplicate IDs will be updated.
                    </p>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border-2 border-red-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider text-xs">
                    <Trash2 className="w-4 h-4" />
                    Danger Zone
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        Permanently delete all habits, history, and user data. This action cannot be undone.
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => setConfirmReset(true)}
                        className="w-full sm:w-auto bg-red-500 hover:bg-red-600 border-none"
                    >
                        Factory Reset
                    </Button>
                </div>

                {/* Admin Tools - Hidden from normal users ideally, but visible for now */}
                <div className="mt-8 pt-8 border-t border-red-500/10">
                    <h4 className="text-xs font-mono text-muted-foreground uppercase mb-4">Admin / Developer Tools</h4>
                    <SeedAcademyData />
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmReset}
                title="Factory Reset?"
                message="This will permanently delete ALL your habits, logs, notes, and achievements. You will essentially start from scratch. Are you absolutely sure?"
                confirmText="Yes, Delete Everything"
                isDestructive
                onConfirm={handleResetAccount}
                onCancel={() => setConfirmReset(false)}
            />
        </div>
    );
}
