import { supabase } from '../lib/supabase';
import { MultiverseLink, MultiverseEntityType, MultiverseRelationType } from '../types/multiverse';

export const MultiverseService = {
    async getLinks(): Promise<MultiverseLink[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('multiverse_links')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.warn("Multiverse links table might not exist yet:", error);
            return [];
        }

        return (data || []).map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            sourceType: l.source_type as MultiverseEntityType,
            sourceId: l.source_id,
            targetType: l.target_type as MultiverseEntityType,
            targetId: l.target_id,
            relationType: l.relation_type as MultiverseRelationType,
            metadata: l.metadata,
            createdAt: l.created_at
        }));
    },

    async createLink(link: Omit<MultiverseLink, 'id' | 'userId' | 'createdAt'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data, error } = await supabase
            .from('multiverse_links')
            .insert({
                user_id: user.id,
                source_type: link.sourceType,
                source_id: link.sourceId,
                target_type: link.targetType,
                target_id: link.targetId,
                relation_type: link.relationType,
                metadata: link.metadata || {}
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLink(id: string) {
        const { error } = await supabase
            .from('multiverse_links')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async repairGraph() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log("🌌 INITIATING MULTIVERSE GRAPH REPAIR...");

        // 1. Migrate Habit Links
        const { data: hLinks } = await supabase.from('habit_links').select('*').eq('user_id', user.id);
        if (hLinks) {
            for (const l of hLinks) {
                await this.createLink({
                    sourceType: 'habit',
                    sourceId: l.source_habit_id,
                    targetType: 'habit',
                    targetId: l.target_habit_id,
                    relationType: l.type === 'synergy' ? 'synergy' : 'prerequisite'
                }).catch(() => { }); // Ignore duplicates
            }
        }

        // 2. Migrate YouTube -> Habit Links
        const { data: vLinks } = await supabase.from('youtube_videos').select('id, habit_id').eq('user_id', user.id).not('habit_id', 'is', null);
        if (vLinks) {
            for (const v of vLinks) {
                await this.createLink({
                    sourceType: 'video',
                    sourceId: v.id,
                    targetType: 'habit',
                    targetId: v.habit_id,
                    relationType: 'reference'
                }).catch(() => { });
            }
        }

        // 3. Migrate Resources -> Habit Links
        const { data: rLinks } = await supabase.from('learning_resources').select('id, habit_id').eq('user_id', user.id).not('habit_id', 'is', null);
        if (rLinks) {
            for (const r of rLinks) {
                await this.createLink({
                    sourceType: 'note',
                    sourceId: r.id,
                    targetType: 'habit',
                    targetId: r.habit_id,
                    relationType: 'reference'
                }).catch(() => { });
            }
        }

        console.log("✅ MULTIVERSE GRAPH REPAIRED.");
    }
};
