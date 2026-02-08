export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  notes?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string;
  priority?: TaskPriority;
  notes?: string;
}
