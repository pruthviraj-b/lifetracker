export type EntityType =
    | 'habit'
    | 'reminder'
    | 'task'
    | 'protocol'
    | 'knowledge'
    | 'schedule'
    | 'academy'
    | 'recall'
    | 'metrics'
    | 'library'
    | 'network'
    | 'achievement'
    | 'settings';

export type ActionType =
    | 'create'
    | 'edit'
    | 'complete'
    | 'delete'
    | 'view'
    | 'snooze'
    | 'export'
    | 'share'
    | 'enroll'
    | 'progress'
    | 'update';

export interface DetectedIntent {
    action: ActionType;
    entity: EntityType;
    raw: string;
}

export interface FlowField {
    key: string;
    question: string;
    optional?: boolean;
    options?: string[];
    parser?: (input: string, data: Record<string, any>) => any;
}

export interface ParsedTime {
    time24?: string;
    label?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
}

export interface ParsedFrequency {
    days: number[];
    label: string;
}

export interface LocalChatData {
    tasks: any[];
    protocols: any[];
    schedule: any[];
    recall: any[];
    metrics: any[];
    library: any[];
    network: any[];
    academyDrafts: any[];
}

export const EMOJI = {
    success: '\u2705',
    celebration: '\uD83C\uDF89',
    warning: '\u26A0\uFE0F',
    info: '\u2139\uFE0F',
    spark: '\u2728',
    fire: '\uD83D\uDD25',
    check: '\u2714\uFE0F',
    trophy: '\uD83C\uDFC6'
};

export const DIVIDER = '----------------------------------------';
const BRANCH = '\u251C\u2500';
const END = '\u2514\u2500';

const ACTION_KEYWORDS: Record<ActionType, string[]> = {
    create: ['create', 'add', 'new', 'start', 'make', 'set up', 'setup', 'build', 'log', 'remind', 'schedule', 'plan', 'track'],
    edit: ['edit', 'change', 'update', 'rename', 'adjust', 'modify'],
    complete: ['complete', 'done', 'finish', 'mark', 'check', 'tick'],
    delete: ['delete', 'remove', 'clear', 'erase', 'cancel'],
    view: ['view', 'show', 'see', 'list', 'display', 'stats', 'details'],
    snooze: ['snooze'],
    export: ['export', 'download'],
    share: ['share'],
    enroll: ['enroll', 'start course', 'join'],
    progress: ['progress', 'status'],
    update: ['update']
};

const ENTITY_KEYWORDS: Record<EntityType, string[]> = {
    habit: ['habit', 'ritual', 'routine'],
    reminder: ['reminder', 'alert', 'notify', 'notification', 'remind'],
    task: ['task', 'todo', 'to-do'],
    protocol: ['protocol', 'steps', 'routine protocol'],
    knowledge: ['knowledge', 'note', 'notes', 'fact', 'guide'],
    schedule: ['schedule', 'calendar', 'event', 'meeting'],
    academy: ['academy', 'course', 'lesson', 'learning'],
    recall: ['recall', 'remember', 'memory', 'journal'],
    metrics: ['metrics', 'stats', 'tracking', 'track', 'log', 'analytics', 'data', 'report', 'streak'],
    library: ['library', 'resource', 'resources', 'bookmark'],
    network: ['network', 'friend', 'community', 'share progress'],
    achievement: ['achievement', 'badge', 'trophy', 'milestone'],
    settings: ['settings', 'preferences', 'theme', 'dark mode', 'light mode', 'language', 'notification settings']
};

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'my', 'today', 'todays', 'tomorrow', 'yesterday', 'all', 'for', 'with', 'to', 'at', 'in', 'on',
    'please', 'me', 'now', 'this', 'that', 'it', 'is', 'are', 'be', 'from', 'of', 'and'
]);

const ACTION_WORDS = Object.values(ACTION_KEYWORDS).flatMap(list => list);

export const DEFAULT_CATEGORIES = ['Health', 'Wellness', 'Fitness', 'Learning', 'Personal Growth', 'Other'];
export const DEFAULT_FREQUENCIES = ['Daily', 'Weekdays', 'Weekends', 'Weekly'];

export const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeText = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9:\s]/g, ' ').replace(/\s+/g, ' ').trim();

export const capitalizeWords = (value: string) =>
    value
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export const detectIntent = (text: string): DetectedIntent | null => {
    const normalized = normalizeText(text);
    if (!normalized) return null;

    const action = detectAction(normalized);
    const entity = detectEntity(normalized, action);

    if (!entity) return null;
    const resolvedAction: ActionType = action || (entity === 'settings' ? 'edit' : 'view');
    return { action: resolvedAction, entity, raw: text };
};

