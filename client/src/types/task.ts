export interface Task {
  id: string;
  title: string;
  description: string;
  notes?: string;
  dependency: string | null;
  dependency_title: string | null;
  deadline: string;
  estimated_duration: number;
  priority: number;
  start_time: string | null;
  end_time: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  user: string;
  is_independent: boolean;
  is_overdue: boolean;
  can_be_completed: boolean;
  can_be_scheduled: boolean;
}

export interface TaskDetailedView extends Task {
  dependency_details?: {
    id: string;
    title: string;
    status: string;
    completed: boolean;
  } | null;
  dependent_tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: number;
    deadline: string | null;
  }>;
  dependent_completion?: number;
  is_scheduled?: boolean;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  dependency?: string | null;
  deadline: string;
  estimated_duration: number;
  priority: number;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  notes?: string;
  dependency?: string | null;
  deadline?: string;
  estimated_duration?: number;
  priority?: number;
  status?: TaskStatus;
}

export interface TaskAnalytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  independent_tasks: number;
  dependent_tasks: number;
  completion_rate: number;
  priority_distribution: { [key: number]: number };
}
