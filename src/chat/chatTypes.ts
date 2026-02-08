import { ActionType, EntityType, FlowField } from './chatUtils';

export type ChatRole = 'user' | 'assistant';

export interface ChatAction {
    id: string;
    label: string;
    value: string;
    kind: 'reply' | 'confirm' | 'cancel';
    variant?: 'primary' | 'secondary' | 'danger';
}

export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    createdAt: string;
    actions?: ChatAction[];
}

export interface AssistantContext {
    userId?: string;
    userName?: string;
}

export interface TargetMatch<T = any> {
    id?: string;
    name: string;
    item: T;
}

export interface ActionResult {
    message: string;
    actions?: ChatAction[];
    entity?: { type: EntityType; id?: string; name?: string; data?: any };
    deleted?: { type: EntityType; data: any };
    followUp?: string;
}

export interface ChatHandler {
    entity: EntityType;
    label: string;
    parseInput: (text: string, ctx: AssistantContext) => Record<string, any>;
    parseUpdate?: (text: string, ctx: AssistantContext) => Record<string, any>;
    getCreateFields: (data: Record<string, any>, ctx: AssistantContext) => FlowField[];
    getEditFields?: (target: TargetMatch, ctx: AssistantContext) => FlowField[];
    buildSummary: (action: ActionType, data: Record<string, any>, target?: TargetMatch, ctx?: AssistantContext) => string;
    create?: (data: Record<string, any>, ctx: AssistantContext) => Promise<ActionResult>;
    update?: (target: TargetMatch, updates: Record<string, any>, ctx: AssistantContext) => Promise<ActionResult>;
    remove?: (target: TargetMatch, ctx: AssistantContext) => Promise<ActionResult>;
    complete?: (target: TargetMatch, ctx: AssistantContext) => Promise<ActionResult>;
    view?: (target: TargetMatch | null, ctx: AssistantContext, data?: Record<string, any>) => Promise<ActionResult>;
    list?: (ctx: AssistantContext) => Promise<ActionResult>;
    findTarget?: (name: string, ctx: AssistantContext) => Promise<TargetMatch | null>;
    restore?: (data: any, ctx: AssistantContext) => Promise<ActionResult>;
    snooze?: (target: TargetMatch, data: Record<string, any>, ctx: AssistantContext) => Promise<ActionResult>;
}
