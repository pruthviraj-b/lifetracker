import { useState } from 'react';
import { Sparkles, Quote as QuoteIcon, Lightbulb, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { HabitService } from '../../services/habit.service';
import { useToast } from '../../context/ToastContext';

const QUOTES = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Your habits will determine your future.", author: "Jack Canfield" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "The chains of habit are too weak to be felt until they are too heavy to be broken.", author: "Samuel Johnson" },
    { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
];

const SUGGESTED_HABITS = [
    { title: "Morning Stillness", category: "Mindfulness", description: "5 minutes of meditation or breathing.", timeOfDay: "morning", frequency: ["daily"] },
    { title: "Hydration Sync", category: "Health", description: "Drink a glass of water before every meal.", timeOfDay: "anytime", frequency: ["daily"] },
    { title: "Visual Journaling", category: "Creative", description: "Snapshot one positive moment from today.", timeOfDay: "evening", frequency: ["daily"] },
    { title: "Cold Exposure", category: "Wellness", description: "Finish your shower with 30s of cold water.", timeOfDay: "morning", frequency: ["daily"] },
    { title: "Reading Sprint", category: "Learning", description: "Read 10 pages of a non-fiction book.", timeOfDay: "anytime", frequency: ["daily"] },
];

export function SmartFeed() {
    const { preferences } = useTheme();
    const { showToast } = useToast();
    const isWild = preferences.wild_mode;
    const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const [suggestion] = useState(() => SUGGESTED_HABITS[Math.floor(Math.random() * SUGGESTED_HABITS.length)]);
    const [added, setAdded] = useState(false);

    const handleAccept = async () => {
        try {
            await HabitService.createHabit({
                title: suggestion.title,
                description: suggestion.description,
                category: suggestion.category,
                frequency: JSON.stringify(suggestion.frequency),
                timeOfDay: suggestion.timeOfDay as any,
                type: 'boolean',
                goalDuration: 1
            });
            showToast("Success", "Protocol Integrated", { type: 'success' });
            setAdded(true);
            // Reload page or trigger global refresh if possible, but toast is enough for now
            setTimeout(() => window.location.reload(), 1000); // Simple refresh to show in list
        } catch (error) {
            console.error("Failed to add suggestion:", error);
            showToast("Error", "Integration Failed", { type: 'error' });
        }
    };

    return (
        <div className={`space-y-6 ${isWild ? 'animate-reveal' : ''}`}>
            <h2 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-2 ${isWild ? 'animate-glitch' : ''}`}>
                <Sparkles className={`w-5 h-5 ${isWild ? 'text-red-500' : 'text-primary'}`} />
                {isWild ? 'Deep Intelligence' : 'Intelligence Feed'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quote Card */}
                <div className={`
                    relative group p-6 bg-card border overflow-hidden shadow-lg transition-all
                    ${isWild ? 'rounded-none border-red-500 border-4 bg-black' : 'rounded-3xl hover:shadow-primary/5'}
                `}>
                    <div className={`absolute -top-4 -right-4 opacity-5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700 ${isWild ? 'text-red-500 opacity-20' : ''}`}>
                        <QuoteIcon className="w-24 h-24" />
                    </div>

                    <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <QuoteIcon className={`w-6 h-6 ${isWild ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                            <p className={`text-lg font-bold leading-tight tracking-tight italic ${isWild ? 'font-black uppercase not-italic text-white' : ''}`}>
                                "{quote.text}"
                            </p>
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                            <div className={`h-[1px] bg-muted-foreground ${isWild ? 'w-12 bg-red-500' : 'w-6'}`}></div>
                            <span className={`text-xs font-black uppercase tracking-widest ${isWild ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {quote.author}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Suggestion Card */}
                <div className={`
                    relative group p-6 overflow-hidden shadow-lg transition-all border
                    ${isWild ? 'bg-black border-red-500 border-4 rounded-none' : 'bg-primary/5 border-primary/20 rounded-3xl hover:shadow-primary/10'}
                `}>
                    <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl ${isWild ? 'bg-red-500 text-black rounded-none' : 'bg-primary/20 text-primary'}`}>
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border ${isWild ? 'bg-red-500 text-black border-red-500 rounded-none' : 'bg-primary/10 text-primary border-primary/20 rounded-full'}`}>
                                    {isWild ? 'Protocol Suggestion' : 'Suggested for you'}
                                </span>
                            </div>

                            <div>
                                <h3 className={`text-xl font-black uppercase tracking-tighter ${isWild ? 'text-white' : ''}`}>{suggestion.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold uppercase ${isWild ? 'text-red-500' : 'text-primary/70'}`}>{suggestion.category}</span>
                                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                                    <span className="text-xs text-muted-foreground font-medium">{suggestion.description}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button
                                onClick={handleAccept}
                                disabled={added}
                                className={`
                                w-full font-bold uppercase tracking-widest text-xs shadow-lg transition-all
                                ${isWild
                                        ? `rounded-none border-b-8 ${added ? 'bg-green-600 text-black border-green-800' : 'bg-red-600 text-black hover:bg-red-500 border-red-800'}`
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-primary/20'}
                            `}>
                                {added ? (
                                    <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Integrated</span>
                                ) : (
                                    isWild ? 'Accept Protocol' : 'Integrate into Rituals'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
