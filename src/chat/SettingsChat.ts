import { UserPreferencesService } from '../services/userPreferences.service';
import { ActionResult, AssistantContext, ChatHandler, TargetMatch } from './chatTypes';
import { DIVIDER, EMOJI, FlowField, formatDetailsBlock, formatHeader } from './chatUtils';

const parseInput = (text: string) => {
    const lowered = text.toLowerCase();
    const wantsNotifications = lowered.includes('notification') || lowered.includes('reminder') || lowered.includes('sound');
    const notify =
        wantsNotifications && (lowered.includes('off') || lowered.includes('disable'))
            ? false
            : wantsNotifications && (lowered.includes('on') || lowered.includes('enable'))
                ? true
                : undefined;
    return {
        theme: lowered.includes('dark') ? 'dark' : lowered.includes('light') ? 'light' : undefined,
        language: lowered.includes('spanish') ? 'es' : lowered.includes('english') ? 'en-US' : undefined,
        notify
    };
};

const getCreateFields = (): FlowField[] => [
    {
        key: 'theme',
        question: 'Theme preference?',
        options: ['Light', 'Dark', 'Auto'],
        parser: (input: string) => ({ theme: input.trim().toLowerCase() })
    }
];

const buildSummary = (action: string, data: Record<string, any>) => {
    const details = [
        { label: 'Theme', value: data.theme || 'No change' },
        { label: 'Language', value: data.language || 'No change' },
        { label: 'Notifications', value: data.notify ? 'On' : 'No change' }
    ];
    return `${formatHeader(action.toUpperCase())}\n\n${formatDetailsBlock('SETTINGS', details)}\n\nApply these changes?`;
};

const updateSettings = async (_target: TargetMatch | null, data: Record<string, any>, ctx: AssistantContext): Promise<ActionResult> => {
    if (!ctx.userId) return { message: `${EMOJI.warning} Please sign in to update settings.` };
    const updates: any = {};
    if (data.theme) updates.theme = data.theme;
    if (data.language) updates.language = data.language;
    if (data.notify !== undefined) updates.notify_push = data.notify;

    await UserPreferencesService.updatePreferences(updates);

    const details = [
        { label: 'Theme', value: updates.theme || 'Unchanged' },
        { label: 'Language', value: updates.language || 'Unchanged' },
        { label: 'Notifications', value: updates.notify_push === undefined ? 'Unchanged' : updates.notify_push ? 'On' : 'Off' }
    ];

    return {
        message: `${EMOJI.success} UPDATED!\n${DIVIDER}\n\n${formatDetailsBlock('SETTINGS UPDATED', details)}`,
        actions: [
            { id: 'settings-view', label: 'View settings', value: 'show settings', kind: 'reply', variant: 'secondary' }
        ]
    };
};

const viewSettings = async (): Promise<ActionResult> => {
    const prefs = await UserPreferencesService.getPreferences();
    const details = [
        { label: 'Theme', value: prefs.theme },
        { label: 'Language', value: prefs.language },
        { label: 'Notifications', value: prefs.notify_push ? 'On' : 'Off' },
        { label: 'Time Zone', value: prefs.timezone }
    ];
    return {
        message: `\u2699\ufe0f SETTINGS\n${DIVIDER}\n\n${formatDetailsBlock('CURRENT SETTINGS', details)}`,
        actions: [
            { id: 'settings-edit', label: 'Change settings', value: 'change settings', kind: 'reply', variant: 'primary' }
        ]
    };
};

export const SettingsChat: ChatHandler = {
    entity: 'settings',
    label: 'Settings',
    parseInput,
    getCreateFields,
    buildSummary,
    update: updateSettings,
    view: viewSettings
};
