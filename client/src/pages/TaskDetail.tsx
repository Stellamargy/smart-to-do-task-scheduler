import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Flag,
  CheckSquare2,
  Link,
  GitBranch,
  Timer,
  Edit,
  Trash2,
} from "lucide-react";
import { Task, TaskStatus, TaskDetailedView } from "@/types/task";
import { taskService } from "@/services/tasks";
import { useTasks } from "@/hooks/useTasks";

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { updateTask, deleteTask } = useTasks();
  
  const [task, setTask] = useState<TaskDetailedView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId]);

  const fetchTask = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getTask(id);
      if (response.success) {
        setTask(response.data.task as TaskDetailedView);
      } else {
        setError(response.error || "Failed to fetch task");
      }
    } catch (err) {
      setError("Failed to fetch task");
      console.error("Error fetching task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    try {
      await updateTask(task.id, { status: TaskStatus.COMPLETED });
      await fetchTask(task.id); // Refresh task data
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id);
        navigate("/dashboard");
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "bg-red-100 text-red-700 border-red-200";
    if (priority >= 3) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
              <p className="text-muted-foreground">Task Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {task.status !== TaskStatus.COMPLETED && (
              <Button
                onClick={handleCompleteTask}
                className="flex items-center gap-2"
              >
                <CheckSquare2 className="h-4 w-4" />
                Mark Complete
              </Button>
            )}
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Task Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {task.description || "No description provided"}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Priority</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      Priority {task.priority}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Status</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Duration</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      {task.estimated_duration} hours
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Type</h4>
                    <Badge variant="outline">
                      {task.is_independent ? "Independent" : "Has Dependencies"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            {task.is_scheduled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Scheduled Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Start Time</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {task.start_time && new Date(task.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">End Time</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {task.end_time && new Date(task.end_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dependencies */}
            {(task.dependency_details || (task.dependent_tasks && task.dependent_tasks.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Dependencies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.dependency_details && (
                    <div>
                      <h4 className="font-medium mb-2">Depends On</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            <span className="font-medium">{task.dependency_details.title}</span>
                          </div>
                          <Badge className={getStatusColor(task.dependency_details.status)}>
                            {task.dependency_details.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {task.dependent_tasks && task.dependent_tasks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tasks Depending on This</h4>
                      <div className="space-y-2">
                        {task.dependent_tasks.map((depTask) => (
                          <div key={depTask.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                <span className="font-medium">{depTask.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(depTask.priority)}>
                                  P{depTask.priority}
                                </Badge>
                                <Badge className={getStatusColor(depTask.status)}>
                                  {depTask.status.replace("_", " ").toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            {depTask.deadline && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {new Date(depTask.deadline).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deadline</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                    </div>
                    {task.deadline && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.deadline).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <div className="text-sm font-medium">
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <div className="text-sm font-medium">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </div>
                </div>
                
                {task.is_overdue && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Overdue</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Completion Progress */}
            {task.dependent_tasks && task.dependent_tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dependent Tasks Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion</span>
                      <span>{Math.round(task.dependent_completion || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${task.dependent_completion || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {task.dependent_tasks.filter(t => t.status === "completed").length} of{" "}
                      {task.dependent_tasks.length} dependent tasks completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
