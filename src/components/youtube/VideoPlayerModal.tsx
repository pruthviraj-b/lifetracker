import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export function VideoPlayerModal({ video, onClose, onProgressUpdate }: VideoPlayerModalProps) {
    // --- State Management ---
    const [status, setStatus] = useState<'loading' | 'locked' | 'ready' | 'error'>('loading');
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [noteTimestamp, setNoteTimestamp] = useState<number | null>(null);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(video.durationSeconds || 0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAudioOnly, setIsAudioOnly] = useState(false);
    const [isDeepWork, setIsDeepWork] = useState(false);

    // Advanced Features
    const [showBreak, setShowBreak] = useState(false);
    const [breakTimeRemaining, setBreakTimeRemaining] = useState(300);
    const [sessionTime, setSessionTime] = useState(0);
    const [loopStart, setLoopStart] = useState<number | null>(null);
    const [loopEnd, setLoopEnd] = useState<number | null>(null);
    const [isLooping, setIsLooping] = useState(false);

    // Refs for Stability
    // CRITICAL: We use a ref for the player instance to avoid re-renders causing loss of focus
    const playerRef = useRef<any>(null);
    const progressInterval = useRef<any>(null);
    const dbSyncInterval = useRef<any>(null);

    const breakInterval = 1500; // 25 mins

    // --- Initialization Sequence (The "Advanced" Way) ---
    useEffect(() => {
        let isMounted = true;

        const performInitialization = async () => {
            console.log("VideoPlayerModal: Starting Initialization Sequence...");
            setStatus('loading');

            try {
                // Step 1: Fetch Latest Data (Source of Truth)
                const latestData = await YouTubeService.getVideoDetails(video.id);
                const startSeconds = latestData?.watchProgress || video.watchProgress || 0;
                console.log("VideoPlayerModal: DB Fetch Complete. Resuming at:", startSeconds);

                // Step 2: Check Prerequisites
                const met = await CourseService.checkPrerequisitesMet(video.id);
                if (!met) {
                    if (isMounted) setStatus('locked');
                    return;
                }

                // Step 3: Load Notes
                const notesData = await YouTubeService.getNotes(video.id);
                if (isMounted) setNotes(notesData);

                // Step 4: Initialize Player API
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

                    window.onYouTubeIframeAPIReady = () => {
                        if (isMounted) initPlayer(startSeconds);
                    };
                } else {
                    if (isMounted) initPlayer(startSeconds);
                }
            } catch (error) {
                console.error("Initialization Failed:", error);
                if (isMounted) setStatus('error');
            }
        };

        performInitialization();

        const handleUnload = () => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                // Use beacon or synchronous XHR if possible, but for now try best-effort async
                // Note: Modern browsers often block async in unload. 
                // We rely on the frequent 5s interval mostly, but this catches some cases.
                // Ideally we'd use navigator.sendBeacon with a custom API endpoint.
                saveProgressToDB(time);
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            isMounted = false;
            window.removeEventListener('beforeunload', handleUnload); // Cleanup
            if (progressInterval.current) clearInterval(progressInterval.current);
            if (dbSyncInterval.current) clearInterval(dbSyncInterval.current);
            if (playerRef.current && playerRef.current.destroy) {
                try {
                    playerRef.current.destroy();
                } catch (e) { /* ignore cleanup errors */ }
            }
        };
    }, []); // Empty dependency array ensures this runs ONCE on mount

    // --- Player Logic ---

    const initPlayer = (startSeconds: number) => {
        try {
            // Destroy existing instance if any (cleanup)
            if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();

            new window.YT.Player('youtube-player', {
                videoId: video.videoId,
                playerVars: {
                    start: Math.floor(startSeconds), // Force integer timestamp
                    rel: 0,
                    modestbranding: 1,
                    autoplay: 1,
                    controls: 0, // We render our own controls
                    disablekb: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin,
                    playsinline: 1
                },
                events: {
                    onReady: (event: any) => {
                        console.log("VideoPlayerModal: Player Ready. Duration:", event.target.getDuration());
                        playerRef.current = event.target;
                        setDuration(event.target.getDuration());
                        setStatus('ready');
                        startTrackers();

                        // --- BACKGROUND PLAY ENHANCEMENT ---
                        // Integrate with Media Session API to keep audio alive in background/lock screen
                        if ('mediaSession' in navigator) {
                            navigator.mediaSession.metadata = new MediaMetadata({
                                title: video.title,
                                artist: 'LifeTracker Learning', // Channel name if available
                                artwork: [
                                    { src: video.thumbnailUrl || '', sizes: '512x512', type: 'image/jpeg' },
                                    { src: video.thumbnailUrl || '', sizes: '192x192', type: 'image/jpeg' }
                                ]
                            });

                            // Link Lock Screen Controls to Player
                            navigator.mediaSession.setActionHandler('play', () => {
                                event.target.playVideo();
                                setIsPlaying(true);
                            });
                            navigator.mediaSession.setActionHandler('pause', () => {
                                event.target.pauseVideo();
                                setIsPlaying(false);
                            });
                            navigator.mediaSession.setActionHandler('seekbackward', () => seekDelta(-10));
                            navigator.mediaSession.setActionHandler('seekforward', () => seekDelta(10));
                            const defaultSkipMetrics = { seekOffset: 10 };
                            navigator.mediaSession.setActionHandler('previoustrack', () => seekDelta(-10)); // Use skip for tracks
                            navigator.mediaSession.setActionHandler('nexttrack', () => seekDelta(10));
                        }

                        // Force initial sync
                        if (!video.durationSeconds) {
                            YouTubeService.updateProgress(video.id, startSeconds, 'in_progress', event.target.getDuration());
                        }
                    },
                    onStateChange: handlePlayerStateChange,
                    onError: (e: any) => console.error("YouTube Player Error:", e)
                }
            });
        } catch (err) {
            console.error('Player init error:', err);
            setStatus('error');
        }
    };

    const handlePlayerStateChange = (event: any) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
        } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
        } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            handleVideoEnded();
        }
    };

    const startTrackers = () => {
        // High-frequency tracker for UI (10fps)
        progressInterval.current = setInterval(() => {
            const p = playerRef.current;
            if (p && p.getCurrentTime) {
                const time = p.getCurrentTime();
                setCurrentTime(time); // Keeping high precision for seek bars

                // Break Logic
                if (!showBreak && isPlaying) {
                    setSessionTime(prev => {
                        const next = prev + 0.1;
                        if (next >= breakInterval) {
                            pauseVideo();
                            setShowBreak(true);
                            setBreakTimeRemaining(300);
                            return 0;
                        }
                        return next;
                    });
                }

                // Audio-only visualizer mock update (if needed)
            }
        }, 100);

        // Low-frequency tracker for Database Sync (Every 5 seconds)
        dbSyncInterval.current = setInterval(() => {
            const p = playerRef.current;
            if (p && p.getCurrentTime) {
                const time = p.getCurrentTime(); // Save exact float time
                if (time > 0) {
                    // Fire and forget save
                    saveProgressToDB(time); // Removed Math.floor
                }
            }
        }, 5000);
    };

    // --- Controls ---

    const playVideo = () => {
        if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
            setIsPlaying(true);
        }
    };

    const pauseVideo = () => {
        if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
            setIsPlaying(false);
        }
    };

    const togglePlay = () => isPlaying ? pauseVideo() : playVideo();

    const seekTo = (seconds: number) => {
        if (playerRef.current?.seekTo) {
            console.log("Seeking to:", seconds);
            playerRef.current.seekTo(seconds, true);
            playVideo(); // Auto-play after seek
        } else {
            console.warn("Player ref not ready for seek");
        }
    };

    const seekDelta = (delta: number) => {
        if (playerRef.current?.getCurrentTime) {
            const current = playerRef.current.getCurrentTime();
            seekTo(current + delta);
        }
    };

    const toggleMute = () => {
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        }
    };

    const handlePlaybackRate = (delta: number) => {
        if (playerRef.current?.getPlaybackRate) {
            const current = playerRef.current.getPlaybackRate();
            const next = Math.min(2, Math.max(0.25, current + delta));
            playerRef.current.setPlaybackRate(next);
            setPlaybackRate(next);
        }
    };

    // --- Data Handling ---

    const saveProgressToDB = async (time: number) => {
        try {
            const totalDuration = duration || playerRef.current?.getDuration();
            const status = (totalDuration && time >= (totalDuration * 0.95)) ? 'watched' : 'in_progress';
            await YouTubeService.updateProgress(video.id, time, status, totalDuration);
        } catch (e) {
            console.error("Background Save Failed:", e);
        }
    };

    const handleVideoEnded = () => {
        saveProgressToDB(duration);
        onProgressUpdate();
    };

    const handleClose = async () => {
        // Pause and final save
        pauseVideo();
        if (playerRef.current?.getCurrentTime) {
            await saveProgressToDB(Math.floor(playerRef.current.getCurrentTime()));
        }
        onClose();
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const timeToSave = noteTimestamp !== null ? noteTimestamp : Math.floor(currentTime);
        try {
            const note = await YouTubeService.addNote(video.id, timeToSave, newNote);
            setNotes(prev => [...prev, note].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
            setNewNote('');
            setNoteTimestamp(null);
        } catch (e) {
            console.error("Failed to add note:", e);
        }
    };

    // --- Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'j': seekDelta(-10); break;
                case 'l': seekDelta(10); break;
                case 'm': toggleMute(); break;
                case 'f': setIsFocusMode(p => !p); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isMuted]); // Add deps if needed, but functions are stable


    // --- Render Logic ---

    // Locked State
    if (status === 'locked') {
        return createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
                <div className="max-w-md w-full bg-card border rounded-[2rem] p-10 text-center space-y-8 shadow-2xl">
                    <div className="p-8 bg-red-500/10 rounded-full mx-auto w-fit">
                        <Lock className="w-16 h-16 text-red-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold">Content Locked</h2>
                        <p className="text-muted-foreground">Complete prerequisites first.</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={onClose}>Back</Button>
                </div>
            </div>,
            document.body
        );
    }

    // Main Modal
    return createPortal(
        <div className="fixed inset-0 z-[1000] flex flex-col bg-background animate-in fade-in duration-300 overflow-hidden md:overflow-visible">
            {/* Top Bar */}
            {!isFocusMode && (
                <div className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
                    <div className="flex items-center gap-4 truncate">
                        <Button variant="ghost" size="sm" onClick={handleClose}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h2 className="font-bold truncate max-w-xl">{video.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAudioOnly(!isAudioOnly)} className={isAudioOnly ? 'text-primary bg-primary/10' : ''}><Headphones className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsFocusMode(!isFocusMode)}><Maximize2 className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={!isSidebarOpen ? 'text-primary bg-primary/10' : ''}><BookOpen className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="sm" onClick={handleClose}><X className="w-5 h-5" /></Button>
                    </div>
                </div>
            )}

            <div className={cn("flex-1 flex flex-col md:flex-row overflow-hidden", isFocusMode && "bg-black")}>

                {/* Player Container */}
                <div className={cn("flex-1 flex flex-col bg-black relative group", isAudioOnly && "bg-primary/5")}>
                    {/* YouTube Iframe Render Target */}
                    <div className={cn("relative flex-1 flex items-center justify-center", isAudioOnly && "opacity-0 pointer-events-none")}>
                        <div id="youtube-player" className="w-full h-full" />
                    </div>

                    {/* Loading State Overlay */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 text-white space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Synchronizing neural link...</p>
                        </div>
                    )}

                    {/* Audio Only Mode */}
                    {isAudioOnly && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 animate-pulse z-10">
                            <Headphones className="w-32 h-32 text-primary/40" />
                            <h3 className="text-2xl font-bold text-primary">Audio-Only Mode</h3>
                        </div>
                    )}

                    {/* Custom Controls Overlay */}
                    {status === 'ready' && (
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity space-y-4 z-40">
                            {/* Progress Bar */}
                            <div
                                className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer relative group/bar"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pos = (e.clientX - rect.left) / rect.width;
                                    seekTo(pos * duration);
                                }}
                            >
                                <div className="h-full bg-primary relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-6">
                                    <button onClick={togglePlay} className="hover:text-primary transition-colors">
                                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => seekDelta(-10)}><SkipBack className="w-5 h-5 hover:text-primary" /></button>
                                        <button onClick={() => seekDelta(10)}><SkipForward className="w-5 h-5 hover:text-primary" /></button>
                                    </div>
                                    <div className="text-sm font-mono font-bold">
                                        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')} /
                                        {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handlePlaybackRate(0.25)} className="text-xs font-bold font-mono hover:text-primary">{playbackRate}x</button>
                                    <button onClick={toggleMute} className="hover:text-primary">{isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}</button>
                                    <button onClick={() => setIsFocusMode(!isFocusMode)} className="hover:text-primary"><Maximize2 className="w-6 h-6" /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                {isSidebarOpen && !isTheaterMode && (
                    <div className="w-full md:w-96 border-l bg-card flex flex-col max-h-[50vh] md:max-h-none overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                            <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Timestamped Notes</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {notes.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground opacity-50">
                                    <Plus className="w-8 h-8 mx-auto mb-2" />
                                    Starting taking notes...
                                </div>
                            )}
                            {notes.map(note => (
                                <div key={note.id} className="p-3 rounded-xl border bg-background hover:border-primary/50 transition-all shadow-sm group">
                                    <div className="flex items-center justify-between mb-2">
                                        <button onClick={() => seekTo(note.timestampSeconds)} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(note.timestampSeconds / 60)}:{(Math.floor(note.timestampSeconds) % 60).toString().padStart(2, '0')}
                                        </button>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    <p className="text-sm px-1">{note.content}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-muted/30">
                            <form onSubmit={handleAddNote} className="space-y-3">
                                <div className="relative">
                                    <textarea
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        onFocus={() => {
                                            if (noteTimestamp === null) {
                                                // Capture EXACT time from player for frame-perfect seeking
                                                const rawTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : currentTime;
                                                setNoteTimestamp(rawTime);
                                            }
                                        }}
                                        onBlur={() => !newNote.trim() && setNoteTimestamp(null)}
                                        placeholder="Type a note..."
                                        className="w-full min-h-[100px] p-3 rounded-xl bg-background border outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                                    />
                                    {noteTimestamp !== null && (
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold bg-primary/10 text-primary animate-pulse">
                                            @ {Math.floor(noteTimestamp / 60)}:{(Math.floor(noteTimestamp) % 60).toString().padStart(2, '0')}
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={!newNote.trim()}>
                                    <Save className="w-4 h-4 mr-2" /> Save Note
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
