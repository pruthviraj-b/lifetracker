import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/Button';
import {
    X,
    BookOpen,
    Clock,
    History,
    Save,
    Plus,
    Tag,
    Trash2,
    Youtube,
    ArrowLeft,
    Maximize2,
    Minimize2,
    Lock,
    AlertCircle,
    Repeat,
    Zap,
    Volume2,
    VolumeX,
    Monitor,
    Headphones,
    SkipBack,
    SkipForward,
    Play,
    Pause,
    ChevronLeft,
    ChevronRight,
    Coffee,
    ShieldAlert,
    Ban
} from 'lucide-react';
import { YouTubeVideo, VideoNote } from '../../types/youtube';
import { YouTubeService } from '../../services/youtube.service';
import { CourseService } from '../../services/course.service';

interface VideoPlayerModalProps {
    video: YouTubeVideo;
    onClose: () => void;
    onProgressUpdate: () => void;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export function VideoPlayerModal({ video, onClose, onProgressUpdate }: VideoPlayerModalProps) {
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [player, setPlayer] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAudioOnly, setIsAudioOnly] = useState(false);
    const [isDeepWork, setIsDeepWork] = useState(false);
    const [showBreak, setShowBreak] = useState(false);
    const [breakTimeRemaining, setBreakTimeRemaining] = useState(300); // 5 mins
    const [sessionTime, setSessionTime] = useState(0);
    const [breakInterval] = useState(1500); // 25 mins

    // A-B Looping
    const [loopStart, setLoopStart] = useState<number | null>(null);
    const [loopEnd, setLoopEnd] = useState<number | null>(null);
    const [isLooping, setIsLooping] = useState(false);

    const progressInterval = useRef<any>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        checkLockAndLoad();
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [video.id, player, loopStart, loopEnd, isLooping, isTheaterMode, isAudioOnly]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts if focus is in a textarea or input
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

        if (!player) return;

