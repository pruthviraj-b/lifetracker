import { useState, useEffect } from 'react';
import { PlayerStats, Quest, XP_TABLE, LEVEL_TITLES } from '../types/gamification';

const STORAGE_KEY = 'anime_tracker_stats';

const INITIAL_STATS: PlayerStats = {
    level: 1,
    currentXP: 0,
    nextLevelXP: 100,
    streak: 0,
    title: LEVEL_TITLES[0]
};

export function useGamification() {
    const [stats, setStats] = useState<PlayerStats>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }, [stats]);

    const addXP = (amount: number) => {
        setStats(prev => {
            let newXP = prev.currentXP + amount;
            let newLevel = prev.level;
            let newNextLevelXP = prev.nextLevelXP;

            // Level Up Logic
            if (newXP >= newNextLevelXP) {
                newXP -= newNextLevelXP;
                newLevel += 1;
                // Simple quadratic scaling for next level requirement
                newNextLevelXP = Math.floor(newNextLevelXP * 1.5);
            }

            // Update Title based on level (cap at max title)
            const titleIndex = Math.min(newLevel - 1, LEVEL_TITLES.length - 1);
            const newTitle = LEVEL_TITLES[titleIndex];

            return {
                ...prev,
                level: newLevel,
                currentXP: newXP,
                nextLevelXP: newNextLevelXP,
                title: newTitle
            };
        });
    };

    const completeQuest = (quest: Quest) => {
        if (quest.completed) return; // Already completed

        // Calculate XP
        const xp = quest.xpReward || XP_TABLE[quest.difficulty] || 10;
        addXP(xp);
    };

    return {
        stats,
        addXP,
        completeQuest
    };
}
