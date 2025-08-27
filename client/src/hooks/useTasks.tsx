import { useState, useEffect, useCallback } from 'react';
import { taskService } from '@/services/tasks';
import { Task, TaskUpdateInput } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

interface ScheduledTasksData {
  scheduled_tasks: Task[];
  total_scheduled: number;
  newly_scheduled: number;
  metta_logic_applied: boolean;
  scheduling_summary: {
    independent_tasks_scheduled: number;
    dependent_tasks_scheduled: number;
  };
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduledTasksData, setScheduledTasksData] = useState<ScheduledTasksData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all tasks
  const fetchTasks = useCallback(async (status?: string, includeCompleted?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.getTasks(status, includeCompleted);
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      } else {
        setError(response.error || 'Failed to fetch tasks');
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch tasks',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError('Network error occurred');
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch scheduled tasks with MeTTa logic
  const fetchScheduledTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.getScheduledTasks();
      if (response.success && response.data) {
        setScheduledTasksData(response.data);
        
        // Show toast if MeTTa logic was applied
        if (response.data.metta_logic_applied && response.data.newly_scheduled > 0) {
          toast({
            title: 'MeTTa Scheduling Applied',
            description: `Automatically scheduled ${response.data.newly_scheduled} tasks using MeTTa logic`,
          });
          
          // If tasks were scheduled, refresh the regular tasks to get updated scheduling data
          setTimeout(() => fetchTasks(), 500); // Small delay to ensure backend has processed
        }
      } else {
        setError(response.error || 'Failed to fetch scheduled tasks');
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch scheduled tasks',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setError('Network error occurred');
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTasks]);

  // Update a task
  const updateTask = useCallback(async (taskId: string, taskData: TaskUpdateInput) => {
    setLoading(true);
    try {
      const response = await taskService.updateTask(taskId, taskData);
      if (response.success && response.data) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? response.data!.task : task
        ));
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
        
        // Refresh both task lists
        fetchTasks();
        fetchScheduledTasks();
        
        return response.data.task;
      } else {
        // Handle specific error messages from backend (like dependency validation)
        const errorMessage = response.error || 'Failed to update task';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTasks, fetchScheduledTasks]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        
        // Update scheduled tasks data
        if (scheduledTasksData) {
          setScheduledTasksData(prev => prev ? {
            ...prev,
            scheduled_tasks: prev.scheduled_tasks.filter(task => task.id !== taskId),
            total_scheduled: prev.total_scheduled - 1
          } : null);
        }
        
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        });
        
        // Refresh both task lists
        fetchTasks();
        fetchScheduledTasks();
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete task',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTasks, fetchScheduledTasks, scheduledTasksData]);

  // Initialize
  useEffect(() => {
    fetchTasks();
    fetchScheduledTasks();
  }, [fetchTasks, fetchScheduledTasks]);

  return {
    tasks,
    scheduledTasksData,
    loading,
    error,
    fetchTasks,
    fetchScheduledTasks,
    updateTask,
    deleteTask,
  };
};
