import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HabitService } from '../services/habit.service';
import { YouTubeService } from '../services/youtube.service';
import { CourseService } from '../services/course.service';
import { MultiverseService } from '../services/multiverse.service';
import { Habit } from '../types/habit';
import { YouTubeVideo } from '../types/youtube';
import { MultiverseLink, MultiverseNode, MultiverseEntityType } from '../types/multiverse';
import { Lock, Share2, Info, Home, Activity, Star, Youtube, GraduationCap, Link2, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { ThemedCard } from '../components/ui/ThemedCard';
import { useToast } from '../context/ToastContext';

export default function NetworkPage() {
    const [nodes, setNodes] = useState<MultiverseNode[]>([]);
    const [links, setLinks] = useState<MultiverseLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Link Creation State
    const [sourceNode, setSourceNode] = useState<string>('');
    const [targetNode, setTargetNode] = useState<string>('');
    const [relationType, setRelationType] = useState<any>('dependency');

    const navigate = useNavigate();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    // NOTE: Avoid auto-loading heavy data on mount to speed up initial app load.
    // Data will be fetched when user explicitly requests a sync (Sync_Matrix button).

    const loadData = async () => {
        setLoading(true);
        try {
            const [h, v, c, l] = await Promise.all([
                HabitService.getHabits(),
                YouTubeService.getVideos(),
                CourseService.getCourses(),
                MultiverseService.getLinks()
            ]);

            const allNodes: MultiverseNode[] = [
                ...h.map(item => ({
                    id: item.id,
                    type: 'habit' as MultiverseEntityType,
                    title: item.title,
                    subtitle: item.category,
                    status: item.completedToday ? 'completed' : item.isLocked ? 'locked' : 'active' as any
                })),
                ...v.map(item => ({
                    id: item.id,
                    type: 'video' as MultiverseEntityType,
                    title: item.title,
                    subtitle: 'Video Resource',
                    status: item.status === 'watched' ? 'completed' : 'active' as any
                })),
                ...c.map(item => ({
                    id: item.id,
                    type: 'course' as MultiverseEntityType,
                    title: item.title,
                    subtitle: 'Learning Protocol',
                    status: 'active' as any
                }))
            ];

            setNodes(allNodes);
            setLinks(l);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLink = async () => {
        if (!sourceNode || !targetNode || sourceNode === targetNode) return;

        try {
            const sNode = nodes.find(n => n.id === sourceNode);
            const tNode = nodes.find(n => n.id === targetNode);
            if (!sNode || !tNode) return;

            await MultiverseService.createLink({
                sourceType: sNode.type,
                sourceId: sNode.id,
                targetType: tNode.type,
                targetId: tNode.id,
                relationType: relationType
            });

            showToast('Success', 'Neural handshake established', { type: 'success' });
            setIsLinkModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Error', 'Link forbidden by system', { type: 'error' });
        }
    };

    // Graph Layout calc
    const width = 1000;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    const positionedNodes = nodes.map((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = n.type === 'habit' ? 220 : n.type === 'course' ? 320 : 120;
        return {
            ...n,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    const findPos = (id: string) => positionedNodes.find(n => n.id === id);

    const getIcon = (type: MultiverseEntityType) => {
        switch (type) {
            case 'habit': return <Activity className="w-3 h-3" />;
            case 'video': return <Youtube className="w-3 h-3" />;
            case 'course': return <GraduationCap className="w-3 h-3" />;
            default: return <Link2 className="w-3 h-3" />;
        }
    };

    const getColor = (type: MultiverseEntityType) => {
        switch (type) {
            case 'habit': return 'text-primary';
            case 'video': return 'text-red-500';
            case 'course': return 'text-green-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
            <div className={`flex items-center justify-between ${isWild ? 'animate-reveal' : ''}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2 border-primary/20' : ''}`} onClick={() => navigate('/')}>
                        <Home className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className={`text-4xl font-black uppercase tracking-tighter flex items-center gap-4 ${isWild ? 'animate-glitch' : ''}`}>
                            Multiverse_Link
                        </h1>
                        <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-[0.3em] opacity-60">Cross-Entity Neural Mapping</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            await MultiverseService.repairGraph();
                            loadData();
                            showToast('Success', 'Neural nodes synchronized', { type: 'success' });
                        }}
                        className={`h-12 px-8 text-[11px] font-black uppercase tracking-widest ${isWild ? 'rounded-none border-2' : ''}`}
                    >
                        Sync_Matrix
                    </Button>
                    <Button
                        onClick={() => setIsLinkModalOpen(true)}
                        className={`h-12 px-8 text-[11px] font-black uppercase tracking-widest ${isWild ? 'rounded-none border-2' : ''}`}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Establish_Handshake
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className={`lg:col-span-3 border-2 overflow-hidden relative min-h-[750px] flex items-center justify-center transition-all ${isWild ? 'bg-[#050505] border-primary/20 rounded-none shadow-[inset_0_0_80px_rgba(255,0,0,0.05)]' : 'bg-card border-border rounded-3xl shadow-xl'}`}>
                    {loading ? (
                        <div className="animate-pulse flex flex-col items-center gap-6">
                            <Activity className="w-12 h-12 text-primary animate-glitch" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Syncing Multiverse...</p>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <Activity className="w-10 h-10 text-primary opacity-80" />
                            <p className="text-sm font-bold">Multiverse not loaded</p>
                            <p className="text-[11px] text-muted-foreground max-w-xs">Click "Sync_Matrix" to fetch your nodes and links when you need them. This avoids slow startup loads.</p>
                        </div>
                    ) : (
                        <svg width="100%" height="750" viewBox={`0 0 ${width} ${height}`} className="overflow-visible drop-shadow-2xl">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" opacity="0.3" />
                                </marker>
                            </defs>

                            {/* Lines */}
                            {links.map(link => {
                                const source = findPos(link.sourceId);
                                const target = findPos(link.targetId);
                                if (!source || !target) return null;

                                return (
                                    <line
                                        key={link.id}
                                        x1={source.x} y1={source.y}
                                        x2={target.x} y2={target.y}
                                        className="stroke-primary/20 hover:stroke-primary transition-all duration-700 hover:stroke-[3px]"
                                        strokeWidth="1.5"
                                        strokeDasharray={link.relationType === 'synergy' ? '4 4' : ''}
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {positionedNodes.map(node => (
                                <g key={node.id} className="group cursor-pointer">
                                    <circle
                                        cx={node.x} cy={node.y} r="25"
                                        className={`
                                            transition-all duration-500 stroke-2 group-hover:r-[30px] group-hover:stroke-[4px]
                                            ${node.status === 'completed' ? 'fill-primary/20 stroke-primary' : node.status === 'locked' ? 'fill-muted stroke-muted-foreground opacity-40' : isWild ? 'fill-black stroke-primary/40' : 'fill-card stroke-primary/30'}
                                        `}
                                    />
                                    <foreignObject x={node.x - 75} y={node.y + 35} width="150" height="60" className="overflow-visible">
                                        <div className="text-center group-hover:scale-110 transition-transform">
                                            <p className={`
                                                inline-block text-[8px] font-black uppercase tracking-tighter truncate max-w-full px-3 py-1.5
                                                ${isWild ? 'bg-black text-primary border border-primary/30' : 'bg-background/80 rounded-md backdrop-blur-md'}
                                            `}>
                                                {node.title}
                                            </p>
                                        </div>
                                    </foreignObject>
                                    <g transform={`translate(${node.x - 7}, ${node.y - 7})`} className={`opacity-60 group-hover:scale-150 transition-all ${getColor(node.type)}`}>
                                        {getIcon(node.type)}
                                    </g>
                                </g>
                            ))}
                        </svg>
                    )}
                </div>

                <div className="space-y-6">
                    <ThemedCard className="p-8 space-y-8">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3 border-b border-primary/10 pb-4">
                            <Info className="w-5 h-5 text-primary" /> Core_Matrix
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Universal Nodes', value: nodes.length },
                                { label: 'Neural Links', value: links.length },
                                { label: 'Cross-Sync Rate', value: `${((links.length / (nodes.length || 1)) * 100).toFixed(0)}%` }
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-5 bg-primary/[0.03] border-2 border-primary/5 hover:border-primary/20 transition-all group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{s.label}</span>
                                    <span className="text-2xl font-black text-primary">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </ThemedCard>

                    <ThemedCard className="p-8 space-y-4">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em]">Architect_Override</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase leading-relaxed tracking-widest opacity-60">
                            The Multiverse Linking allows for synergistic energy flow between disparate modules. Link your habits to your research for maximum cognitive yield.
                        </p>
                    </ThemedCard>
                </div>
            </div>

            {/* Link Establishment Modal */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
                    <ThemedCard className="w-full max-w-lg p-12 space-y-10 relative">
                        <button onClick={() => setIsLinkModalOpen(false)} className="absolute top-8 right-8 text-muted-foreground hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Establish_Link</h2>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">Phase 11: Cross-Entity Handshake</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Source Node</label>
                                <select
                                    className="w-full h-14 bg-black border-2 border-primary/10 text-[11px] font-black uppercase tracking-widest px-6 focus:border-primary focus:ring-0 rounded-none"
                                    value={sourceNode}
                                    onChange={e => setSourceNode(e.target.value)}
                                >
                                    <option value="">Select Primary Node</option>
                                    {nodes.map(n => <option key={n.id} value={n.id}>[{n.type}] {n.title}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-center -my-4 relative z-10">
                                <Link2 className="w-10 h-10 text-primary bg-black border-4 border-primary/5 p-2" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Target Node</label>
                                <select
                                    className="w-full h-14 bg-black border-2 border-primary/10 text-[11px] font-black uppercase tracking-widest px-6 focus:border-primary focus:ring-0 rounded-none"
                                    value={targetNode}
                                    onChange={e => setTargetNode(e.target.value)}
                                >
                                    <option value="">Select Secondary Node</option>
                                    {nodes.map(n => <option key={n.id} value={n.id}>[{n.type}] {n.title}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Link Protocol</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['dependency', 'synergy', 'prerequisite', 'reference'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setRelationType(type)}
                                            className={`h-12 border-2 text-[9px] font-black uppercase tracking-widest transition-all ${relationType === type ? 'bg-primary border-primary text-black' : 'bg-transparent border-primary/10 text-muted-foreground hover:border-primary/40'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all rounded-none mt-4 shadow-[0_0_30px_rgba(255,0,0,0.1)]"
                            onClick={handleCreateLink}
                        >
                            Initiate_Linking_Sequence
                        </Button>
                    </ThemedCard>
                </div>
            )}
        </div>
    );
}
