import React, { useEffect, useState } from 'react';
import { TrendPoint } from '../../services/analytics.service';

interface TrendChartProps {
    data: TrendPoint[];
    color?: string;
    height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, color, height = 200 }) => {
    const [themeColors, setThemeColors] = useState({
        primary: '#22c55e',
        border: '#333'
    });

    useEffect(() => {
        // Get theme-aware colors from CSS variables
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        const primaryHsl = styles.getPropertyValue('--primary').trim();
        const borderHsl = styles.getPropertyValue('--border').trim();

        // Convert HSL to hex (simple conversion)
        const hslToHex = (hsl: string) => {
            if (!hsl) return '#22c55e';
            const match = hsl.match(/(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%/);
            if (!match) return '#22c55e';
            const h = parseFloat(match[1]);
            const s = parseFloat(match[2]) / 100;
            const l = parseFloat(match[3]) / 100;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = l - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; b = 0; }
            else if (h < 120) { r = x; g = c; b = 0; }
            else if (h < 180) { r = 0; g = c; b = x; }
            else if (h < 240) { r = 0; g = x; b = c; }
            else if (h < 300) { r = x; g = 0; b = c; }
            else { r = c; g = 0; b = x; }
            return `#${Math.round((r + m) * 255).toString(16).padStart(2, '0')}${Math.round((g + m) * 255).toString(16).padStart(2, '0')}${Math.round((b + m) * 255).toString(16).padStart(2, '0')}`;
        };

        setThemeColors({
            primary: color || hslToHex(primaryHsl),
            border: hslToHex(borderHsl)
        });
    }, [color]);

    if (!data || data.length === 0) return <div className="text-muted-foreground">No data</div>;

    // Dimensions
    const width = 1000; // viewBox width
    const padding = 20;
    const chartHeight = height;
    const points = data.length;

    // Scales
    const xScale = (index: number) => padding + (index / (points - 1)) * (width - 2 * padding);
    const yScale = (value: number) => chartHeight - padding - (value / 100) * (chartHeight - 2 * padding);

    // Path Generation
    const pathD = data.map((point, i) => {
        // Curve smoothing (simple quadratic bezier or just lines)
        // Let's stick to straight lines for brutalism or slight curve
        return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.value)}`;
    }).join(' ');

    // Gradient Area
    const areaD = `${pathD} L ${xScale(points - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

    return (
        <div className="w-full h-full overflow-hidden select-none">
            <svg viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
                {/* Grid Lines */}
                <line x1={0} y1={yScale(0)} x2={width} y2={yScale(0)} stroke={themeColors.border} strokeDasharray="4" opacity="0.3" />
                <line x1={0} y1={yScale(50)} x2={width} y2={yScale(50)} stroke={themeColors.border} strokeDasharray="4" opacity="0.3" />
                <line x1={0} y1={yScale(100)} x2={width} y2={yScale(100)} stroke={themeColors.border} strokeDasharray="4" opacity="0.3" />

                {/* Area Fill */}
                <path d={areaD} fill={themeColors.primary} fillOpacity="0.1" />

                {/* Line */}
                <path d={pathD} stroke={themeColors.primary} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {data.map((point, i) => (
                    <circle
                        key={point.date}
                        cx={xScale(i)}
                        cy={yScale(point.value)}
                        r="3"
                        fill={themeColors.primary}
                        className="opacity-0 hover:opacity-100 transition-opacity"
                    >
                        <title>{`${new Date(point.date).toLocaleDateString()}: ${point.value}%`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};
