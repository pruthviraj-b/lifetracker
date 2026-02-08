import { AchievementService } from '../services/achievement.service';
import { ActionResult, AssistantContext, ChatHandler } from './chatTypes';
import { DIVIDER, EMOJI } from './chatUtils';

const parseInput = (text: string) => ({ query: text.trim() });

const getCreateFields = () => [];

const buildSummary = () => `${EMOJI.info} Achievements are auto-unlocked.`;

const viewAchievements = async (_target: any, ctx: AssistantContext): Promise<ActionResult> => {
    const achievements = await AchievementService.getAchievements();
    const unlocked = achievements.filter(a => a.unlocked_at);
    const locked = achievements.filter(a => !a.unlocked_at).slice(0, 5);

    const unlockedList = unlocked.length
        ? unlocked.map(a => `- ${a.name}`).join('\n')
        : 'No achievements unlocked yet.';
    const lockedList = locked.length
        ? locked.map(a => `- ${a.name}`).join('\n')
        : 'All achievements unlocked!';

    return {
        message: `\uD83C\uDFC6 ACHIEVEMENTS\n${DIVIDER}\n\nUnlocked:\n${unlockedList}\n\nIn Progress:\n${lockedList}`,
        actions: [
            { id: 'achievements-back', label: 'Back', value: 'show dashboard', kind: 'reply', variant: 'secondary' }
        ]
    };
};

export const Achievements: ChatHandler = {
    entity: 'achievement',
    label: 'Achievements',
    parseInput,
    getCreateFields,
    buildSummary,
    view: viewAchievements
};
