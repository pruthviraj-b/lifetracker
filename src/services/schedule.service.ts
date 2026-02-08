import { supabase } from '../lib/supabase';
import { CreateScheduleEventInput, ScheduleEvent } from '../types/schedule';

const mapSchedule = (row: any): ScheduleEvent => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  eventDate: row.event_date || undefined,
  eventTime: row.event_time || undefined,
  timeLabel: row.time_label || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const ScheduleService = {
  async getEvents(userId?: string): Promise<ScheduleEvent[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('user_id', uid)
      .order('event_date', { ascending: true });
    if (error) {
      console.error('Error fetching schedule events:', error);
      return [];
    }
    return (data || []).map(mapSchedule);
  },

  async createEvent(input: CreateScheduleEventInput, userId?: string): Promise<ScheduleEvent> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('schedule_events')
      .insert({
        user_id: uid,
        title: input.title,
        event_date: input.eventDate,
        event_time: input.eventTime,
        time_label: input.timeLabel
      })
      .select()
      .single();
    if (error) throw error;
    return mapSchedule(data);
  },

  async updateEvent(id: string, updates: Partial<CreateScheduleEventInput>) {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.eventDate !== undefined) payload.event_date = updates.eventDate;
    if (updates.eventTime !== undefined) payload.event_time = updates.eventTime;
    if (updates.timeLabel !== undefined) payload.time_label = updates.timeLabel;

    const { error } = await supabase.from('schedule_events').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('schedule_events').delete().eq('id', id);
    if (error) throw error;
  }
};
