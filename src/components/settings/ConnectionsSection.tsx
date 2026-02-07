import { useState, useEffect } from 'react';
import { Calendar, Youtube, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export function ConnectionsSection() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);
    const [calendarConnected, setCalendarConnected] = useState(false);

    useEffect(() => {
        // Check URL for success flag
        const params = new URLSearchParams(window.location.search);
        if (params.get('calendar_connected') === 'true') {
            setCalendarConnected(true);
            showToast("Google Calendar successfully connected!", "success");
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [showToast]);

    const handleCalendarConnect = async () => {
        setLoading('calendar');
        try {
            await AuthService.connectGoogleCalendar();
        } catch (error: any) {
            console.error(error);
            showToast("Failed to initiate Calendar connection", "error");
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Neural Integrations</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                    Expand your system's capabilities by connecting external data sources.
                    We treat your data with absolute privacy—connections are used strictly for local processing.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Calendar Card */}
                <div className={`
                    relative p-6 rounded-2xl border transition-all duration-300 group overflow-hidden
                    ${calendarConnected
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5'}
                `}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        {calendarConnected && (
                            <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Active
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold">Google Calendar</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Two-way sync for habit scheduling. Completed habits appear on your calendar,
                            and calendar events can trigger habit reminders.
                        </p>
                    </div>

                    <Button
                        variant={calendarConnected ? "outline" : "default"}
                        className={`w-full justify-between group-hover:translate-y-0 transition-all ${calendarConnected ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        onClick={handleCalendarConnect}
                        disabled={loading === 'calendar' || calendarConnected}
                    >
                        {loading === 'calendar' ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</span>
                        ) : calendarConnected ? (
                            "Configuration Active"
                        ) : (
                            <>
                                Connect Calendar <ExternalLink className="w-4 h-4 opacity-50" />
                            </>
                        )}
                    </Button>
                </div>

                {/* YouTube Learning Card */}
                <div className="relative p-6 rounded-2xl border border-border bg-card hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-red-600/10 text-red-600 rounded-xl">
                            <Youtube className="w-6 h-6" />
                        </div>
                        <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                            Beta
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold">YouTube Learning</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Turn watch history into learning protocols. Automatically generate flashcards
                            and notes from educational content you consume.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-red-600/5 hover:text-red-600 hover:border-red-600/20"
                        onClick={() => navigate('/youtube')}
                    >
                        Access Module <ExternalLink className="w-4 h-4 opacity-50" />
                    </Button>
                </div>
            </div>

            {/* Privacy Note */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide">Privacy Protocol</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Redirects for authentication occur securely via OAuth 2.0. We request only the specific
                        permissions needed for the features you enable (e.g., calendar access).
                        You can revoke access at any time via your Google Account settings.
                    </p>
                </div>
            </div>
        </div>
    );
}
