import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskPriority } from '@/types/task';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTask: Partial<Task>) => void;
  loading?: boolean;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    notes: task.notes || '',
    deadline: new Date(task.deadline),
    estimated_duration: task.estimated_duration.toString(),
    priority: task.priority.toString(),
    status: task.status
  });

  // Time state for deadline
  const [deadlineTime, setDeadlineTime] = useState(() => {
    const date = new Date(task.deadline);
    return {
      hours: date.getHours().toString().padStart(2, '0'),
      minutes: date.getMinutes().toString().padStart(2, '0')
    };
  });

  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      notes: task.notes || '',
      deadline: new Date(task.deadline),
      estimated_duration: task.estimated_duration.toString(),
      priority: task.priority.toString(),
      status: task.status
    });

    const date = new Date(task.deadline);
    setDeadlineTime({
      hours: date.getHours().toString().padStart(2, '0'),
      minutes: date.getMinutes().toString().padStart(2, '0')
    });
  }, [task]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        deadline: date
      }));
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    setDeadlineTime(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Combine date and time for deadline - keep as local time without timezone conversion
    const deadline = new Date(formData.deadline);
    deadline.setHours(parseInt(deadlineTime.hours), parseInt(deadlineTime.minutes), 0, 0);
    
    // Format as local datetime string (YYYY-MM-DDTHH:MM:SS) without timezone conversion
    const year = deadline.getFullYear();
    const month = String(deadline.getMonth() + 1).padStart(2, '0');
    const day = String(deadline.getDate()).padStart(2, '0');
    const hours = String(deadline.getHours()).padStart(2, '0');
    const minutes = String(deadline.getMinutes()).padStart(2, '0');
    const seconds = String(deadline.getSeconds()).padStart(2, '0');
    
    const localDeadlineString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    const updates: Partial<Task> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      deadline: localDeadlineString,
      estimated_duration: parseFloat(formData.estimated_duration),
      priority: parseInt(formData.priority),
      status: formData.status as TaskStatus
    };

    onSave(updates);
  };

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.estimated_duration !== '' &&
      !isNaN(parseFloat(formData.estimated_duration)) &&
      parseFloat(formData.estimated_duration) > 0
    );
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      case 4: return 'Urgent';
      case 5: return 'Critical';
      default: return 'Low';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      default: return 'Pending';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details, deadline, priority, and add notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Task title"
              className={formData.title.trim() === '' ? 'border-red-300' : ''}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add your notes here... (progress updates, thoughts, reminders, etc.)"
              rows={4}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
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
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {/* Time inputs */}
              <div className="flex gap-1 items-center">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={deadlineTime.hours}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="w-16 text-center"
                  placeholder="HH"
                />
                <span>:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={deadlineTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-16 text-center"
                  placeholder="MM"
                />
              </div>
            </div>
          </div>

          {/* Duration and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.estimated_duration}
                onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                placeholder="e.g., 2.5"
                className={
                  formData.estimated_duration === '' || 
                  isNaN(parseFloat(formData.estimated_duration)) || 
                  parseFloat(formData.estimated_duration) <= 0 
                    ? 'border-red-300' 
                    : ''
                }
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <SelectItem key={priority} value={priority.toString()}>
                      {getPriorityLabel(priority)} ({priority})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
