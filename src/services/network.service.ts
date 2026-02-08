import { supabase } from '../lib/supabase';
import { CreateNetworkConnectionInput, NetworkConnection } from '../types/network';

const mapConnection = (row: any): NetworkConnection => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  relationship: row.relationship || undefined,
  sharedHabits: row.shared_habits || undefined,
  createdAt: row.created_at
});

export const NetworkService = {
  async getConnections(userId?: string): Promise<NetworkConnection[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('network_connections')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching network connections:', error);
      return [];
    }
    return (data || []).map(mapConnection);
  },

  async createConnection(input: CreateNetworkConnectionInput, userId?: string): Promise<NetworkConnection> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');
    const { data, error } = await supabase
      .from('network_connections')
      .insert({
        user_id: uid,
        name: input.name,
        relationship: input.relationship || 'friend',
        shared_habits: input.sharedHabits
      })
      .select()
      .single();
    if (error) throw error;
    return mapConnection(data);
  },

  async deleteConnection(id: string) {
    const { error } = await supabase.from('network_connections').delete().eq('id', id);
    if (error) throw error;
  }
};
