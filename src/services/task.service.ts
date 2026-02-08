import { supabase } from '../lib/supabase';
import { CreateTaskInput, Task } from '../types/task';

const mapTask = (row: any): Task => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  dueDate: row.due_date || undefined,
  priority: row.priority || 'medium',
  notes: row.notes || undefined,
  status: row.status || 'open',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at || undefined
});

export const TaskService = {
  async getTasks(userId?: string): Promise<Task[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return (data || []).map(mapTask);
  },

  async createTask(input: CreateTaskInput, userId?: string): Promise<Task> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: uid,
        title: input.title,
        due_date: input.dueDate,
        priority: input.priority || 'medium',
        notes: input.notes,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return mapTask(data);
  },

  async updateTask(id: string, updates: Partial<CreateTaskInput> & { status?: string; completedAt?: string }) {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;

    const { error } = await supabase.from('tasks').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }
};
