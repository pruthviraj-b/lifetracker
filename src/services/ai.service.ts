
export const AIService = {
    async polishNote(content: string): Promise<string> {
        // Simulated AI reaction for now
        // In a real implementation, we would use GoogleGenerativeAI
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!content) return content;

        // Basic "smart" polish logic for mock
        const lines = content.split('\n');
        const polishedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return trimmed;
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        });

        return polishedLines.join('\n');
    },

    async summarizeNote(content: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (content.length < 50) return "Note is too short to summarize effectively.";

        return "SUMMARY: " + content.slice(0, 100) + "...";
    },

    async suggestTags(content: string): Promise<string[]> {
        const commonTags = ['important', 'idea', 'follow-up', 'review', 'research'];
        const contentLower = content.toLowerCase();
        return commonTags.filter(tag => contentLower.includes(tag));
    },

    async extractProtocol(content: string): Promise<{ tasks: string[], flashcards: { q: string, a: string }[] }> {
        // Simulated AI extraction logic
        await new Promise(resolve => setTimeout(resolve, 1500));

        const tasks: string[] = [];
        const flashcards: { q: string, a: string }[] = [];

        if (!content) return { tasks, flashcards };

        // Simple heuristic for mock: lines with "?" are flashcards, lines with "-" are tasks
        const lines = content.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-')) tasks.push(trimmed.slice(1).trim());
            if (trimmed.includes('?')) {
                const parts = trimmed.split('?');
                flashcards.push({
                    q: parts[0].trim() + '?',
                    a: parts[1]?.trim() || "Refer to notes for detailed answer."
                });
            }
        });

        // Fallback if none found
        if (tasks.length === 0) tasks.push("Complete in-depth review of lesson content");
        if (flashcards.length === 0) flashcards.push({ q: "What is the core principle of this lesson?", a: "Analyze the notes to define the primary mental model." });

        return { tasks, flashcards };
    }
};
