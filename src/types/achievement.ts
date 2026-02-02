
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Emoji or Lucide icon name
    condition: {
        type: 'streak' | 'level' | 'habits_count' | 'total_completions';
        value: number;
    };
    unlockedAt?: string; // ISO Date if unlocked
}

export interface Quote {
    text: string;
    author: string;
    category?: 'motivation' | 'discipline' | 'focus';
}
