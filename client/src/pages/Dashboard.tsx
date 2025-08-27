import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckSquare2,
  Calendar,
  Clock,
  ListTodo,
  Brain,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";

// Import dashboard components
import TaskList from "@/components/dashboard/TaskList";

import { Task, TaskUpdateInput, TaskStatus } from "@/types/task";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    tasks,
    scheduledTasksData,
    loading,
    error,
    fetchTasks,
    fetchScheduledTasks,
    updateTask,
    deleteTask,
  } = useTasks();

  // Dialog states
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    // You'll need to implement task editing logic here
    // For now, just log the task
    console.log("Editing task:", task);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    // Mark task as completed via update
    await updateTask(taskId, { status: TaskStatus.COMPLETED });
    // Immediately refresh both regular tasks and scheduled tasks to update UI
    await fetchTasks();
    await fetchScheduledTasks();
  };

  const handleRefreshSchedule = async () => {
    await fetchScheduledTasks();
    // Also refresh regular tasks to get updated scheduling data
    await fetchTasks();
  };

  // Get scheduled tasks from the scheduledTasksData (MeTTa scheduled tasks)
  // ALWAYS filter out completed tasks regardless of source
  const scheduledTasks = scheduledTasksData?.scheduled_tasks?.length > 0 
    ? scheduledTasksData.scheduled_tasks.filter(task => task.status !== TaskStatus.COMPLETED)
    : tasks.filter(task => task.start_time && task.end_time && task.status !== TaskStatus.COMPLETED);
  
  // If we have MeTTa data but no individual task scheduling data, show a message
  const hasMettaDataButNoTaskData = scheduledTasksData?.scheduled_tasks?.length > 0 && 
    tasks.filter(task => task.start_time && task.end_time).length === 0;
  
  // Filter upcoming tasks from all tasks (based on deadline proximity)
  // Exclude tasks that are already in MeTTa scheduled tasks
  const scheduledTaskIds = new Set(scheduledTasks.map(task => task.id));
  const upcomingTasks = tasks.filter((task) => {
    if (!task.deadline) return false;
    if (scheduledTaskIds.has(task.id)) return false; // Exclude already scheduled tasks
    const deadline = new Date(task.deadline);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return (
      deadline <= threeDaysFromNow &&
      deadline >= now &&
      task.status !== TaskStatus.COMPLETED
    );
  });

  // Debug logging to check data
  console.log("Scheduled Tasks Data:", scheduledTasksData);
  console.log("Scheduled Tasks:", scheduledTasks);
  console.log("All Tasks:", tasks);
  console.log("Tasks with scheduling:", tasks.filter(task => task.start_time && task.end_time));

  return (
    <div className="min-h-screen bg-gradient-to-br w-full from-background via-background to-muted/20">
      <div className="w-full p-1 md:p-2 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-md md:text-lg font-bold text-foreground">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm">
              Manage your tasks and schedule efficiently
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshSchedule}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Schedule
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content - Metta Scheduled Tasks and Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metta Scheduled Tasks */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                MeTTa Scheduled Tasks
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {scheduledTasks.length} tasks
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledTasks.length > 0 ? (
                  scheduledTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-background rounded-lg border border-purple-200/50 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link 
                            to={`/task/${task.id}`}
                            className="font-medium text-sm hover:text-purple-600 transition-colors flex items-center gap-1"
                          >
                            {task.title}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </Link>
                          {task.start_time && task.end_time ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="text-purple-600 font-medium">⏰ Scheduled:</span>{" "}
                              {new Date(task.start_time).toLocaleDateString()} -{" "}
                              {new Date(task.start_time).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              to{" "}
                              {new Date(task.end_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Pending scheduling
                            </p>
                          )}
                          {task.priority && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Priority: {task.priority} | Duration: {task.estimated_duration}h
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckSquare2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-3 text-purple-300" />
                    <p>No scheduled tasks yet</p>
                    <p className="text-xs">
                      {tasks.length === 0 
                        ? "No tasks found. Create some tasks first." 
                        : hasMettaDataButNoTaskData
                        ? "Tasks were scheduled! Refreshing data..."
                        : "Tasks will be automatically scheduled using MeTTa logic"}
                    </p>
                    <p className="text-xs mt-2">
                      {tasks.length > 0 && !hasMettaDataButNoTaskData && "Click 'Refresh Schedule' to check for schedulable tasks"}
                    </p>
                    {/* Debug info */}
                    <div className="text-xs mt-4 text-gray-400">
                      <p>Debug: {tasks.length} total tasks</p>
                      <p>Scheduled endpoint data: {scheduledTasksData ? 'Available' : 'None'}</p>
                      <p>MeTTa scheduled count: {scheduledTasksData?.scheduled_tasks?.length || 0}</p>
                      <p>Tasks with timing: {tasks.filter(t => t.start_time && t.end_time).length}</p>
                      {hasMettaDataButNoTaskData && (
                        <p className="text-orange-400">⚠️ Data sync in progress</p>
                      )}
                    </div>
                  </div>
                )}
                {scheduledTasksData?.total_scheduled && scheduledTasksData.total_scheduled > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      + {scheduledTasksData.total_scheduled - 5} more scheduled tasks
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Upcoming Tasks
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {upcomingTasks.length} tasks
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-background rounded-lg border border-blue-200/50 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link 
                            to={`/task/${task.id}`}
                            className="font-medium text-sm hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                            {task.title}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(task.deadline).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(task.deadline).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority >= 4
                                ? "bg-red-100 text-red-700"
                                : task.priority >= 3
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Priority {task.priority}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckSquare2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-blue-300" />
                    <p>No upcoming tasks</p>
                    <p className="text-xs">
                      Tasks due within 3 days will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Tasks Section */}
        <div className="">
          <h1 className="text-lg font-semibold mb-1">All Tasks</h1>
          <TaskList
            tasks={tasks}
            loading={loading}
            onCompleteTask={handleCompleteTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  );
}
