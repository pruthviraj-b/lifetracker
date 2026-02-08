import { supabase } from '../lib/supabase';
import { CreateMetricInput, MetricLog } from '../types/metric';

const mapMetric = (row: any): MetricLog => ({
  id: row.id,
  userId: row.user_id,
  metric: row.metric,
  value: row.value ? Number(row.value) : undefined,
  unit: row.unit || undefined,
  logDate: row.log_date || undefined,
  createdAt: row.created_at
});

export const MetricsService = {
  async getLogs(userId?: string): Promise<MetricLog[]> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('metric_logs')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching metric logs:', error);
      return [];
    }
    return (data || []).map(mapMetric);
  },

  async createLog(input: CreateMetricInput, userId?: string): Promise<MetricLog> {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('No user logged in');
    const { data, error } = await supabase
      .from('metric_logs')
      .insert({
        user_id: uid,
        metric: input.metric,
        value: input.value,
        unit: input.unit,
        log_date: input.logDate
      })
      .select()
      .single();
    if (error) throw error;
    return mapMetric(data);
  },

  async deleteLog(id: string) {
    const { error } = await supabase.from('metric_logs').delete().eq('id', id);
    if (error) throw error;
  }
};
