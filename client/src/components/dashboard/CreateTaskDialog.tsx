import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskPriority } from '@/types/task';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: number;
  estimated_duration: number;
  deadline: Date | undefined;
  deadlineTime: string;
  dependency: string | null;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskCreated,
}) => {
  const { tasks, createTask, updateTask, fetchTasks } = useTasks();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    estimated_duration: 1,
    deadline: undefined,
    deadlineTime: '23:59', // Default to end of day
    dependency: null,
  });

  const [showCalendar, setShowCalendar] = useState(false);

  // Get available tasks for dependency selection (exclude completed tasks)
  const availableTasks = tasks.filter(task => task.status !== 'completed');

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      estimated_duration: 1,
      deadline: undefined,
      deadlineTime: '23:59',
      dependency: null,
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.deadline) {
      toast({
        title: 'Validation Error',
        description: 'Deadline date is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.deadlineTime) {
      toast({
        title: 'Validation Error',
        description: 'Deadline time is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into a single Date object
      const [hours, minutes] = formData.deadlineTime.split(':').map(Number);
      const combinedDeadline = new Date(formData.deadline);
      combinedDeadline.setHours(hours, minutes, 0, 0);

      // Format as local datetime string (YYYY-MM-DDTHH:MM:SS) without timezone conversion
      const year = combinedDeadline.getFullYear();
      const month = String(combinedDeadline.getMonth() + 1).padStart(2, '0');
      const day = String(combinedDeadline.getDate()).padStart(2, '0');
      const deadlineHours = String(combinedDeadline.getHours()).padStart(2, '0');
      const deadlineMinutes = String(combinedDeadline.getMinutes()).padStart(2, '0');
      const deadlineSeconds = String(combinedDeadline.getSeconds()).padStart(2, '0');
      
      const localDeadlineString = `${year}-${month}-${day}T${deadlineHours}:${deadlineMinutes}:${deadlineSeconds}`;

      // Prepare task data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        estimated_duration: formData.estimated_duration,
        deadline: localDeadlineString,
        dependency: formData.dependency,
      };

      // Handle dependency chain logic
      let dependencyUpdateFunction: ((newTaskId: string) => Promise<void>) | null = null;
      
      if (formData.dependency) {
        // Find tasks that currently depend on the selected dependency
        const tasksCurrentlyDependingOnSelectedDependency = tasks.filter(
          task => task.dependency === formData.dependency
        );

        // If there are tasks depending on the selected dependency,
        // we need to update them to depend on the new task instead
        if (tasksCurrentlyDependingOnSelectedDependency.length > 0) {
          console.log('🔗 Dependency chain reorganization needed');
          console.log(`Tasks currently depending on ${formData.dependency}:`, 
            tasksCurrentlyDependingOnSelectedDependency.map(t => t.title));

          // Create the function to handle dependency chain updates
          dependencyUpdateFunction = async (newTaskId: string) => {
            const updatePromises = tasksCurrentlyDependingOnSelectedDependency.map(task => {
              console.log(`📝 Updating task "${task.title}" to depend on new task instead`);
              return updateTask(task.id, { dependency: newTaskId });
            });
            
            await Promise.all(updatePromises);
            
            toast({
              title: 'Dependency Chain Updated',
              description: `${tasksCurrentlyDependingOnSelectedDependency.length} task(s) now depend on the new task`,
            });
          };
        }
      }

      // Create the task
      const response = await createTask(taskData);

      if (response) {
        toast({
          title: 'Task Created',
          description: `"${formData.title}" has been created successfully`,
        });

        // Handle dependency chain updates if needed
        if (dependencyUpdateFunction) {
          try {
            await dependencyUpdateFunction(response.id);
          } catch (error) {
            console.warn('Failed to update dependency chain:', error);
            toast({
              title: 'Warning',
              description: 'Task created but dependency chain update failed',
              variant: 'destructive',
            });
          }
        }

        // Trigger cold refresh of data
        await fetchTasks();
        
        // Call the callback if provided
        if (onTaskCreated) {
          onTaskCreated();
        }

        // Close dialog
        handleClose();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW: return 'Low';
      case TaskPriority.MEDIUM: return 'Medium';
      case TaskPriority.HIGH: return 'High';
      case TaskPriority.URGENT: return 'Urgent';
      case TaskPriority.CRITICAL: return 'Critical';
      default: return 'Medium';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority and Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select 
                value={formData.priority.toString()} 
                onValueChange={(value) => updateFormData('priority', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="4">Urgent</SelectItem>
                  <SelectItem value="5">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_duration}
                onChange={(e) => updateFormData('estimated_duration', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Deadline Date and Time */}
          <div className="space-y-4">
            <Label>Deadline *</Label>
            
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => {
                      updateFormData('deadline', date);
                      setShowCalendar(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.deadlineTime}
                  onChange={(e) => updateFormData('deadlineTime', e.target.value)}
                  className="flex-1"
                  required
                />
              </div>
            </div>

            {/* Combined Preview */}
            {formData.deadline && formData.deadlineTime && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Complete Deadline:</p>
                <p className="text-sm text-blue-700">
                  {format(formData.deadline, "EEEE, MMMM do, yyyy")} at {formData.deadlineTime}
                </p>
              </div>
            )}
          </div>

          {/* Dependency */}
          <div className="space-y-2">
            <Label>Depends On (Optional)</Label>
            <Select 
              value={formData.dependency || "none"} 
              onValueChange={(value) => updateFormData('dependency', value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task this depends on..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No dependency</SelectItem>
                {availableTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title} (Priority: {task.priority})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.dependency && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Dependency Chain Logic:</p>
                  <p>If any tasks currently depend on the selected task, they will be updated to depend on this new task instead, creating a proper chain.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
