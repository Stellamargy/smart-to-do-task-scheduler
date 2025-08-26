import { Task } from "@/types/task";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onClick?: (task: Task) => void;
  className?: string;
}

export function TaskCard({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onClick,
  className 
}: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isCompleted;
  
  const handleToggleComplete = () => {
    onToggleComplete?.(task.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `${diffDays} days left`;
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:-translate-y-1",
        "bg-gradient-to-br from-card to-muted/30",
        isCompleted && "opacity-75 bg-gradient-to-br from-success/10 to-success/5",
        isOverdue && "border-destructive/50 bg-gradient-to-br from-destructive/10 to-destructive/5",
        className
      )}
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
              className="mt-1 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-sm leading-tight",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <PriorityBadge priority={task.priority} />
            {isCompleted && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.deadline && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-destructive font-medium"
              )}>
                <Calendar className="w-3 h-3" />
                <span>{formatDeadline(task.deadline)}</span>
              </div>
            )}
            
            {task.dependencies.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.dependencies.length} dependencies</span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
            onClick={handleEdit}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}