        switch (e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                break;
            case 'j':
                seekDelta(-10);
                break;
            case 'l':
                seekDelta(10);
                break;
            case 'm':
                toggleMute();
                break;
            case 'f':
                setIsFocusMode(prev => !prev);
                break;
            case 't':
                setIsTheaterMode(prev => !prev);
                break;
            case '>':
            case '.':
                if (e.shiftKey) changePlaybackRate(0.25);
                else seekDelta(0.033); // Small frame jump
                break;
            case '<':
            case ',':
                if (e.shiftKey) changePlaybackRate(-0.25);
                else seekDelta(-0.033); // Small frame jump back
                break;
            case '[':
                setLoopStart(currentTime);
                break;
            case ']':
                setLoopEnd(currentTime);
                setIsLooping(true);
                break;
            case 'r':
                resetLoop();
                break;
        }
    }, [player, currentTime]);

    const checkLockAndLoad = async () => {
        setLoading(true);
        try {
            const met = await CourseService.checkPrerequisitesMet(video.id);
            if (!met) {
                setIsLocked(true);
                setLoading(false);
                return;
            }
            setIsLocked(false);
            loadNotes();
            loadYouTubeAPI();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const loadNotes = async () => {
        try {
            const data = await YouTubeService.getNotes(video.id);
            setNotes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadYouTubeAPI = () => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => initPlayer();
        } else {
            initPlayer();
        }
    };

    const initPlayer = () => {
        try {
            new window.YT.Player('youtube-player', {
                videoId: video.videoId,
                playerVars: {
                    start: video.watchProgress || 0,
                    rel: 0,
                    modestbranding: 1,
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1, // We use our own keys
                    iv_load_policy: 3, // Block annotations
                    origin: window.location.origin
                },
                events: {
                    onReady: (event: any) => {
                        const duration = Math.floor(event.target.getDuration());
                        setLoading(false);
                        setPlayer(event.target);
                        playerRef.current = event.target;
                        startProgressTracking(event.target);
                        if (!video.durationSeconds) {
                            YouTubeService.updateProgress(video.id, video.watchProgress || 0, video.status, duration);
                        }
                    },
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            handleVideoEnded();
                            setIsPlaying(false);
                        } else if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                        } else {
                            setIsPlaying(false);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Player init error:', err);
        }
    };

    const startProgressTracking = (p: any) => {
        progressInterval.current = setInterval(() => {
            if (p && p.getCurrentTime) {
                const time = p.getCurrentTime();
                setCurrentTime(Math.floor(time));

                // Session/Break Logic
                if (!showBreak && isPlaying) {
                    setSessionTime(prev => {
                        const next = prev + 0.1;
                        if (next >= breakInterval) {
                            setIsPlaying(false);
                            p.pauseVideo();
                            setShowBreak(true);
                            setBreakTimeRemaining(300);
                            return 0;
                        }
                        return next;
                    });
                }

                if (showBreak) {
                    setBreakTimeRemaining(prev => {
                        if (prev <= 0) {
                            setShowBreak(false);
                            return 300;
                        }
                        return prev - 0.1;
                    });
                }

                // A-B Loop Logic
                if (isLooping && loopStart !== null && loopEnd !== null) {
                    if (time >= loopEnd) {
                        p.seekTo(loopStart, true);
                    }
                }

                if (Math.floor(time) % 10 === 0 && Math.floor(time) > 0) {
                    saveProgress(Math.floor(time), Math.floor(p.getDuration()));
                }
            }
        }, 100); // Higher frequency for loop and frame precision
    };

    const togglePlay = () => {
        if (!player) return;
        if (isPlaying) player.pauseVideo();
        else player.playVideo();
    };

    const seekDelta = (delta: number) => {
        if (!player) return;
        const newTime = player.getCurrentTime() + delta;
        player.seekTo(newTime, true);
    };

    const toggleMute = () => {
        if (!player) return;
        if (isMuted) {
            player.unMute();
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };

    const changePlaybackRate = (delta: number) => {
        if (!player) return;
        const currentRate = player.getPlaybackRate();
        const nextRate = Math.min(3, Math.max(0.25, currentRate + delta));
        player.setPlaybackRate(nextRate);
        setPlaybackRate(nextRate);
    };

    const resetLoop = () => {
        setLoopStart(null);
        setLoopEnd(null);
        setIsLooping(false);
    };

    const saveProgress = async (time: number, duration?: number) => {
        try {
            const videoDuration = duration || video.durationSeconds || player?.getDuration();
            const status = (videoDuration && time >= (videoDuration * 0.95)) ? 'watched' : 'in_progress';
            await YouTubeService.updateProgress(video.id, time, status, videoDuration);
        } catch (error) {
            console.error('Progress save error:', error);
        }
    };

    const handleVideoEnded = async () => {
        try {
            await YouTubeService.updateProgress(video.id, currentTime, 'watched');
            onProgressUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const timestamp = Math.round(player?.getCurrentTime() || currentTime);
        try {
            const note = await YouTubeService.addNote(video.id, timestamp, newNote);
            setNotes(prev => [...prev, note].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
            setNewNote('');
        } catch (error) {
            console.error(error);
        }
    };

    const seekTo = (seconds: number) => {
        if (player) {
            player.seekTo(seconds, true);
            player.playVideo();
        }
    };

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
                <div className="max-w-md w-full bg-card border rounded-[2rem] p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="relative w-fit mx-auto">
                        <div className="p-8 bg-red-500/10 rounded-full">
                            <Lock className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 p-2 bg-card border rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold">Content Locked</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            This video is part of a <strong>Structured Curriculum</strong>.
                            You must complete all prerequisite lessons before unlocking this mastery segment.
                        </p>
                    </div>
                    <div className="pt-4 flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onClose}>
                            Back to Hub
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20" onClick={onClose}>
                            View Sequence
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-300">
            {/* Top Bar */}
            {!isFocusMode && (
                <div className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
                    <div className="flex items-center gap-4 truncate">
                        <Button variant="ghost" size="sm" onClick={() => {
                            saveProgress(currentTime);
                            onClose();
                        }}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3 truncate">
                            <Youtube className="w-6 h-6 text-red-500 shrink-0" />
                            <h2 className="font-bold truncate max-w-xl">{video.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAudioOnly(!isAudioOnly)}
                            className={isAudioOnly ? 'text-primary bg-primary/10' : ''}
                            title="Audio only mode"
                        >
                            <Headphones className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsTheaterMode(!isTheaterMode)}
                            className={isTheaterMode ? 'text-primary bg-primary/10' : ''}
                            title="Theater mode"
                        >
                            <Monitor className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={isFocusMode ? 'text-primary bg-primary/10' : ''}
                            title="Focus mode"
                        >
                            {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={!isSidebarOpen ? 'text-primary bg-primary/10' : ''}
                            title="Toggle Notes"
                        >
                            <BookOpen className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDeepWork(!isDeepWork)}
                            className={isDeepWork ? 'text-red-500 bg-red-500/10' : ''}
                            title="Deep Work mode (No distractions)"
                        >
                            <ShieldAlert className={isDeepWork ? "w-5 h-5 animate-pulse" : "w-5 h-5"} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} disabled={isDeepWork}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex overflow-hidden ${isFocusMode ? 'bg-black' : ''}`}>

                {/* Player Section */}
                <div className={`flex-1 flex flex-col bg-black relative group ${isAudioOnly ? 'bg-primary/5' : ''}`}>
                    <div className={`relative flex-1 flex items-center justify-center transition-all ${isAudioOnly ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div id="youtube-player" className="w-full h-full" />
                    </div>

                    {/* Audio Only Visualizer Mock */}
                    {isAudioOnly && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-pulse">
                            <Headphones className="w-32 h-32 text-primary/40" />
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold text-primary">Audio-Only Mode</h3>
                                <p className="text-muted-foreground">Distraction-free learning active</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="w-1 bg-primary/40 rounded-full" style={{ height: `${Math.random() * 40 + 10}px` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity space-y-4">
                        {/* Progress Bar Mock */}
                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer relative">
                            <div
                                className="h-full bg-primary relative"
                                style={{ width: `${(currentTime / (video.durationSeconds || 1)) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
                            </div>
                            {/* A-B Loop Markers */}
                            {loopStart !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 z-10"
                                    style={{ left: `${(loopStart / (video.durationSeconds || 1)) * 100}%` }}
                                />
                            )}
                            {loopEnd !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-yellow-500 z-10"
                                    style={{ left: `${(loopEnd / (video.durationSeconds || 1)) * 100}%` }}
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="hover:text-primary transition-colors">
                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                                </button>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => seekDelta(-10)} className="hover:text-primary transition-colors"><SkipBack className="w-5 h-5" /></button>
                                    <button onClick={() => seekDelta(10)} className="hover:text-primary transition-colors"><SkipForward className="w-5 h-5" /></button>
                                </div>
                                <div className="text-sm font-bold font-mono">
                                    {formatTime(currentTime)} / {formatTime(video.durationSeconds || 0)}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                                    <button onClick={() => changePlaybackRate(-0.25)} className="hover:text-primary"><ChevronLeft className="w-4 h-4" /></button>
                                    <span className="text-xs font-bold w-12 text-center flex items-center justify-center gap-1">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        {playbackRate}x
                                    </span>
                                    <button onClick={() => changePlaybackRate(0.25)} className="hover:text-primary"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-8 rounded-lg border border-white/10", isLooping ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : "bg-white/5 text-white")}
                                        onClick={() => setIsLooping(!isLooping)}
                                        title="Toggle Loop"
                                    >
                                        <Repeat className="w-4 h-4 mr-2" />
                                        A-B Loop
                                    </Button>
                                    {(loopStart !== null || loopEnd !== null) && (
                                        <button onClick={resetLoop} className="p-1 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                    )}
                                </div>
                                <button onClick={toggleMute} className="hover:text-primary transition-colors">
                                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <button onClick={() => setIsFocusMode(!isFocusMode)} className="hover:text-primary transition-colors">
                                    <Maximize2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {isFocusMode && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button variant="outline" size="sm" className="bg-black/50 border-white/20 text-white" onClick={() => setIsFocusMode(false)}>
                                <Minimize2 className="w-4 h-4 mr-2" />
                                Exit Focus
                            </Button>
                            <Button variant="outline" size="sm" className="bg-black/50 border-white/20 text-white" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    {/* Distraction Shields */}
                    {(isFocusMode || isDeepWork) && (
                        <div className="absolute inset-0 pointer-events-none z-10 border-[16px] border-black/5 rounded-none" />
                    )}

                    {/* Break Overlay */}
                    {showBreak && (
                        <div className="absolute inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="p-10 bg-primary/10 rounded-full relative">
                                <Coffee className="w-20 h-20 text-primary animate-bounce" />
                                <div className="absolute inset-0 border-4 border-primary border-dashed rounded-full animate-spin-slow opacity-20" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Time for a break</h2>
                                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                                    You've been in deep focus for {Math.floor(breakInterval / 60)} minutes.
                                    Step away, stretch, and reset your mind.
                                </p>
                            </div>
                            <div className="text-6xl font-black font-mono tracking-widest text-primary">
                                {Math.floor(breakTimeRemaining / 60)}:{(Math.floor(breakTimeRemaining % 60)).toString().padStart(2, '0')}
                            </div>
                            <Button
                                className="h-16 px-10 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/20"
                                onClick={() => setShowBreak(false)}
                            >
                                Skip Break & Resume
                            </Button>
                        </div>
                    )}

                    {/* Deep Work Indicators */}
                    {isDeepWork && (
                        <div className="absolute top-6 left-6 p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl flex items-center gap-4 animate-in slide-in-from-left duration-500 z-50">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            <div className="space-y-0.5">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">System Lock Active</div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <Ban className="w-4 h-4" />
                                    Deep Work: {Math.floor((breakInterval - sessionTime) / 60)}m left
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Sidebar (Notes) */}
                {isSidebarOpen && !isTheaterMode && (
                    <div className="w-96 border-l bg-card flex flex-col animate-in slide-in-from-right duration-300 shrink-0">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                            <h3 className="font-bold flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                Timestamped Notes
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {notes.length} total
                            </span>
                        </div>

                        {/* Notes List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {notes.length === 0 ? (
                                <div className="text-center py-12 space-y-3 opacity-50">
                                    <Plus className="w-8 h-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm">No notes yet. Start typing below to capture a thought at the current time.</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="group p-3 rounded-xl border bg-background hover:border-primary/50 transition-all shadow-sm"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <button
                                                onClick={() => seekTo(note.timestampSeconds)}
                                                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                            >
                                                <Clock className="w-3 h-3" />
                                                {formatTime(note.timestampSeconds)}
                                            </button>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 hover:bg-muted rounded"><Tag className="w-3 h-3" /></button>
                                                <button className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Note Input Area */}
                        <div className="p-4 border-t bg-muted/30">
                            <form onSubmit={handleAddNote} className="space-y-3">
                                <div className="relative">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Type a note... (Auto-captures timestamp)"
                                        className="w-full min-h-[100px] p-3 rounded-xl bg-background border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                                    />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold">
                                        @ {formatTime(currentTime)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setNewNote(prev => prev + ' #important')} className="h-7 px-2 text-[10px] font-bold">#IMP</Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setNewNote(prev => prev + ' #review')} className="h-7 px-2 text-[10px] font-bold">#REVIEW</Button>
                                    </div>
                                    <Button type="submit" className="px-4 py-2 shadow-lg shadow-primary/20" disabled={!newNote.trim()}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Note
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