export const detectAction = (text: string): ActionType | null => {
    for (const [action, keywords] of Object.entries(ACTION_KEYWORDS) as [ActionType, string[]][]) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return action;
        }
    }
    return null;
};

export const detectEntity = (text: string, action: ActionType | null): EntityType | null => {
    if (action === 'snooze') return 'reminder';
    if (text.includes('dark mode') || text.includes('light mode')) return 'settings';

    let best: { entity: EntityType | null; score: number } = { entity: null, score: 0 };

    for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS) as [EntityType, string[]][]) {
        let score = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) score += keyword.split(' ').length;
        });
        if (score > best.score) best = { entity, score };
    }

    return best.entity;
};

export const extractName = (text: string, keywords: string[] = []): string | null => {
    const quoted = text.match(/"([^"]+)"|'([^']+)'/);
    if (quoted) {
        return capitalizeWords(quoted[1] || quoted[2]);
    }

    const normalized = normalizeText(text);
    const tokens = normalized.split(' ');
    const filtered = tokens.filter(token => {
        if (!token || STOP_WORDS.has(token)) return false;
        if (keywords.includes(token)) return false;
        if (ACTION_WORDS.includes(token)) return false;
        return true;
    });

    if (!filtered.length) return null;
    return capitalizeWords(filtered.join(' '));
};

export const parseTime = (text: string): ParsedTime | null => {
    const lowered = text.toLowerCase();
    if (lowered.includes('anytime')) return { timeOfDay: 'anytime', label: 'Anytime' };
    if (lowered.includes('morning')) return { timeOfDay: 'morning', label: 'Morning' };
    if (lowered.includes('afternoon')) return { timeOfDay: 'afternoon', label: 'Afternoon' };
    if (lowered.includes('evening') || lowered.includes('night')) return { timeOfDay: 'evening', label: 'Evening' };

    const ampmMatch = lowered.match(/\b([0-9]{1,2})(?::([0-9]{2}))?\s*(am|pm)\b/);
    if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const minute = parseInt(ampmMatch[2] || '0', 10);
        const ampm = ampmMatch[3];
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        return { time24, label: formatTimeLabel(time24), timeOfDay: toTimeOfDay(time24) };
    }

    const time24Match = lowered.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time24Match) {
        const time24 = `${String(time24Match[1]).padStart(2, '0')}:${time24Match[2]}`;
        return { time24, label: formatTimeLabel(time24), timeOfDay: toTimeOfDay(time24) };
    }

    return null;
};

