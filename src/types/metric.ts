export interface MetricLog {
  id: string;
  userId: string;
  metric: string;
  value?: number;
  unit?: string;
  logDate?: string;
  createdAt: string;
}

export interface CreateMetricInput {
  metric: string;
  value?: number;
  unit?: string;
  logDate?: string;
}
