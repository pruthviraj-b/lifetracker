import { supabase } from '../lib/supabase';
import { CreateLibraryItemInput, LibraryItem } from '../types/library';

const mapLibrary = (row: any): LibraryItem => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  url: row.url || undefined,
  category: row.category || undefined,
  createdAt: row.created_at
});

export const LibraryService = {
  async getItems(userId?: string): Promise<LibraryItem[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching library items:', error);
      return [];
    }
    return (data || []).map(mapLibrary);
  },

  async createItem(input: CreateLibraryItemInput, userId?: string): Promise<LibraryItem> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');
    const { data, error } = await supabase
      .from('library_items')
      .insert({
        user_id: uid,
        title: input.title,
        url: input.url,
        category: input.category || 'general'
      })
      .select()
      .single();
    if (error) throw error;
    return mapLibrary(data);
  },

  async deleteItem(id: string) {
    const { error } = await supabase.from('library_items').delete().eq('id', id);
    if (error) throw error;
  }
};
