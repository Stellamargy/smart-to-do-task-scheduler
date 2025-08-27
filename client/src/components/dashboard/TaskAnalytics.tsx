import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { TaskAnalytics } from "@/types/task";

interface TaskAnalyticsProps {
  analytics: TaskAnalytics | null;
  loading?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = "primary",
  trend
}: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  color?: string;
  trend?: string;
}) => {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 border-primary/20",
    green: "from-green-500/10 to-green-500/5 border-green-500/20",
    red: "from-red-500/10 to-red-500/5 border-red-500/20",
    yellow: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  };

  const iconColorClasses = {
    primary: "text-primary",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    blue: "text-blue-600",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.primary}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const PriorityDistribution = ({ distribution }: { distribution: { [key: number]: number } }) => {
  const priorityLabels = {
    1: "Low",
    2: "Medium", 
    3: "High",
    4: "Urgent",
    5: "Critical"
  };

  const priorityColors = {
    1: "bg-gray-500",
    2: "bg-blue-500",
    3: "bg-yellow-500",
    4: "bg-orange-500",
    5: "bg-red-500"
  };

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Priority Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(distribution).map(([priority, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={priority} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {priorityLabels[parseInt(priority) as keyof typeof priorityLabels]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count} tasks
                  </Badge>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function TaskAnalyticsComponent({ analytics, loading = false }: TaskAnalyticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={analytics.total_tasks}
          icon={Target}
          description="All your tasks"
          color="primary"
        />
        
        <StatCard
          title="Completed"
          value={analytics.completed_tasks}
          icon={CheckCircle2}
          description={`${analytics.completion_rate}% completion rate`}
          color="green"
        />
        
        <StatCard
          title="Pending"
          value={analytics.pending_tasks}
          icon={Clock}
          description="Tasks to be done"
          color="blue"
        />
        
        <StatCard
          title="Overdue"
          value={analytics.overdue_tasks}
          icon={AlertTriangle}
          description="Tasks past deadline"
          color="red"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Independent Tasks"
          value={analytics.independent_tasks}
          icon={Target}
          description="Tasks with no dependencies"
          color="blue"
        />
        
        <StatCard
          title="Dependent Tasks"
          value={analytics.dependent_tasks}
          icon={TrendingUp}
          description="Tasks with dependencies"
          color="yellow"
        />
      </div>

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-muted-foreground">
                {analytics.completed_tasks} of {analytics.total_tasks} tasks
              </span>
            </div>
            <Progress value={analytics.completion_rate} className="h-3" />
            <div className="text-center text-lg font-semibold">
              {analytics.completion_rate}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <PriorityDistribution distribution={analytics.priority_distribution} />
    </div>
  );
}
