import { useState } from 'react';
import { Button } from '../ui/Button';
import { Mood } from '@/types/habit';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface DailyCheckinProps {
    onSave: (mood: Mood, note: string) => void;
}

export function DailyCheckin({ onSave }: DailyCheckinProps) {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [mood, setMood] = useState<Mood | null>(null);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (mood) {
            onSave(mood, note);
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className={`p-8 border-2 text-center space-y-4 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card border-border rounded-xl shadow-sm'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isWild ? 'bg-primary text-black' : 'bg-primary/10 text-primary'}`}>
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Reflection Transmitted</h3>
                <p className="text-sm text-muted-foreground uppercase font-bold opacity-70">Protocol sequence saved to deep intelligence.</p>
                <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className={isWild ? 'rounded-none hover:bg-primary hover:text-black uppercase font-black' : ''}>
                    Modify
                </Button>
            </div>
        );
    }

    return (
        <div className={`space-y-8 p-8 border-2 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card border-border rounded-xl shadow-lg'}`}>
            <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tighter">System Reflection</h3>
                <p className="text-sm text-muted-foreground uppercase font-bold opacity-70 tracking-widest">Evaluate current mental state protocol.</p>
            </div>

            <div className="flex justify-between gap-2">
                {[
                    { val: 'great', icon: '😁', label: 'Great' },
                    { val: 'good', icon: '🙂', label: 'Good' },
                    { val: 'neutral', icon: '😐', label: 'Okay' },
                    { val: 'tired', icon: '😴', label: 'Tired' },
                    { val: 'stressed', icon: '😫', label: 'Stressed' },
                ].map((item) => (
                    <button
                        key={item.val}
                        onClick={() => setMood(item.val as Mood)}
                        className={`
                            flex-1 flex flex-col items-center gap-3 p-4 border-2 transition-all
                            ${isWild ? 'rounded-none' : 'rounded-2xl'}
                            ${mood === item.val
                                ? (isWild ? 'bg-primary text-black border-primary' : 'bg-primary/5 border-primary ring-1 ring-primary')
                                : (isWild ? 'bg-black border-white/20 text-white/40 hover:border-primary/50' : 'bg-background border-input hover:border-primary/50')
                            }
                        `}
                    >
                        <span className={`text-3xl transition-all ${mood === item.val ? 'scale-125' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}>{item.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter block md:hidden mt-1">{item.label}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter hidden md:block">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Log Entry [Manual_Override]</label>
                <textarea
                    className={`w-full min-h-[120px] p-4 border-2 resize-none focus:outline-none transition-all ${isWild ? 'bg-black border-primary/50 text-white font-mono focus:border-primary rounded-none' : 'bg-background border-input rounded-xl focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="Input thought sequence..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!mood}
                    className={isWild ? 'rounded-none font-black uppercase italic tracking-tighter' : ''}
                >
                    Transmit Protocol
                </Button>
            </div>
        </div>
    );
}
