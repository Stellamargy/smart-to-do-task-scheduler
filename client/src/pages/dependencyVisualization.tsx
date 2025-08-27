import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

interface DependencyChain {
  id: string;
  tasks: Task[];
  totalDuration: number;
  criticalPath: boolean;
  completionPercentage: number;
}

const DependencyVisualization: React.FC = () => {
  const { tasks, loading, fetchTasks } = useTasks();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'chains' | 'independent'>('chains');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only fetch tasks once when component mounts
  useEffect(() => {
    if (!hasInitialized && !loading && !isRefreshing) {
      setIsRefreshing(true);
      fetchTasks(undefined, true).finally(() => {
        setHasInitialized(true);
        setIsRefreshing(false);
      });
    }
  }, [hasInitialized, loading, isRefreshing, fetchTasks]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    if (!loading && !isRefreshing) {
      setIsRefreshing(true);
      fetchTasks(undefined, true).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [fetchTasks, loading, isRefreshing]);

  // Build dependency chains - find root tasks and follow their chains
  const dependencyChains = useMemo((): DependencyChain[] => {
    if (!tasks || tasks.length === 0) return [];
    
    const chains: DependencyChain[] = [];
    const processedTasks = new Set<string>();

    // Find all tasks that are part of dependency chains (either have dependencies or dependents)
    const tasksInChains = tasks.filter(task => 
      task.dependency || tasks.some(t => t.dependency === task.id)
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
          const dependentTasks = tasks.filter(t => t.dependency === currentTask.id);
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

    return chains.sort((a, b) => b.totalDuration - a.totalDuration);
  }, [tasks]);

  // Get independent tasks (tasks with no dependencies and no dependents)
  const independentTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    return tasks.filter(task => {
      const hasNoDependency = !task.dependency;
      const hasNoDependents = !tasks.some(t => t.dependency === task.id);
      return hasNoDependency && hasNoDependents;
    });
  }, [tasks]);

  const getStatusIcon = (status: TaskStatus) => {
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
  };

  const getPriorityColor = (priority: number): string => {
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
  };

  // Filter dependency chains - show all chains but highlight filtered tasks
  const filteredDependencyChains = useMemo(() => {
    if (!dependencyChains || dependencyChains.length === 0) return [];
    
    // Always show all active chains, don't filter them out
    return dependencyChains;
  }, [dependencyChains]);

  // Filter independent tasks based on selected filters
  const filteredIndependentTasks = useMemo(() => {
    if (!independentTasks || independentTasks.length === 0) return [];
    
    return independentTasks.filter(task => {
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || task.priority.toString() === filterPriority;
      return statusMatch && priorityMatch;
    });
  }, [independentTasks, filterStatus, filterPriority]);

  // Helper function to check if a task matches current filters (for highlighting)
  const taskMatchesFilter = useCallback((task: Task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority.toString() === filterPriority;
    return statusMatch && priorityMatch;
  }, [filterStatus, filterPriority]);

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
                Complete dependency chains showing task sequences from first to last. Each chain shows tasks that must be completed in order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredDependencyChains.length > 0 ? (
                  filteredDependencyChains.map((chain, index) => (
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
                          </CardTitle>
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
                        </div>
                        <Progress value={chain.completionPercentage} className="h-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {chain.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex items-center gap-3">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 flex-1">
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
                              {taskIndex < chain.tasks.length - 1 && (
                                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No dependency chains found.</p>
                    <p className="text-sm">Chains will appear here once task dependencies are created.</p>
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

export default DependencyVisualization;