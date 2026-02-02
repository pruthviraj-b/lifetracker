import React from 'react';
import {
    Award,
    Download,
    Share2,
    X,
    CheckCircle2,
    Calendar,
    Trophy,
    GraduationCap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LearningCourse, CourseSeriesStats } from '../../types/youtube';

interface CourseCertificateProps {
    course: LearningCourse;
    stats: CourseSeriesStats;
    userName: string;
    onClose: () => void;
}

export function CourseCertificate({ course, stats, userName, onClose }: CourseCertificateProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-card to-background border-4 border-primary/20 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Content */}
                <div className="p-12 text-center space-y-10">
                    <div className="space-y-4">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Award className="w-12 h-12 text-primary" />
                            <div className="absolute inset-0 border-2 border-primary border-dashed rounded-full animate-spin-slow" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Mastery unlocked</h1>
                        <p className="text-muted-foreground text-lg">Official Completion Certificate</p>
                    </div>

                    <div className="py-10 border-y border-dashed space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">This certifies that</p>
                            <h2 className="text-3xl font-bold">{userName || 'Master Learner'}</h2>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">has successfully completed</p>
                            <h3 className="text-2xl font-black text-foreground">{course.title}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lessons</div>
                            <div className="font-bold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {stats.totalVideos}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Experience</div>
                            <div className="font-bold flex items-center justify-center gap-1">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                Mastered
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certified on</div>
                            <div className="font-bold flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <Button className="flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg">
                            <Download className="w-5 h-5 mr-3" />
                            Save Digital ID
                        </Button>
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg">
                            <Share2 className="w-5 h-5 mr-3" />
                            Share Progress
                        </Button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-tr-[5rem] -z-10" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -z-10" />
            </div>
        </div>
    );
}
