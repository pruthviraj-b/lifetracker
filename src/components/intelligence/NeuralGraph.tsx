import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { CourseService } from '../../services/course.service';
import { HabitService } from '../../services/habit.service';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RefreshCw, Box } from 'lucide-react';
import { cn } from '../../lib/utils';

export const NeuralGraph = ({ onClose }: { onClose: () => void }) => {
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const graphRef = useRef<any>();

    useEffect(() => {
        const loadGraph = async () => {
            try {
                const [courses, habits] = await Promise.all([
                    CourseService.getCourses(),
                    HabitService.getHabits()
                ]);

                const nodes: any[] = [];
                const links: any[] = [];

                // 1. Add Center Node (User Identity)
                nodes.push({
                    id: 'core',
                    name: 'CENTRAL INTELLIGENCE',
                    val: 15,
                    color: isWild ? '#ff0000' : '#22c55e',
                    type: 'core'
                });

                // 2. Add Course Nodes
                courses.forEach((c: any) => {
                    nodes.push({
                        id: c.id,
                        name: c.title,
                        val: 10,
                        color: isWild ? '#ff0000' : '#3b82f6',
                        type: 'course'
                    });
                    // Link to core
                    links.push({ source: 'core', target: c.id, value: 2 });
                });

                // 3. Add Habit Nodes
                habits.forEach((h: any) => {
                    nodes.push({
                        id: h.id,
                        name: h.title,
                        val: 8,
                        color: '#eab308',
                        type: 'habit'
                    });
                    // Link to related courses if tags match (Mock logic for now)
                    links.push({ source: 'core', target: h.id, value: 3 });
                });

                setGraphData({ nodes, links });
            } catch (e) {
                console.error("Graph Load Error", e);
            } finally {
                setLoading(false);
            }
        };

        loadGraph();
    }, [isWild]);

    const nodeCanvasObject = useMemo(() => (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px "Space Mono", monospace`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

        // Halo / Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;

        // Node Shape
        ctx.fillStyle = node.color;
        ctx.beginPath();
        if (node.type === 'core') {
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
        } else if (node.type === 'course') {
            ctx.rect(node.x - 4, node.y - 4, 8, 8);
        } else {
            // Star shape for habits
            const spikes = 5;
            const outerRadius = 5;
            const innerRadius = 2;
            let rot = Math.PI / 2 * 3;
            let x = node.x;
            let y = node.y;
            let step = Math.PI / spikes;

            ctx.moveTo(node.x, node.y - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = node.x + Math.cos(rot) * outerRadius;
                y = node.y + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = node.x + Math.cos(rot) * innerRadius;
                y = node.y + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(node.x, node.y - outerRadius);
        }
        ctx.fill();

        // Label
        if (globalScale > 1.5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + 12);
        }

        ctx.shadowBlur = 0; // Reset
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            <div className="flex items-center justify-between p-6 border-b border-white/10 z-20">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Box className="w-6 h-6 text-primary" />
                        Neural Knowledge Graph
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Visualizing dependency clusters and habit orbits
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button onClick={() => graphRef.current?.zoomToFit(400)} className="p-2 hover:bg-white/10 border-r border-white/10"><RefreshCw className="w-4 h-4" /></button>
                        <button onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2)} className="p-2 hover:bg-white/10 border-r border-white/10"><ZoomIn className="w-4 h-4" /></button>
                        <button onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 0.8)} className="p-2 hover:bg-white/10"><ZoomOut className="w-4 h-4" /></button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center font-mono animate-pulse uppercase tracking-[1em] text-primary">
                        Scanning Synapses...
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeColor={n => (n as any).color}
                        linkColor={() => isWild ? 'rgba(255, 0, 0, 0.1)' : 'rgba(34, 197, 94, 0.1)'}
                        nodeCanvasObject={nodeCanvasObject}
                        backgroundColor="transparent"
                        cooldownTicks={100}
                        onNodeClick={(node: any) => {
                            if (node.type === 'course') window.location.href = `/courses/${node.id}`;
                        }}
                    />
                )}
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-center gap-8 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isWild ? '#ff0000' : '#22c55e' }} />
                    Core Identity
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ backgroundColor: isWild ? '#ff0000' : '#3b82f6' }} />
                    Knowledge Node (Course)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rotate-45" />
                    Ritual Anchor (Habit)
                </div>
            </div>
        </motion.div>
    );
};
