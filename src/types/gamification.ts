export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export interface PlayerStats {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    streak: number;
    title: string; // e.g., "Novice Wanderer", "Cyber Samurai"
}

export interface Quest {
    id: string;
    title: string;
    description?: string;
    difficulty: QuestDifficulty;
    completed: boolean;
    xpReward: number;
}

export const XP_TABLE = {
    EASY: 10,
    MEDIUM: 25,
    HARD: 50,
    EPIC: 100
};

export const LEVEL_TITLES = [
    "Glitch in the System",
    "Novice Hacker",
    "Code Runner",
    "Net Stalker",
    "Cyber Samurai",
    "Neon Warlord",
    "System Architect",
    "Digital Deity"
];
