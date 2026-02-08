export interface ScheduleEvent {
  id: string;
  userId: string;
  title: string;
  eventDate?: string;
  eventTime?: string;
  timeLabel?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateScheduleEventInput {
  title: string;
  eventDate?: string;
  eventTime?: string;
  timeLabel?: string;
}
