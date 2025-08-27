import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Network,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  PlayCircle,
  GitBranch,
  Users,
  ArrowRight,
  GripVertical,
  Save,
  X,
} from "lucide-react";

interface DependencyChain {
  id: string;
  tasks: Task[];
  totalDuration: number;
  criticalPath: boolean;
  completionPercentage: number;
}

// Memoized Task Item Component to prevent unnecessary re-renders
const TaskItem = memo(({ 
  task, 
  taskIndex, 
  isLast, 
  matchesFilter, 
  getStatusIcon, 
  filterStatus, 
  filterPriority 
}: {
  task: Task;
  taskIndex: number;
  isLast: boolean;
  matchesFilter: boolean;
  getStatusIcon: (status: TaskStatus) => React.ReactElement;
  filterStatus: string;
  filterPriority: string;
}) => (
  <div className="flex items-center gap-3">
    <div className={`flex items-center gap-3 p-3 rounded-lg flex-1 transition-all ${
      matchesFilter 
        ? 'bg-primary/10 border-2 border-primary/20' 
        : filterStatus === 'all' && filterPriority === 'all'
        ? 'bg-muted/50'
        : 'bg-muted/20 opacity-60'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm font-medium bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center">
          {taskIndex + 1}
        </span>
        {getStatusIcon(task.status)}
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{task.title}</div>
          <div className="text-sm text-muted-foreground truncate">{task.description}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            P{task.priority}
          </Badge>
          <Badge 
            variant={task.status === TaskStatus.COMPLETED ? 'default' : 
                    task.status === TaskStatus.IN_PROGRESS ? 'secondary' : 
                    task.status === TaskStatus.OVERDUE ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {task.status}
          </Badge>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {task.estimated_duration}h
      </div>
    </div>
    {!isLast && (
      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    )}
  </div>
));

const DependencyVisualization: React.FC = () => {
  const { tasks, loading, fetchTasks, updateTask } = useTasks();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'chains' | 'independent'>('chains');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [backupChains, setBackupChains] = useState<DependencyChain[]>([]);
  const [editingChainId, setEditingChainId] = useState<string | null>(null);
  const [tempChainTasks, setTempChainTasks] = useState<Task[]>([]);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Task>>(new Map());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local tasks when new tasks arrive, but preserve existing data and apply optimistic updates
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const currentTime = Date.now();
      const hasMoreTasks = tasks.length > localTasks.length;
      const hasSignificantChange = Math.abs(tasks.length - localTasks.length) > 2;
      const isInitialLoad = localTasks.length === 0;
      const isStaleData = currentTime - lastUpdateTime > 60000; // Increased to 60 seconds
      
      // Count tasks with dependencies in the new data
      const newTasksWithDeps = tasks.filter(t => t.dependency || tasks.some(other => other.dependency === t.id));
      const localTasksWithDeps = localTasks.filter(t => t.dependency || localTasks.some(other => other.dependency === t.id));
      
      // Only update if:
      // 1. Initial load, OR
      // 2. We get significantly more tasks than before, OR
      // 3. We get tasks with more dependencies, OR
      // 4. Data is very stale (60+ seconds)
      const shouldUpdate = isInitialLoad || 
                          hasSignificantChange ||
                          newTasksWithDeps.length > localTasksWithDeps.length ||
                          isStaleData;
      
      if (shouldUpdate) {
        // Apply optimistic updates to new tasks
        const updatedTasks = tasks.map(task => {
          const optimisticTask = optimisticUpdates.get(task.id);
          return optimisticTask || task;
        });
        
        setLocalTasks(updatedTasks);
        setLastUpdateTime(currentTime);
      }
    }
  }, [tasks, localTasks.length, lastUpdateTime, optimisticUpdates]);

  // Only fetch tasks once when component mounts
  useEffect(() => {
    if (!hasInitialized && !loading && !isRefreshing && localTasks.length === 0) {
      setIsRefreshing(true);
      fetchTasks(undefined, true).finally(() => {
        setHasInitialized(true);
        setIsRefreshing(false);
      });
    }
  }, [hasInitialized, loading, isRefreshing, localTasks.length, fetchTasks]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    if (!loading && !isRefreshing) {
      setIsRefreshing(true);
      fetchTasks(undefined, true).finally(() => {
        setIsRefreshing(false);
        setLastUpdateTime(Date.now());
      });
    }
  }, [fetchTasks, loading, isRefreshing]);

  // Optimistic update function - immediately update UI without waiting for server
  const applyOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    // Update optimistic updates map
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      const existingTask = localTasks.find(t => t.id === taskId) || prev.get(taskId);
      if (existingTask) {
        newMap.set(taskId, { ...existingTask, ...updates });
      }
      return newMap;
    });

    // Immediately update local tasks
    setLocalTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, [localTasks]);

  // Clear optimistic update after server response
  const clearOptimisticUpdate = useCallback((taskId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  }, []);

  // Enhanced update task function with optimistic updates
  const updateTaskOptimistically = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Apply optimistic update immediately
    applyOptimisticUpdate(taskId, updates);

    try {
      // Update on server
      await updateTask(taskId, updates);
      // Clear optimistic update after successful server update
      clearOptimisticUpdate(taskId);
    } catch (error) {
      // Revert optimistic update on error
      clearOptimisticUpdate(taskId);
      // Refresh data to get current state
      fetchTasks(undefined, true);
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  }, [applyOptimisticUpdate, clearOptimisticUpdate, updateTask, fetchTasks, toast]);

  // Start editing a chain
  const startEditingChain = useCallback((chain: DependencyChain) => {
    setEditingChainId(chain.id);
    setTempChainTasks([...chain.tasks]);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingChainId(null);
    setTempChainTasks([]);
  }, []);

  // Check if a task can be moved (not completed or overdue)
  const canMoveTask = useCallback((task: Task) => {
    return task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS;
  }, []);

  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeIndex = tempChainTasks.findIndex(task => task.id === active.id);
    const overIndex = tempChainTasks.findIndex(task => task.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    const activeTask = tempChainTasks[activeIndex];
    
    // Check if the active task can be moved
    if (!canMoveTask(activeTask)) {
      toast({
        title: "Cannot move task",
        description: "Only pending or in-progress tasks can be reordered",
        variant: "destructive",
      });
      return;
    }

    // Reorder tasks
    const newTasks = arrayMove(tempChainTasks, activeIndex, overIndex);
    setTempChainTasks(newTasks);
  }, [tempChainTasks, canMoveTask, toast]);

  // Save chain reordering
  const saveChainReordering = useCallback(async () => {
    if (!editingChainId || tempChainTasks.length === 0) return;

    try {
      // Update dependencies based on new order
      const updatePromises = tempChainTasks.map(async (task, index) => {
        const newDependency = index === 0 ? null : tempChainTasks[index - 1].id;
        
        // Only update if dependency changed
        if (task.dependency !== newDependency) {
          return updateTaskOptimistically(task.id, { dependency: newDependency });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      toast({
        title: "Chain reordered successfully",
        description: "Task dependencies have been updated",
      });

      // Refresh tasks to get updated data
      handleRefresh();
      setEditingChainId(null);
      setTempChainTasks([]);
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: "Failed to update task dependencies",
        variant: "destructive",
      });
    }
  }, [editingChainId, tempChainTasks, updateTaskOptimistically, toast, handleRefresh]);

  // Sortable Task Item Component
  const SortableTaskItem = ({ task, index, isLast, canMove, matchesFilter }: {
    task: Task;
    index: number;
    isLast: boolean;
    canMove: boolean;
    matchesFilter: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id, disabled: !canMove });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-3">
        <div className={`flex items-center gap-3 p-3 rounded-lg flex-1 transition-all ${
          matchesFilter 
            ? 'bg-primary/10 border-2 border-primary/20' 
            : filterStatus === 'all' && filterPriority === 'all'
            ? 'bg-muted/50'
            : 'bg-muted/20 opacity-60'
        } ${canMove ? 'cursor-move' : ''} ${!canMove ? 'opacity-75' : ''}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {canMove && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center">
              {index + 1}
            </span>
            {getStatusIcon(task.status)}
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{task.title}</div>
              <div className="text-sm text-muted-foreground truncate">{task.description}</div>
              {!canMove && (
                <div className="text-xs text-orange-600 mt-1">
                  Cannot reorder ({task.status === TaskStatus.COMPLETED ? 'completed' : 'overdue'})
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                P{task.priority}
              </Badge>
              <Badge 
                variant={task.status === TaskStatus.COMPLETED ? 'default' : 
                        task.status === TaskStatus.IN_PROGRESS ? 'secondary' : 
                        task.status === TaskStatus.OVERDUE ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {task.status}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {task.estimated_duration}h
          </div>
        </div>
        {!isLast && (
          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    );
  };

  // Build dependency chains - find root tasks and follow their chains
  const dependencyChains = useMemo((): DependencyChain[] => {
    const tasksToUse = localTasks.length > 0 ? localTasks : tasks;
    if (!tasksToUse || tasksToUse.length === 0) return [];
    
    const chains: DependencyChain[] = [];
    const processedTasks = new Set<string>();

    // Find all tasks that are part of dependency chains (either have dependencies or dependents)
    const tasksInChains = tasksToUse.filter(task => 
      task.dependency || tasksToUse.some(t => t.dependency === task.id)
    );

    // Find root tasks (tasks with no dependencies but have dependents)
    const rootTasks = tasksInChains.filter(task => !task.dependency);

    const buildChainFromRoot = (rootTask: Task): Task[] => {
      const chain: Task[] = [rootTask];
      let currentTasks = [rootTask];

      // Follow the chain forward by finding dependent tasks
      while (currentTasks.length > 0) {
        const nextTasks: Task[] = [];
        
        currentTasks.forEach(currentTask => {
          const dependentTasks = tasksToUse.filter(t => t.dependency === currentTask.id);
          dependentTasks.forEach(depTask => {
            if (!chain.some(t => t.id === depTask.id)) {
              chain.push(depTask);
              nextTasks.push(depTask);
            }
          });
        });
        
        currentTasks = nextTasks;
      }

      return chain;
    };

    // Build chains from each root task
    rootTasks.forEach(rootTask => {
      if (!processedTasks.has(rootTask.id)) {
        const chain = buildChainFromRoot(rootTask);
        
        // Mark all tasks in this chain as processed
        chain.forEach(t => processedTasks.add(t.id));
        
        const totalDuration = chain.reduce((sum, t) => sum + t.estimated_duration, 0);
        const completedTasks = chain.filter(t => t.status === TaskStatus.COMPLETED).length;
        const completionPercentage = (completedTasks / chain.length) * 100;
        
        // Only add chains that are not completely finished (have at least one non-completed task)
        const hasActiveTask = chain.some(t => t.status !== TaskStatus.COMPLETED);
        
        if (hasActiveTask) {
          chains.push({
            id: `chain-${rootTask.id}`,
            tasks: chain,
            totalDuration,
            criticalPath: chain.some(t => t.priority >= TaskPriority.HIGH),
            completionPercentage
          });
        }
      }
    });
    
    // If we built chains successfully, save them as backup
    if (chains.length > 0) {
      setBackupChains(chains);
    }
    
    return chains.sort((a, b) => b.totalDuration - a.totalDuration);
  }, [localTasks, tasks]);

  // Get independent tasks (tasks with no dependencies and no dependents)
  const independentTasks = useMemo(() => {
    const tasksToUse = localTasks.length > 0 ? localTasks : tasks;
    if (!tasksToUse || tasksToUse.length === 0) return [];
    
    return tasksToUse.filter(task => {
      const hasNoDependency = !task.dependency;
      const hasNoDependents = !tasksToUse.some(t => t.dependency === task.id);
      return hasNoDependency && hasNoDependents;
    });
  }, [localTasks, tasks]);

  // Helper function to check if a task matches current filters (for highlighting)
  const taskMatchesFilter = useCallback((task: Task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority.toString() === filterPriority;
    return statusMatch && priorityMatch;
  }, [filterStatus, filterPriority]);

  // Memoize status icons to prevent recreating them
  const getStatusIcon = useCallback((status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <PlayCircle className="h-4 w-4 text-yellow-600" />;
      case TaskStatus.OVERDUE:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  // Memoize priority colors
  const getPriorityColor = useCallback((priority: number): string => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return "bg-red-600";
      case TaskPriority.URGENT:
        return "bg-red-500";
      case TaskPriority.HIGH:
        return "bg-orange-500";
      case TaskPriority.MEDIUM:
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  }, []);

  // Filter dependency chains - show all chains but highlight filtered tasks
  const filteredDependencyChains = useMemo(() => {
    const chainsToUse = dependencyChains.length > 0 ? dependencyChains : backupChains;
    if (!chainsToUse || chainsToUse.length === 0) return [];
    
    // Always show all active chains, don't filter them out
    return chainsToUse;
  }, [dependencyChains, backupChains]);

  // Filter independent tasks based on selected filters
  const filteredIndependentTasks = useMemo(() => {
    if (!independentTasks || independentTasks.length === 0) return [];
    
    return independentTasks.filter(task => {
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || task.priority.toString() === filterPriority;
      return statusMatch && priorityMatch;
    });
  }, [independentTasks, filterStatus, filterPriority]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dependency visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            Task Dependency Visualization
          </h1>
          <p className="text-muted-foreground">
            Visualize task dependencies, chains, and relationships
            {lastUpdateTime > 0 && (
              <span className="text-xs block mt-1">
                Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={loading || isRefreshing}
          >
            {loading || isRefreshing ? 'Loading...' : 'Refresh Tasks'}
          </button>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={TaskStatus.PENDING}>Not Started</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={TaskStatus.OVERDUE}>Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="1">Low (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">High (3)</SelectItem>
              <SelectItem value="4">Urgent (4)</SelectItem>
              <SelectItem value="5">Critical (5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chains" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Dependency Chains ({filteredDependencyChains.length})
          </TabsTrigger>
          <TabsTrigger value="independent" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Independent Tasks ({filteredIndependentTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dependency Chains Analysis</CardTitle>
              <CardDescription>
                Complete dependency chains showing task sequences from first to last. All tasks in active chains are shown regardless of filters. 
                {filterStatus !== 'all' || filterPriority !== 'all' ? ' Tasks matching your filters are highlighted.' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredDependencyChains.length > 0 ? (
                  filteredDependencyChains.map((chain, index) => {
                    const isEditing = editingChainId === chain.id;
                    const tasksToRender = isEditing ? tempChainTasks : chain.tasks;
                    const editableTasksCount = chain.tasks.filter(t => canMoveTask(t)).length;
                    
                    return (
                      <Card key={chain.id} className="border-l-4" style={{ 
                        borderLeftColor: chain.criticalPath ? '#ef4444' : '#3b82f6' 
                      }}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Chain #{index + 1} ({chain.tasks.length} tasks)
                              {chain.criticalPath && (
                                <Badge variant="destructive" className="ml-2">
                                  Critical Path
                                </Badge>
                              )}
                              {isEditing && (
                                <Badge variant="secondary" className="ml-2">
                                  Editing
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {chain.totalDuration}h total
                                </div>
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-4 w-4" />
                                  {chain.completionPercentage.toFixed(0)}% complete
                                </div>
                              </div>
                              {!isEditing && editableTasksCount > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingChain(chain)}
                                  className="flex items-center gap-1"
                                >
                                  <GripVertical className="h-3 w-3" />
                                  Reorder
                                </Button>
                              )}
                              {isEditing && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={saveChainReordering}
                                    className="flex items-center gap-1"
                                  >
                                    <Save className="h-3 w-3" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    className="flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <Progress value={chain.completionPercentage} className="h-2" />
                          {isEditing && (
                            <div className="text-sm text-blue-600 mt-2">
                              💡 Drag tasks to reorder. Only pending/in-progress tasks can be moved.
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          {isEditing ? (
                            <DndContext 
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext 
                                items={tasksToRender.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {tasksToRender.map((task, taskIndex) => {
                                    const matchesFilter = taskMatchesFilter(task);
                                    const canMove = canMoveTask(task);
                                    return (
                                      <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        index={taskIndex}
                                        isLast={taskIndex === tasksToRender.length - 1}
                                        canMove={canMove}
                                        matchesFilter={matchesFilter}
                                      />
                                    );
                                  })}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="space-y-3">
                              {tasksToRender.map((task, taskIndex) => {
                                const matchesFilter = taskMatchesFilter(task);
                                return (
                                  <TaskItem
                                    key={task.id}
                                    task={task}
                                    taskIndex={taskIndex}
                                    isLast={taskIndex === tasksToRender.length - 1}
                                    matchesFilter={matchesFilter}
                                    getStatusIcon={getStatusIcon}
                                    filterStatus={filterStatus}
                                    filterPriority={filterPriority}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active dependency chains found.</p>
                    <p className="text-sm">Chains will appear here when tasks have dependencies and are not yet completed.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="independent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Independent Tasks</CardTitle>
              <CardDescription>
                Tasks that have no dependencies and no dependents. These can be worked on at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredIndependentTasks.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredIndependentTasks.map((task) => (
                      <Card key={task.id} className="border-l-4" style={{ 
                        borderLeftColor: getPriorityColor(task.priority).replace('bg-', '#').replace('600', '').replace('500', '') + '500'
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {getStatusIcon(task.status)}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-muted-foreground">{task.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-muted-foreground">
                                {task.estimated_duration}h
                              </div>
                              <Badge variant="outline" className="text-xs">
                                P{task.priority}
                              </Badge>
                              <Badge 
                                variant={task.status === TaskStatus.COMPLETED ? 'default' : 
                                        task.status === TaskStatus.IN_PROGRESS ? 'secondary' : 
                                        task.status === TaskStatus.OVERDUE ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            Due: {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No independent tasks found.</p>
                    <p className="text-sm">Independent tasks will appear here when they have no dependencies.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(DependencyVisualization);