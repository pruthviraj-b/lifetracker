import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertCircle, CheckCircle2, Calendar as CalendarIcon, Clock, Home } from 'lucide-react';
import { HabitService } from '../services/habit.service';
import { useTheme } from '../context/ThemeContext';

export default function StillNotDonePage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [arrears, setArrears] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadArrears();
    }, []);

    const loadArrears = async () => {
        try {
            const data = await HabitService.getArrears();
            setArrears(data);
        } catch (error) {
            console.error("Failed to load arrears:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (habitId: string, date: string) => {
        try {
            await HabitService.skipHabit(habitId, date, "Acknowledged from Arrears");
            setArrears(prev => prev.filter(a => !(a.habitId === habitId && a.date === date)));
        } catch (error) {
            console.error(error);
            alert("Failed to acknowledge");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 max-w-2xl mx-auto p-4 md:p-8 space-y-12">
                {/* Header */}
                <div className={`flex items-center gap-4 ${isWild ? 'animate-reveal' : ''}`}>
                    <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                        <Home className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className={`text-4xl font-black uppercase tracking-tighter flex items-center gap-3 ${isWild ? 'animate-glitch' : ''}`}>
                            <AlertCircle className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-red-500'}`} />
                            System Arrears
                        </h1>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-70">Unresolved Protocol Disruptions</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Clock className="w-12 h-12 text-muted-foreground animate-pulse" />
                        <p className="text-muted-foreground">Calculating arrears...</p>
                    </div>
                ) : arrears.length === 0 ? (
                    <div className={`text-center py-20 space-y-8 border border-dashed ${isWild ? 'bg-black border-primary/20 rounded-none' : 'bg-card rounded-2xl border-muted-foreground/20'}`}>
                        <div className={`p-6 w-fit mx-auto ${isWild ? 'border-2 border-primary text-primary' : 'bg-green-500/10 rounded-full text-green-500'}`}>
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isWild ? 'text-primary' : ''}`}>Systems Nominal</h2>
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-60 max-w-xs mx-auto">
                                No protocol lapses detected in current cycle. Efficiency maintained.
                            </p>
                        </div>
                        <Button onClick={() => navigate('/')} variant="outline" className={isWild ? 'rounded-none border-2' : ''}>
                            Return to Hub
                        </Button>
                    </div>
                ) : (
                    <div className={`space-y-4 ${isWild ? 'animate-reveal' : ''}`}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                                Outstanding_Lapses [{arrears.length}]
                            </h2>
                        </div>

                        <div className="grid gap-3">
                            {arrears.map((item, index) => (
                                <div
                                    key={`${item.habitId}-${item.date}-${index}`}
                                    className={`group flex items-center justify-between p-5 border transition-all duration-300 ${isWild ? 'bg-black border-primary/20 rounded-none hover:border-primary shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]' : 'bg-card border-border rounded-xl hover:border-primary/50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 ${isWild ? 'border-2 border-primary/20 text-primary' : (item.priority === 'high' ? 'bg-red-500/10 text-red-500 rounded-lg' :
                                            item.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 rounded-lg' :
                                                'bg-blue-500/10 text-blue-500 rounded-lg')
                                            }`}>
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={`font-black uppercase tracking-tighter text-lg ${isWild ? 'text-primary' : ''}`}>{item.title}</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2 opacity-60">
                                                <span className={isWild ? 'text-primary' : 'text-foreground/80'}>{formatDate(item.date)}</span>
                                                <span className="opacity-40">•</span>
                                                <span>Protocol_Lapse</span>
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAcknowledge(item.habitId, item.date)}
                                        className={`transition-all ${isWild ? 'rounded-none border-2 hover:bg-primary/20 hover:text-primary opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    >
                                        Acknowledge
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 text-center">
                            <p className="text-xs text-muted-foreground">
                                Tips: Acknowledging a missed habit helps maintain mental clarity
                                without breaking your spirit. Be honest with yourself!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
