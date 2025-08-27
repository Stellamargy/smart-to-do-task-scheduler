import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Download,
  RefreshCw,
} from "lucide-react";

interface QuickActionsProps {
  onCreateTask: () => void;
  onViewAnalytics: () => void;
  onScheduleAll: () => void;
  onRefreshTasks: () => void;
  onExportData?: () => void;
  taskCount?: number;
  loading?: boolean;
}

export default function QuickActions({
  onCreateTask,
  onViewAnalytics,
  onScheduleAll,
  onRefreshTasks,
  onExportData,
  taskCount = 0,
  loading = false,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Actions</span>
          <Badge variant="secondary">{taskCount} tasks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onCreateTask}
          className="w-full justify-start"
          size="lg"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Task
        </Button>

        <Button
          onClick={onScheduleAll}
          variant="outline"
          className="w-full justify-start"
          size="lg"
          disabled={loading}
        >
          <Zap className="h-4 w-4 mr-2" />
          Schedule All Tasks
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onViewAnalytics}
            variant="outline"
            className="justify-start"
            disabled={loading}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          <Button
            onClick={onRefreshTasks}
            variant="outline"
            className="justify-start"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {onExportData && (
          <Button
            onClick={onExportData}
            variant="outline"
            className="w-full justify-start"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Use Ctrl+N to quickly create a new task
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
