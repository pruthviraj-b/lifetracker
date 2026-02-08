import { DataService } from '../services/data.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    formatDetailsBlock,
    formatHeader,
    loadLocalData,
    addLocalItem
} from './chatUtils';

const parseMetricInput = (text: string) => {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|steps?|km|miles?)/i);
    const value = match ? Number(match[1]) : undefined;
    const unit = match ? match[2].toLowerCase() : undefined;
    const metric = text.replace(match?.[0] || '', '').replace(/track|log|metric|metrics/i, '').trim();
    return {
        metric: metric || undefined,
        value,
        unit
    };
};

const parseInput = (text: string) => parseMetricInput(text);

const getCreateFields = (): FlowField[] => [
    {
        key: 'metric',
        question: 'Which metric should I track?',
        parser: (input: string) => ({ metric: input.trim() })
    },
    {
        key: 'value',
        question: 'What value should I log?',
        parser: (input: string) => {
            const parsed = parseMetricInput(input);
            return { value: parsed.value, unit: parsed.unit || 'units' };
        }
    }
];

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Metric', value: data.metric || 'Metric' },
        { label: 'Value', value: data.value ? `${data.value} ${data.unit || ''}` : 'Not set' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('METRIC LOG', details)}\n\nLog this metric?`;
};

const createMetric = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    const entry = addLocalItem(ctx.userId, 'metrics', {
        metric: data.metric,
        value: data.value,
        unit: data.unit || 'units',
        date: new Date().toISOString().split('T')[0]
    });
    const details = [
        { label: 'Metric', value: entry.metric },
        { label: 'Value', value: `${entry.value} ${entry.unit}` },
        { label: 'Date', value: entry.date }
    ];
    return {
        message: `${EMOJI.success} LOGGED!\n${DIVIDER}\n\n${formatDetailsBlock('METRIC SAVED', details)}`,
        actions: [
            { id: 'metrics-view', label: 'View stats', value: 'show my stats', kind: 'reply', variant: 'secondary' },
            { id: 'metrics-export', label: 'Export data', value: 'export my data', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'metrics', id: entry.id, name: entry.metric, data: entry }
    };
};

const viewMetrics = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const data = loadLocalData(ctx.userId);
    if (!data.metrics.length) return { message: `${EMOJI.info} No metrics logged yet.` };
    const list = data.metrics.slice(0, 8).map((entry: any) => `- ${entry.metric}: ${entry.value} ${entry.unit}`).join('\n');
    return {
        message: `\uD83D\uDCCA METRICS\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'metrics-log', label: 'Log metric', value: 'track metric', kind: 'reply', variant: 'primary' }
        ]
    };
};

const listMetrics = async (ctx: AssistantContext): Promise<ActionResult> => viewMetrics(null, ctx);

const exportMetrics = async (): Promise<ActionResult> => {
    await DataService.downloadExport();
    return { message: `${EMOJI.success} Export started. Your data download should begin shortly.` };
};

export const Metrics: ChatHandler = {
    entity: 'metrics',
    label: 'Metrics',
    parseInput,
    getCreateFields,
    buildSummary,
    create: createMetric,
    view: viewMetrics,
    list: listMetrics
};

export const MetricsExporter = {
    exportMetrics
};
