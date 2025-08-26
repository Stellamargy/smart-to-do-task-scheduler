import { useState, useCallback } from 'react';
import { Task, TaskStatus, Priority } from '@/types/task';

// Chains:
// 1st chain (2 tasks): Clean the house (1) → Arrange the house (2)
// 2nd chain (3 tasks): Write proposal (5) → Review proposal (6) → Submit proposal (7)
// 3rd chain (4 tasks): Research market trends (8) → Create project plan (9) → Design system architecture (10) → Develop MVP features (11)

const mockTasks: Task[] = [
  // Chain 1 (2 tasks)
  {
    id: '1',
    title: 'Clean the house',
    description: 'Deep clean all rooms including kitchen and bathrooms',
    priority: 'high',
    status: 'completed',
    deadline: '2025-01-15',
    createdAt: '2024-12-25',
    completedAt: '2024-12-29',
    dependencies: []
  },
  {
    id: '2',
    title: 'Arrange the house',
    description: 'Organize furniture and decorations after cleaning',
    priority: 'medium',
    status: 'pending',
    deadline: '2025-01-20',
    createdAt: '2024-12-25',
    dependencies: ['1']
  },

  // Chain 2 (3 tasks)
  {
    id: '5',
    title: 'Write proposal',
    description: 'Draft the project proposal document',
    priority: 'high',
    status: 'completed',
    deadline: '2025-01-08',
    createdAt: '2024-12-24',
    completedAt: '2024-12-27',
    dependencies: []
  },
  {
    id: '6',
    title: 'Review proposal',
    description: 'Review and edit the drafted proposal',
    priority: 'medium',
    status: 'completed',
    deadline: '2025-01-09',
    createdAt: '2024-12-25',
    completedAt: '2024-12-28',
    dependencies: ['5']
  },
  {
    id: '7',
    title: 'Submit proposal',
    description: 'Submit the final proposal to stakeholders',
    priority: 'high',
    status: 'pending',
    deadline: '2025-01-11',
    createdAt: '2024-12-25',
    dependencies: ['6']
  },

  // Chain 3 (4 tasks)
  {
    id: '8',
    title: 'Research market trends',
    description: 'Conduct thorough market research and competitor analysis',
    priority: 'high',
    status: 'completed',
    deadline: '2025-01-02',
    createdAt: '2024-12-20',
    completedAt: '2024-12-28',
    dependencies: []
  },
  {
    id: '9',
    title: 'Create project plan',
    description: 'Develop detailed project timeline and resource allocation',
    priority: 'high',
    status: 'completed',
    deadline: '2025-01-05',
    createdAt: '2024-12-21',
    completedAt: '2024-12-30',
    dependencies: ['8']
  },
  {
    id: '10',
    title: 'Design system architecture',
    description: 'Create technical architecture and system design documents',
    priority: 'high',
    status: 'in-progress',
    deadline: '2025-01-18',
    createdAt: '2024-12-22',
    dependencies: ['9']
  },
  {
    id: '11',
    title: 'Develop MVP features',
    description: 'Build core functionality and minimum viable product',
    priority: 'high',
    status: 'pending',
    deadline: '2025-01-25',
    createdAt: '2024-12-23',
    dependencies: ['10']
  },
  {
    id: '12',
    title: 'Take Kids To Playground',
    description: 'Take the kids to the local playground for some outdoor fun',
    priority: 'high',
    status: 'pending',
    deadline: '2025-01-25',
    createdAt: '2024-12-23',
    dependencies: []
  }
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const isCompleting = task.status !== 'completed';
        return {
          ...task,
          status: isCompleting ? 'completed' : 'pending' as TaskStatus,
          completedAt: isCompleting ? new Date().toISOString() : undefined
        };
      }
      return task;
    }));
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const getTaskStats = useCallback(() => {
    const now = new Date();
    const today = now.toDateString();
    
    const stats = tasks.reduce((acc, task) => {
      acc.total++;
      
      if (task.status === 'completed') {
        acc.completed++;
      } else {
        acc.pending++;
        
        if (task.deadline && new Date(task.deadline) < now) {
          acc.overdue++;
        }
        
        if (task.deadline && new Date(task.deadline).toDateString() === today) {
          acc.today++;
        }
      }
      
      return acc;
    }, {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      today: 0
    });
    
    return stats;
  }, [tasks]);

  const getTodaysTasks = useCallback(() => {
    const today = new Date().toDateString();
    return tasks.filter(task => 
      task.deadline && new Date(task.deadline).toDateString() === today
    );
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.deadline && 
      new Date(task.deadline) < now && 
      task.status !== 'completed'
    );
  }, [tasks]);

  return {
    tasks,
    toggleTaskComplete,
    addTask,
    updateTask,
    deleteTask,
    getTaskStats,
    getTodaysTasks,
    getOverdueTasks
  };
}