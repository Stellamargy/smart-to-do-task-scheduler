import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/TaskCard";
import { useTasks } from "@/hooks/useTasks";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  CheckSquare2,
} from "lucide-react";
import heroImage from "@/assets/hero-banner.jpg";

/**
 * Responsive Stats Card:
 * - Mobile: All cards in a row, icon above value, title below value.
 * - Tablet: Cards in 2x2 grid, icon left, value and title stacked right of icon.
 * - Desktop: Cards in 1x4 row, icon right, title and value left.
 */
export default function Dashboard() {
  const {
    tasks,
    toggleTaskComplete,
    getTaskStats,
    getTodaysTasks,
    getOverdueTasks,
  } = useTasks();
  const stats = getTaskStats();
  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const recentTasks = tasks.slice(0, 5);

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.total,
      icon: CheckSquare2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-priority-medium",
      bgColor: "bg-priority-medium/10",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-priority-high",
      bgColor: "bg-priority-high/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Responsive Stats Cards */}
      <div className="flex flex-row gap-3 sm:gap-4 justify-between sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:flex-none text-xs">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="w-full hover:shadow-md transition-shadow"
          >
            <CardContent
              className="flex flex-col items-center justify-center gap-0 sm:flex-row sm:items-center sm:justify-between sm:gap-0 lg:flex-col lg:items-start lg:justify-center lg:gap-0 p-4 sm:p-6 h-full"
            >
              {/* Mobile: Icon above, Value, Title below. Tablet: Icon left of value/title. Desktop: Icon right of value/title */}
              <div
                className={`
                  flex flex-col items-center gap-1
                  sm:flex-row sm:items-center sm:gap-4
                  lg:flex-col lg:items-start lg:gap-1
                  w-full
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    mb-1
                    sm:mb-0 sm:mr-4
                    lg:mb-1 lg:mr-0 lg:self-end
                    p-2 rounded-full ${stat.bgColor}
                    flex items-center justify-center
                  `}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>

                {/* Value/Title for all breakpoints */}
                <div
                  className={`
                    flex flex-col items-center
                    sm:items-start
                    lg:items-start
                  `}
                >
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {stat.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Tasks
              <Badge variant="secondary">{todaysTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysTasks.length > 0 ? (
              todaysTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No tasks scheduled for today 🎉
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Overdue Tasks
              <Badge variant="destructive">{overdueTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Great! No overdue tasks ✨
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {recentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleTaskComplete}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
