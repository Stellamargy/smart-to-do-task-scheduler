import { apiService, ApiResponse } from './api';
import { API_CONFIG } from '@/config/api';
import {
  Task,
  TaskUpdateInput,
} from '@/types/task';

interface ScheduledTasksResponse {
  scheduled_tasks: Task[];
  total_scheduled: number;
  newly_scheduled: number;
  metta_logic_applied: boolean;
  scheduling_summary: {
    independent_tasks_scheduled: number;
    dependent_tasks_scheduled: number;
  };
}

class TaskService {
  // Get all tasks
  async getTasks(status?: string, includeCompleted?: boolean): Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (includeCompleted !== undefined) params.append('include_completed', includeCompleted.toString());
    
    // Send current time and timezone to backend for accurate scheduling
    const currentTime = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    params.append('current_time', currentTime);
    params.append('timezone', timezone);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.TASKS.BASE}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get<{ tasks: Task[]; total: number }>(endpoint);
  }

  // Get scheduled tasks with MeTTa logic
  async getScheduledTasks(): Promise<ApiResponse<ScheduledTasksResponse>> {
    // Send current time and timezone to backend for accurate scheduling
    const currentTime = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams();
    params.append('current_time', currentTime);
    params.append('timezone', timezone);
    
    return apiService.get<ScheduledTasksResponse>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/scheduled?${params.toString()}`);
  }

  // Get a single task by ID
  async getTask(taskId: string): Promise<ApiResponse<{ task: Task; message: string }>> {
    return apiService.get<{ task: Task; message: string }>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`);
  }

  // Update a task
  async updateTask(taskId: string, taskData: TaskUpdateInput): Promise<ApiResponse<{ message: string; task: Task }>> {
    return apiService.put<{ message: string; task: Task }>(
      `${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`,
      taskData
    );
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; message: string }>> {
    return apiService.get<{ status: string; message: string }>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/health`);
  }
}

export const taskService = new TaskService();
export default taskService;
