import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  MoreVertical,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { formatDistanceToNow, format } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onCompleteTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case TaskPriority.LOW:
      return "bg-gray-100 text-gray-800";
    case TaskPriority.MEDIUM:
      return "bg-blue-100 text-blue-800";
    case TaskPriority.HIGH:
      return "bg-yellow-100 text-yellow-800";
    case TaskPriority.URGENT:
      return "bg-orange-100 text-orange-800";
    case TaskPriority.CRITICAL:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case TaskPriority.LOW:
      return "Low";
    case TaskPriority.MEDIUM:
      return "Medium";
    case TaskPriority.HIGH:
      return "High";
    case TaskPriority.URGENT:
      return "Urgent";
    case TaskPriority.CRITICAL:
      return "Critical";
    default:
      return "Unknown";
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING:
      return "bg-gray-100 text-gray-800";
    case TaskStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800";
    case TaskStatus.COMPLETED:
      return "bg-green-100 text-green-800";
    case TaskStatus.OVERDUE:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const TaskItem = ({ 
  task, 
  onCompleteTask, 
  onEditTask, 
  onDeleteTask, 
}: { 
  task: Task;
  onCompleteTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}) => {
  const deadline = new Date(task.deadline);
  const isOverdue = task.is_overdue;

  return (
    <Card className={`mb-3 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link 
                to={`/task/${task.id}`}
                className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1"
              >
                {task.title}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Link>
              {task.status === TaskStatus.COMPLETED && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {isOverdue && task.status !== TaskStatus.COMPLETED && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimated_duration}h
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(deadline, 'MMM dd, HH:mm')}
              </div>
            </div>
            
            {task.dependency_title && (
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <User className="h-3 w-3 mr-1" />
                Depends on: {task.dependency_title}
              </div>
            )}
            
            {task.start_time && task.end_time && (
              <div className="text-xs text-muted-foreground">
                Scheduled: {format(new Date(task.start_time), 'MMM dd, HH:mm')} - {format(new Date(task.end_time), 'HH:mm')}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {task.status !== TaskStatus.COMPLETED && onCompleteTask && (
              task.can_be_completed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCompleteTask(task.id)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  title="Mark as completed"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0 text-gray-400 cursor-not-allowed"
                  title={`Cannot complete: dependency "${task.dependency_title || 'Unknown'}" must be completed first`}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              )
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditTask && (
                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                    Edit Task
                  </DropdownMenuItem>
                )}
                {onDeleteTask && (
                  <DropdownMenuItem 
                    onClick={() => onDeleteTask(task.id)}
                    className="text-red-600"
                  >
                    Delete Task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TaskList({
  tasks,
  loading = false,
  onCompleteTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8">
        <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-muted-foreground">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onCompleteTask={onCompleteTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}
