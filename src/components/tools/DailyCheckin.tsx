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
            <div className={`p-6 border-2 text-center space-y-4 ${isWild ? 'bg-black border-red-600 rounded-none' : 'bg-card border-border rounded-xl shadow-sm'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-4 ${isWild ? 'bg-black text-red-600 border-red-600' : 'bg-primary/10 text-primary border-transparent'}`}>
                    <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${isWild ? 'text-white' : ''}`}>TRANSIMISSION COMPLETE</h3>
                    <p className={`text-xs uppercase font-bold tracking-widest ${isWild ? 'text-red-600' : 'text-muted-foreground'}`}>Protocol sequence transmitted to neural core.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className={isWild ? 'rounded-none bg-red-900/10 text-red-500 hover:bg-red-600 hover:text-black uppercase font-black tracking-widest border border-red-900/50 w-full' : ''}>
                    MODIFY LOG
                </Button>
            </div>
        );
    }

    return (
        <div className={`space-y-3 p-4 border-2 max-w-2xl ${isWild ? 'bg-black border-red-600 rounded-none' : 'bg-card border-border rounded-xl shadow-lg'}`}>
            <div className="space-y-2 border-l-4 border-red-600 pl-4">
                <h3 className={`text-lg font-black uppercase tracking-tighter flex items-center gap-2 ${isWild ? 'text-red-600' : ''}`}>
                    DAILY LOG
                </h3>
                <p className={`text-[10px] uppercase font-bold tracking-[0.2em] ${isWild ? 'text-white/60' : 'text-muted-foreground'}`}>
                    EVALUATE_NEURAL_STATE // DAILY_LOG
                </p>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
                {[
                    { val: 'great', icon: '😁', label: 'Great' },
                    { val: 'good', icon: '🙂', label: 'Good' },
                    { val: 'neutral', icon: '😐', label: 'Okay' },
                    { val: 'tired', icon: '😴', label: 'Tired' },
                    { val: 'stressed', icon: '😫', label: 'Stress' },
                ].map((item) => (
                    <button
                        key={item.val}
                        onClick={() => setMood(item.val as Mood)}
                        className={`
                            flex flex-col items-center gap-1 p-1.5 border-2 transition-all group
                            ${isWild ? 'rounded-none' : 'rounded-2xl'}
                            ${mood === item.val
                                ? (isWild ? 'bg-red-600 text-black border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-primary/5 border-primary ring-1 ring-primary')
                                : (isWild ? 'bg-black border-white/10 text-white/30 hover:border-red-600 hover:text-red-500' : 'bg-background border-input hover:border-primary/50')
                            }
                        `}
                    >
                        <span className={`text-lg transition-all ${mood === item.val ? 'scale-125' : 'grayscale group-hover:grayscale-0 group-hover:scale-110'}`}>{item.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${isWild ? 'text-red-600' : 'text-muted-foreground'}`}>Log Entry [Manual_Override]</label>
                    <span className="text-[10px] font-mono text-white/20">TXT_INPUT_ACTIVE</span>
                </div>
                <textarea
                    className={`w-full min-h-[60px] p-2.5 border-2 resize-none focus:outline-none transition-all text-sm 
                    ${isWild
                            ? 'bg-[#050505] border-white/10 text-red-500 font-mono focus:border-red-600 rounded-none placeholder:text-red-900/30'
                            : 'bg-background border-input rounded-xl focus:ring-2 focus:ring-primary/20'}`}
                    placeholder="Input thought sequence..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!mood}
                    className={`w-full
                        ${isWild ? 'rounded-none bg-red-600 text-black hover:bg-white font-black uppercase tracking-widest border-2 border-transparent hover:border-red-600 transition-all' : ''}
                    `}
                >
                    TRANSMIT PROTOCOL
                </Button>
            </div>
        </div>
    );
}
