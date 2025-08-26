import { Badge } from "@/components/ui/badge";
import { Priority } from "@/types/task";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig = {
  high: {
    label: "High",
    className: "bg-priority-high text-priority-high-foreground border-priority-high/20"
  },
  medium: {
    label: "Medium", 
    className: "bg-priority-medium text-priority-medium-foreground border-priority-medium/20"
  },
  low: {
    label: "Low",
    className: "bg-priority-low text-priority-low-foreground border-priority-low/20"
  }
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}