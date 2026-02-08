import { supabase } from '../lib/supabase';
import { CreateRecallInput, RecallEntry } from '../types/recall';

const mapRecall = (row: any): RecallEntry => ({
  id: row.id,
  userId: row.user_id,
  content: row.content,
  category: row.category || undefined,
  createdAt: row.created_at
});

export const RecallService = {
  async getEntries(userId?: string): Promise<RecallEntry[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('recall_entries')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching recall entries:', error);
      return [];
    }
    return (data || []).map(mapRecall);
  },

  async createEntry(input: CreateRecallInput, userId?: string): Promise<RecallEntry> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('recall_entries')
      .insert({
        user_id: uid,
        content: input.content,
        category: input.category || 'general'
      })
      .select()
      .single();
    if (error) throw error;
    return mapRecall(data);
  },

  async deleteEntry(id: string) {
    const { error } = await supabase.from('recall_entries').delete().eq('id', id);
    if (error) throw error;
  }
};
