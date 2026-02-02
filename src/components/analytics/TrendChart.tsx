import React from 'react';
import { TrendPoint } from '../../services/analytics.service';

interface TrendChartProps {
    data: TrendPoint[];
    color?: string;
    height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, color = '#22c55e', height = 200 }) => {
    if (!data || data.length === 0) return <div>No data</div>;

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
                <line x1={0} y1={yScale(0)} x2={width} y2={yScale(0)} stroke="#333" strokeDasharray="4" />
                <line x1={0} y1={yScale(50)} x2={width} y2={yScale(50)} stroke="#333" strokeDasharray="4" />
                <line x1={0} y1={yScale(100)} x2={width} y2={yScale(100)} stroke="#333" strokeDasharray="4" />

                {/* Area Fill */}
                <path d={areaD} fill={color} fillOpacity="0.1" />

                {/* Line */}
                <path d={pathD} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {data.map((point, i) => (
                    <circle
                        key={point.date}
                        cx={xScale(i)}
                        cy={yScale(point.value)}
                        r="3"
                        fill={color}
                        className="opacity-0 hover:opacity-100 transition-opacity"
                    >
                        <title>{`${new Date(point.date).toLocaleDateString()}: ${point.value}%`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};
