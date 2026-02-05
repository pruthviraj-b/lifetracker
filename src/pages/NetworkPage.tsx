import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HabitService } from '../services/habit.service';
import { Habit, HabitLink } from '../types/habit';
import { Lock, Share2, Info, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

export default function NetworkPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [links, setLinks] = useState<HabitLink[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const h = await HabitService.getHabits();
            const l = await HabitService.getHabitLinks();
            setHabits(h);
            setLinks(l);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Simple Graph Layout Parameters
    const width = 800;
    const height = 600;
    const radius = 250;
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate node positions (circular layout for simplicity but effective)
    const nodes = habits.map((h, i) => {
        const angle = (i / habits.length) * 2 * Math.PI;
        return {
            ...h,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    const findNode = (id: string) => nodes.find(n => n.id === id);

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className={`flex items-center justify-between ${isWild ? 'animate-reveal' : ''}`}>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className={`rounded-full w-8 h-8 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-2 ${isWild ? 'animate-glitch' : ''}`}>
                                <Share2 className="w-5 h-5 text-primary" />
                                Ritual Network
                            </h1>
                            <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest opacity-70">Neural Linkage Visualization</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Graph Canvas */}
                    <div className={`lg:col-span-3 border-2 overflow-hidden relative min-h-[600px] flex items-center justify-center ${isWild ? 'bg-black border-primary rounded-none shadow-[0_0_50px_rgba(255,0,0,0.1)]' : 'bg-card border-border rounded-3xl shadow-2xl'}`}>
                        {isWild && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />}
                        {loading ? (
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-full" />
                                <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Mapping Neural Connections...</p>
                            </div>
                        ) : (
                            <svg width="100%" height="600" viewBox={`0 0 ${width} ${height}`} className="drop-shadow-2xl">
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" opacity="0.5" />
                                    </marker>
                                </defs>

                                {/* Links */}
                                {links.map(link => {
                                    const source = findNode(link.sourceHabitId);
                                    const target = findNode(link.targetHabitId);
                                    if (!source || !target) return null;

                                    let color = "stroke-muted-foreground/30";
                                    let dashArray = "";
                                    if (link.type === 'prerequisite') color = "stroke-blue-500/50";
                                    if (link.type === 'chain') color = "stroke-yellow-500/50";
                                    if (link.type === 'synergy') {
                                        color = "stroke-green-500/50";
                                        dashArray = "4 4";
                                    }
                                    if (link.type === 'conflict') color = "stroke-red-500/50";

                                    return (
                                        <line
                                            key={link.id}
                                            x1={source.x}
                                            y1={source.y}
                                            x2={target.x}
                                            y2={target.y}
                                            className={`${color} transition-all duration-500`}
                                            strokeWidth="2"
                                            strokeDasharray={dashArray}
                                            markerEnd="url(#arrowhead)"
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {nodes.map(node => (
                                    <g key={node.id} className="group cursor-pointer">
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r="22"
                                            className={`${node.isLocked ? 'fill-muted stroke-muted-foreground' : isWild ? 'fill-black stroke-primary' : 'fill-card stroke-primary'} transition-all duration-300 stroke-2 group-hover:scale-110 group-hover:stroke-[4px]`}
                                        />
                                        <foreignObject
                                            x={node.x - 60}
                                            y={node.y + 30}
                                            width="120"
                                            height="40"
                                        >
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-tighter truncate px-2 py-1 ${isWild ? 'bg-primary text-black' : 'bg-background/50 rounded-md backdrop-blur-sm border border-border/20'}`}>
                                                    {node.title}
                                                </p>
                                            </div>
                                        </foreignObject>

                                        {/* Icons on nodes */}
                                        <g transform={`translate(${node.x - 6}, ${node.y - 6})`}>
                                            {node.isLocked ? (
                                                <Lock className="w-3 h-3 text-muted-foreground" />
                                            ) : (
                                                <div className={`w-3 h-3 ${isWild ? 'text-primary' : 'text-primary'}`} />
                                            )}
                                        </g>
                                    </g>
                                ))}
                            </svg>
                        )}

                        <div className="absolute bottom-6 left-6 flex gap-4 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                <div className="w-3 h-0.5 bg-blue-500" /> Prerequisite
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                <div className="w-3 h-0.5 bg-yellow-500" /> Chain
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                <div className="w-3 h-0.5 bg-green-500 border-dashed border" /> Synergy
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                <div className="w-3 h-0.5 bg-red-500" /> Conflict
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                <Info className="w-4 h-4 text-primary" /> Network Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border">
                                    <span className="text-xs text-muted-foreground">Active Hubs</span>
                                    <span className="text-lg font-bold">{habits.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border">
                                    <span className="text-xs text-muted-foreground">Connections</span>
                                    <span className="text-lg font-bold">{links.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border">
                                    <span className="text-xs text-muted-foreground">Synergy Level</span>
                                    <span className="text-lg font-bold text-green-500">
                                        {links.filter(l => l.type === 'synergy').length * 5}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl">
                            <h3 className="text-sm font-bold mb-3">Architect's Note</h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Designing a cohesive ritual network maximizes your efficiency. Synergies provide XP bonuses, while Chains ensure you never lose momentum between tasks.
                            </p>
                            <Button className="w-full mt-4 text-xs font-bold" variant="outline" onClick={() => navigate('/dashboard')}>
                                Return to Rituals
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
