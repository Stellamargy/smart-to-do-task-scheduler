import React, { createContext, useContext, useState, useCallback } from 'react';
import { CreateTaskDialog } from '@/components/dashboard/CreateTaskDialog';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useTasks } from '@/hooks/useTasks';

interface FloatingActionContextType {
  openCreateTask: () => void;
  closeCreateTask: () => void;
  isOpen: boolean;
}

const FloatingActionContext = createContext<FloatingActionContextType | undefined>(undefined);

export const useFloatingAction = () => {
  const context = useContext(FloatingActionContext);
  if (!context) {
    throw new Error('useFloatingAction must be used within a FloatingActionProvider');
  }
  return context;
};

interface FloatingActionProviderProps {
  children: React.ReactNode;
}

export const FloatingActionProvider: React.FC<FloatingActionProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { fetchTasks, fetchScheduledTasks } = useTasks();

  const openCreateTask = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCreateTask = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTaskCreated = useCallback(async () => {
    // Trigger cold refresh of data across the app
    await Promise.all([
      fetchTasks(),
      fetchScheduledTasks()
    ]);
  }, [fetchTasks, fetchScheduledTasks]);

  const value = {
    openCreateTask,
    closeCreateTask,
    isOpen,
  };

  return (
    <FloatingActionContext.Provider value={value}>
      {children}
      <FloatingActionButton onClick={openCreateTask} />
      <CreateTaskDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        onTaskCreated={handleTaskCreated}
      />
    </FloatingActionContext.Provider>
  );
};
