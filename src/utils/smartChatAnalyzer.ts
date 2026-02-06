// Smart Chat Analyzer - Unified Command Interface
// Handles navigation, actions, and entity extraction with fuzzy matching

export interface ChatAction {
    label: string;
    icon: string;
    action: string;
}

export interface ChatLink {
    label: string;
    url: string;
    icon: string;
}

export interface ChatIntent {
    type: 'navigation' | 'action' | 'greeting' | 'habit' | 'reminder' | 'task' | 'course' | 'analytics' | 'unknown';
    action?: 'create' | 'view' | 'complete' | 'delete';
}

export interface ChatAnalysis {
    // New Format (SmartChat)
    intents: ChatIntent[];
    actions: ChatAction[];
    suggestedLinks: ChatLink[];
    contextualHelp?: string | null;

    // Legacy Format (AdvancedSearch)
    intent: string;
    confidence: number;
    message: string;
    navigation?: { route: string; label: string };
    action?: { type: string; target: string; metadata?: any };
    entities: { names: string[]; times: string[]; durations: string[] };
}

class SmartChatAnalyzer {
    private navigationMap: Record<string, string[]> = {
        '/dashboard': ['dashboard', 'home', 'hub', 'central', 'main'],
        '/protocols': ['protocols', 'habits', 'rituals', 'routines', 'habit', 'daily', 'knowledge base'],
        '/courses': ['academy', 'courses', 'learning', 'library', 'study', 'training', 'class', 'lesson'],
        '/analytics': ['analytics', 'metrics', 'stats', 'statistics', 'progress', 'data', 'graph', 'chart'],
        '/recall': ['recall', 'notes', 'memory', 'flashcards', 'remember'],
        '/network': ['network', 'social', 'connections', 'community'],
        '/achievements': ['achievements', 'badges', 'awards', 'trophies', 'accomplishments'],
        '/settings': ['settings', 'preferences', 'config', 'configuration', 'options'],
        '/reminders': ['reminders', 'alerts', 'notifications', 'notify', 'schedule'],
        '/youtube': ['youtube', 'videos', 'media', 'watch'],
        '/notes': ['notes', 'note', 'write', 'journal']
    };

    private actionVerbs = {
        create: ['create', 'add', 'new', 'make', 'start', 'begin', 'setup', 'init'],
        view: ['view', 'show', 'see', 'display', 'list', 'get', 'find'],
        complete: ['complete', 'done', 'finish', 'check', 'mark', 'tick'],
        delete: ['delete', 'remove', 'cancel', 'clear', 'erase']
    };

    private targetNouns = ['habit', 'habbit', 'hibbit', 'ritual', 'routine', 'reminder', 'task', 'todo', 'course', 'note'];
    private greetings = ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup', 'ritu'];

    analyzeMessage(message: string): ChatAnalysis {
        const cleaned = this.cleanInput(message);
        const words = cleaned.split(/\s+/);

        const intents: ChatIntent[] = [];
        const actions: ChatAction[] = [];
        const links: ChatLink[] = [];
        let legacyIntent: string = 'unknown';
        let navigation: any = undefined;
        let action: any = undefined;

        // 1. Check greetings
        if (this.isGreeting(words)) {
            intents.push({ type: 'greeting' });
            legacyIntent = 'greeting';
        }

        // 2. Check navigation
        const navMatch = this.matchNavigation(words, cleaned);
        if (navMatch) {
            intents.push({ type: 'navigation' });
            links.push({ label: navMatch.label, url: navMatch.route, icon: '🚀' });
            navigation = navMatch;
            legacyIntent = 'navigation';
        }

        // 3. Check actions
        const actionMatch = this.matchAction(words, cleaned);
        if (actionMatch) {
            intents.push({ type: actionMatch.target as any, action: actionMatch.actionType as any });
            actions.push({
                label: `${actionMatch.actionType} ${actionMatch.target}`,
                icon: '⚡',
                action: `${actionMatch.actionType}_${actionMatch.target}`
            });
            action = { type: actionMatch.actionType, target: actionMatch.target };
            legacyIntent = 'action';
        }

        return {
            intents,
            actions,
            suggestedLinks: links,
            contextualHelp: intents.length === 0 ? 'Try: "Academy", "Create habit", or "Settings"' : null,
            intent: legacyIntent,
            confidence: 0.9,
            message: intents.length > 0 ? `Processing ${legacyIntent}...` : 'I am interpreting...',
            navigation,
            action,
            entities: this.extractEntities(cleaned)
        };
    }

    private cleanInput(msg: string): string {
        return msg.toLowerCase().replace(/[^\w\s]/g, ' ').trim().replace(/\s+/g, ' ');
    }

    private isGreeting(words: string[]): boolean {
        return words.some(w => this.greetings.includes(w));
    }

    private matchNavigation(words: string[], cleaned: string) {
        for (const [route, aliases] of Object.entries(this.navigationMap)) {
            if (aliases.some(alias => words.includes(alias) || cleaned.includes(alias))) {
                return { route, label: this.getRouteLabel(route) };
            }
        }
        return null;
    }

    private matchAction(words: string[], cleaned: string) {
        let actionType: string | null = null;
        for (const [type, verbs] of Object.entries(this.actionVerbs)) {
            if (verbs.some(v => words.includes(v) || cleaned.includes(v))) {
                actionType = type;
                break;
            }
        }

        let target: string | null = null;
        for (const noun of this.targetNouns) {
            if (words.includes(noun) || cleaned.includes(noun)) {
                target = this.normalizeTarget(noun);
                break;
            }
        }

        if (actionType && target) return { actionType, target };
        if (target) return { actionType: 'view', target };
        return null;
    }

    private normalizeTarget(noun: string): string {
        if (['habit', 'habbit', 'hibbit', 'ritual', 'routine'].includes(noun)) return 'habit';
        if (noun === 'todo') return 'task';
        return noun;
    }

    private getRouteLabel(route: string): string {
        const labels: Record<string, string> = {
            '/dashboard': 'Dashboard',
            '/protocols': 'Habits',
            '/courses': 'Academy',
            '/analytics': 'Analytics',
            '/recall': 'Recall',
            '/network': 'Network',
            '/achievements': 'Achievements',
            '/settings': 'Settings',
            '/reminders': 'Reminders',
            '/youtube': 'YouTube',
            '/notes': 'Notes'
        };
        return labels[route] || route;
    }

    private extractEntities(message: string) {
        return {
            names: Array.from(message.match(/\b(?!( habit|course|note|ritual|reminder|task))\w+\b/gi) || []).slice(0, 3),
            times: Array.from(message.match(/\b\d{1,2}:\d{2}\b/g) || []),
            durations: Array.from(message.match(/\b\d+\s+(minutes?|hours?|days?)/g) || [])
        };
    }
}


export default new SmartChatAnalyzer();

