import { Button } from '../ui/Button';
import {
    X,
    BookOpen,
    Clock,
    History,
    Youtube,
    ExternalLink,
    FileText
} from 'lucide-react';
import { YouTubeVideo, VideoNote } from '../../types/youtube';
import { YouTubeService } from '../../services/youtube.service';
import { useEffect, useState } from 'react';

interface QuickViewModalProps {
    video: YouTubeVideo;
    onClose: () => void;
    onOpenPlayer: () => void;
}

export function QuickViewModal({ video, onClose, onOpenPlayer }: QuickViewModalProps) {
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, [video.id]);

    const loadNotes = async () => {
        try {
            const data = await YouTubeService.getNotes(video.id);
            setNotes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Youtube className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold line-clamp-1">{video.title}</h2>
                            <p className="text-xs text-muted-foreground">Quick Preview • {notes.length} Notes</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Video Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="rounded-xl border shadow-sm aspect-video object-cover"
                        />
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-sm font-medium">{video.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
                                <div className="text-sm font-bold">{Math.round((video.watchProgress / (video.durationSeconds || 1)) * 100)}% Complete</div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${(video.watchProgress / (video.durationSeconds || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <Button className="w-full" onClick={onOpenPlayer}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Full Player
                            </Button>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-primary">
                            <History className="w-4 h-4" />
                            Saved Insights
                        </h3>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-2xl opacity-50">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm">No notes captured for this video yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map((note) => (
                                    <div key={note.id} className="p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(note.timestampSeconds)}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={onOpenPlayer}>Study Now</Button>
                </div>
            </div>
        </div>
    );
}
