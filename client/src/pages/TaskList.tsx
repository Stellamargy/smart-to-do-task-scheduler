import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "@/components/TaskCard";
import { useTasks } from "@/hooks/useTasks";
import { Task, Priority, TaskStatus } from "@/types/task";
import { Search, Filter, Plus } from "lucide-react";

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';

export default function TaskList() {
  const { tasks, toggleTaskComplete } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterType === 'completed' && task.status !== 'completed') return false;
    if (filterType === 'pending' && task.status === 'completed') return false;
    if (filterType === 'overdue') {
      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
      if (!isOverdue) return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    return true;
  });

  const getFilterCount = (type: FilterType) => {
    return tasks.filter(task => {
      if (type === 'all') return true;
      if (type === 'completed') return task.status === 'completed';
      if (type === 'pending') return task.status !== 'completed';
      if (type === 'overdue') {
        return task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
      }
      return false;
    }).length;
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: getFilterCount('all') },
    { value: 'pending', label: 'Pending', count: getFilterCount('pending') },
    { value: 'completed', label: 'Completed', count: getFilterCount('completed') },
    { value: 'overdue', label: 'Overdue', count: getFilterCount('overdue') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks efficiently
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-light hover:shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterType === option.value ? "default" : "outline"}
                  onClick={() => setFilterType(option.value as FilterType)}
                  className="flex items-center gap-2"
                >
                  {option.label}
                  <Badge variant="secondary" className="ml-1">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value: Priority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={toggleTaskComplete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                {searchQuery || filterType !== 'all' || priorityFilter !== 'all'
                  ? 'No tasks match your current filters'
                  : 'No tasks yet. Create your first task to get started!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}