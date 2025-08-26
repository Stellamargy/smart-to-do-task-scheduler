export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  dependencies: string[]; // Array of task IDs that must be completed first
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
}