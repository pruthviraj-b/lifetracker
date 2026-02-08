import { supabase } from '../lib/supabase';
import { CreateProtocolInput, Protocol } from '../types/protocol';

const mapProtocol = (row: any): Protocol => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  steps: row.steps || [],
  totalMinutes: row.total_minutes || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const ProtocolService = {
  async getProtocols(userId?: string): Promise<Protocol[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching protocols:', error);
      return [];
    }
    return (data || []).map(mapProtocol);
  },

  async createProtocol(input: CreateProtocolInput, userId?: string): Promise<Protocol> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');

    const totalMinutes = (input.steps || []).reduce((sum, step) => sum + (step.minutes || 0), 0);

    const { data, error } = await supabase
      .from('protocols')
      .insert({
        user_id: uid,
        title: input.title,
        steps: input.steps || [],
        total_minutes: totalMinutes
      })
      .select()
      .single();

    if (error) throw error;
    return mapProtocol(data);
  },

  async updateProtocol(id: string, updates: Partial<CreateProtocolInput>) {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.steps !== undefined) {
      payload.steps = updates.steps;
      payload.total_minutes = updates.steps.reduce((sum, step) => sum + (step.minutes || 0), 0);
    }
    const { error } = await supabase.from('protocols').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteProtocol(id: string) {
    const { error } = await supabase.from('protocols').delete().eq('id', id);
    if (error) throw error;
  }
};