export const formatTimeLabel = (time24: string) => {
    const [hourStr, minuteStr] = time24.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

export const toTimeOfDay = (time24?: string): ParsedTime['timeOfDay'] => {
    if (!time24) return 'anytime';
    const hour = parseInt(time24.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
};

export const parseFrequency = (text: string): ParsedFrequency | null => {
    const lowered = text.toLowerCase();
    if (lowered.includes('daily') || lowered.includes('every day')) {
        return { days: [0, 1, 2, 3, 4, 5, 6], label: 'Daily' };
    }
    if (lowered.includes('weekdays')) {
        return { days: [1, 2, 3, 4, 5], label: 'Weekdays' };
    }
    if (lowered.includes('weekends')) {
        return { days: [0, 6], label: 'Weekends' };
    }

    const dayMap: Record<string, number> = {
        sunday: 0,
        sun: 0,
        monday: 1,
        mon: 1,
        tuesday: 2,
        tue: 2,
        tues: 2,
        wednesday: 3,
        wed: 3,
        thursday: 4,
        thu: 4,
        thurs: 4,
        friday: 5,
        fri: 5,
        saturday: 6,
        sat: 6
    };

    const days = Object.entries(dayMap)
        .filter(([key]) => lowered.includes(key))
        .map(([, value]) => value);

    if (days.length > 0) {
        const uniqueDays = Array.from(new Set(days)).sort();
        return { days: uniqueDays, label: uniqueDays.map(d => dayLabel(d)).join(', ') };
    }

    if (lowered.includes('weekly')) {
        return { days: [1], label: 'Weekly (Mon)' };
    }

    return null;
};

export const dayLabel = (day: number) => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return labels[day] || 'Day';
};

export const parseDate = (text: string): string | null => {
    const lowered = text.toLowerCase();
    const today = new Date();

    if (lowered.includes('today')) {
        return today.toISOString().split('T')[0];
    }
    if (lowered.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    if (lowered.includes('yesterday')) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    const isoMatch = lowered.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (isoMatch) return isoMatch[0];

    const mdMatch = lowered.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (mdMatch) {
        const year = mdMatch[3] ? parseInt(mdMatch[3], 10) : today.getFullYear();
        const month = String(parseInt(mdMatch[1], 10)).padStart(2, '0');
        const day = String(parseInt(mdMatch[2], 10)).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
};

export const formatDateLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const extractPriority = (text: string) => {
    const lowered = text.toLowerCase();
    if (lowered.includes('urgent') || lowered.includes('high')) return 'high';
    if (lowered.includes('low')) return 'low';
    if (lowered.includes('medium')) return 'medium';
    return null;
};

export const extractCategory = (text: string) => {
    const lowered = text.toLowerCase();
    if (lowered.includes('health')) return 'health';
    if (lowered.includes('wellness') || lowered.includes('mindful')) return 'mindfulness';
    if (lowered.includes('fitness') || lowered.includes('exercise')) return 'health';
    if (lowered.includes('learning') || lowered.includes('study')) return 'learning';
    if (lowered.includes('personal') || lowered.includes('growth')) return 'work';
    if (lowered.includes('social')) return 'social';
    if (lowered.includes('work')) return 'work';
    return null;
};

export const parseYesNo = (text: string): boolean | null => {
    const lowered = text.toLowerCase().trim();
    if (['yes', 'y', 'sure', 'ok', 'okay', 'confirm', 'do it'].some(word => lowered.includes(word))) return true;
    if (['no', 'n', 'cancel', 'stop', 'nope'].some(word => lowered.includes(word))) return false;
    return null;
};

export const formatDetailsBlock = (title: string, details: { label: string; value: string }[]) => {
    const lines = details.map((detail, index) => {
        const prefix = index === details.length - 1 ? END : BRANCH;
        return `${prefix} ${detail.label}: ${detail.value}`;
    });
    return `${title}\n${lines.join('\n')}`;
};

export const formatHeader = (label: string) => `${label}\n${DIVIDER}`;

export const getLocalDataKey = (userId?: string) => `ritu.chat.data.${userId || 'guest'}`;

export const loadLocalData = (userId?: string): LocalChatData => {
    if (typeof localStorage === 'undefined') {
        return {
            tasks: [],
            protocols: [],
            schedule: [],
            recall: [],
            metrics: [],
            library: [],
            network: [],
            academyDrafts: []
        };
    }
    try {
        const raw = localStorage.getItem(getLocalDataKey(userId));
        if (!raw) throw new Error('missing');
        return {
            tasks: [],
            protocols: [],
            schedule: [],
            recall: [],
            metrics: [],
            library: [],
            network: [],
            academyDrafts: [],
            ...JSON.parse(raw)
        };
    } catch {
        return {
            tasks: [],
            protocols: [],
            schedule: [],
            recall: [],
            metrics: [],
            library: [],
            network: [],
            academyDrafts: []
        };
    }
};

export const saveLocalData = (userId: string | undefined, data: LocalChatData) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(getLocalDataKey(userId), JSON.stringify(data));
};

export const updateLocalData = (userId: string | undefined, updater: (data: LocalChatData) => LocalChatData) => {
    const data = loadLocalData(userId);
    const next = updater(data);
    saveLocalData(userId, next);
    return next;
};

export const addLocalItem = (userId: string | undefined, key: keyof LocalChatData, item: any) => {
    let created: any = null;
    updateLocalData(userId, data => {
        created = { ...item, id: createId(), createdAt: new Date().toISOString() };
        data[key] = [...data[key], created];
        return { ...data };
    });
    return created;
};

export const updateLocalItem = (userId: string | undefined, key: keyof LocalChatData, id: string, updates: any) => {
    let updated: any = null;
    updateLocalData(userId, data => {
        data[key] = data[key].map(item => {
            if (item.id === id) {
                updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
                return updated;
            }
            return item;
        });
        return { ...data };
    });
    return updated;
};

export const removeLocalItem = (userId: string | undefined, key: keyof LocalChatData, id: string) => {
    let removed: any = null;
    updateLocalData(userId, data => {
        data[key] = data[key].filter(item => {
            if (item.id === id) {
                removed = item;
                return false;
            }
            return true;
        });
        return { ...data };
    });
    return removed;
};

export const findLocalItemByName = (items: any[], name: string) => {
    const target = normalizeText(name);
    if (!target) return null;
    const exact = items.find(item => normalizeText(item.title || item.name || '') === target);
    if (exact) return exact;
    return items.find(item => normalizeText(item.title || item.name || '').includes(target)) || null;
};
