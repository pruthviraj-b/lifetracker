import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import {
    DIVIDER,
    EMOJI,
    FlowField,
    formatDetailsBlock,
    formatHeader,
    loadLocalData,
    addLocalItem,
    removeLocalItem,
    findLocalItemByName
} from './chatUtils';

const parseInput = (text: string) => ({
    name: text.trim()
});

const getCreateFields = (): FlowField[] => [
    {
        key: 'name',
        question: 'Who do you want to add?',
        parser: (input: string) => ({ name: input.trim() })
    },
    {
        key: 'relationship',
        question: 'How do you know them?',
        optional: true,
        parser: (input: string) => ({ relationship: input.trim() })
    },
    {
        key: 'sharedHabits',
        question: 'Any shared habits or goals? (optional)',
        optional: true,
        parser: (input: string) => ({ sharedHabits: input.trim() })
    }
];

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Name', value: data.name || 'Connection' },
        { label: 'Relationship', value: data.relationship || 'Friend' },
        { label: 'Shared', value: data.sharedHabits || 'None' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('NETWORK CONNECTION', details)}\n\nAdd this connection?`;
};

const findTarget = async (name: string, ctx: AssistantContext) => {
    const data = loadLocalData(ctx.userId);
    const match = findLocalItemByName(data.network, name);
    if (!match) return null;
    return { id: match.id, name: match.name, item: match };
};

const createConnection = async (data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    const contact = addLocalItem(ctx.userId, 'network', {
        name: data.name,
        relationship: data.relationship || 'Friend',
        sharedHabits: data.sharedHabits || ''
    });
    const details = [
        { label: 'Relationship', value: contact.relationship },
        { label: 'Shared', value: contact.sharedHabits || 'None' }
    ];
    return {
        message: `${EMOJI.success} CONNECTED!\n${DIVIDER}\n\n${formatDetailsBlock(contact.name.toUpperCase(), details)}`,
        actions: [
            { id: 'network-view', label: 'View network', value: 'show network', kind: 'reply', variant: 'secondary' }
        ],
        entity: { type: 'network', id: contact.id, name: contact.name, data: contact }
    };
};

const removeConnection = async (target: TargetMatch, ctx: AssistantContext): Promise<ActionResult> => {
    const removed = removeLocalItem(ctx.userId, 'network', target.id!);
    return {
        message: `${EMOJI.success} DELETED!\n${DIVIDER}\n\n${target.name} removed from network.`,
        actions: [
            { id: 'network-undo', label: 'Undo delete', value: 'undo delete', kind: 'reply', variant: 'secondary' }
        ],
        deleted: { type: 'network', data: removed }
    };
};

const viewNetwork = async (_target: TargetMatch | null, ctx: AssistantContext): Promise<ActionResult> => {
    const data = loadLocalData(ctx.userId);
    if (!data.network.length) return { message: `${EMOJI.info} No connections yet.` };
    const list = data.network.slice(0, 8).map((contact: any) => `- ${contact.name} (${contact.relationship})`).join('\n');
    return {
        message: `\uD83D\uDC65 NETWORK\n${DIVIDER}\n\n${list}`,
        actions: [
            { id: 'network-add', label: 'Add friend', value: 'add friend', kind: 'reply', variant: 'primary' }
        ]
    };
};

const restoreConnection = async (data: any, ctx: AssistantContext): Promise<ActionResult> => {
    const contact = addLocalItem(ctx.userId, 'network', data);
    return {
        message: `${EMOJI.success} RESTORED\n${DIVIDER}\n\n${contact.name} restored.`,
        entity: { type: 'network', id: contact.id, name: contact.name }
    };
};

export const Network: ChatHandler = {
    entity: 'network',
    label: 'Network',
    parseInput,
    getCreateFields,
    buildSummary,
    findTarget,
    create: createConnection,
    remove: removeConnection,
    view: viewNetwork,
    restore: restoreConnection
};
