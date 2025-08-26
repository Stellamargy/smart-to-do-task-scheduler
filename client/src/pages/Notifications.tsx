import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTasks } from "@/hooks/useTasks";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  X,
  Settings
} from "lucide-react";
import { format, differenceInDays, isAfter } from "date-fns";

interface Notification {
  id: string;
  type: 'deadline' | 'overdue' | 'completed' | 'recommendation';
  title: string;
  message: string;
  timestamp: string;
  taskId?: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function Notifications() {
  const { tasks } = useTasks();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Generate notifications based on current tasks
    const now = new Date();
    const generated: Notification[] = [];

    tasks.forEach(task => {
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = differenceInDays(deadline, now);
        
        // Upcoming deadline notifications
        if (daysUntilDeadline <= 2 && daysUntilDeadline >= 0 && task.status !== 'completed') {
          generated.push({
            id: `deadline-${task.id}`,
            type: 'deadline',
            title: 'Upcoming Deadline',
            message: `"${task.title}" is due ${daysUntilDeadline === 0 ? 'today' : `in ${daysUntilDeadline} day(s)`}`,
            timestamp: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
            taskId: task.id,
            read: Math.random() > 0.7,
            priority: task.priority
          });
        }
        
        // Overdue notifications
        if (daysUntilDeadline < 0 && task.status !== 'completed') {
          generated.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            title: 'Task Overdue',
            message: `"${task.title}" is ${Math.abs(daysUntilDeadline)} day(s) overdue`,
            timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            taskId: task.id,
            read: Math.random() > 0.3,
            priority: 'high'
          });
        }
      }
      
      // Completion notifications
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        if (differenceInDays(now, completedDate) <= 1) {
          generated.push({
            id: `completed-${task.id}`,
            type: 'completed',
            title: 'Task Completed',
            message: `Great job! You completed "${task.title}"`,
            timestamp: task.completedAt,
            taskId: task.id,
            read: Math.random() > 0.5,
            priority: 'low'
          });
        }
      }
    });

    // Add some recommendation notifications
    const blockedTasks = tasks.filter(task => 
      task.dependencies.length > 0 && 
      task.dependencies.some(depId => {
        const dep = tasks.find(t => t.id === depId);
        return dep && dep.status !== 'completed';
      })
    );

    if (blockedTasks.length > 0) {
      generated.push({
        id: 'recommendation-dependencies',
        type: 'recommendation',
        title: 'Focus on Prerequisites',
        message: `You have ${blockedTasks.length} task(s) waiting for dependencies to complete`,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        read: false,
        priority: 'medium'
      });
    }

    const readyTasks = tasks.filter(task => 
      task.status === 'pending' && 
      task.dependencies.every(depId => {
        const dep = tasks.find(t => t.id === depId);
        return dep && dep.status === 'completed';
      })
    );

    if (readyTasks.length > 0) {
      generated.push({
        id: 'recommendation-ready',
        type: 'recommendation',
        title: 'Tasks Ready to Start',
        message: `${readyTasks.length} task(s) are ready to begin - all dependencies completed`,
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        read: false,
        priority: 'medium'
      });
    }

    return generated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  const [settings, setSettings] = useState({
    deadlineReminders: true,
    overdueAlerts: true,
    completionCelebrations: true,
    recommendations: true,
    emailNotifications: false,
    pushNotifications: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="h-4 w-4 text-priority-medium" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'recommendation':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const opacity = read ? '5' : '10';
    switch (type) {
      case 'deadline':
        return `bg-priority-medium/${opacity}`;
      case 'overdue':
        return `bg-destructive/${opacity}`;
      case 'completed':
        return `bg-success/${opacity}`;
      case 'recommendation':
        return `bg-primary/${opacity}`;
      default:
        return `bg-muted/${opacity}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Stay updated on your tasks and deadlines
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`${getNotificationBg(notification.type, notification.read)} ${
                  !notification.read ? 'border-l-4 border-l-primary' : ''
                } cursor-pointer transition-all hover:shadow-md`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(notification.timestamp), 'MMM d, h:mm a')}</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for updates.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notification Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Deadline Reminders</div>
                  <div className="text-xs text-muted-foreground">Get notified before due dates</div>
                </div>
                <Switch
                  checked={settings.deadlineReminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, deadlineReminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Overdue Alerts</div>
                  <div className="text-xs text-muted-foreground">Alert for overdue tasks</div>
                </div>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, overdueAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Completions</div>
                  <div className="text-xs text-muted-foreground">Celebrate task completions</div>
                </div>
                <Switch
                  checked={settings.completionCelebrations}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, completionCelebrations: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Recommendations</div>
                  <div className="text-xs text-muted-foreground">Smart task suggestions</div>
                </div>
                <Switch
                  checked={settings.recommendations}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, recommendations: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Push Notifications</div>
                  <div className="text-xs text-muted-foreground">Browser notifications</div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New notifications</span>
                <span className="font-medium">{notifications.filter(n => !n.read).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue alerts</span>
                <span className="font-medium text-destructive">
                  {notifications.filter(n => n.type === 'overdue').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed today</span>
                <span className="font-medium text-success">
                  {notifications.filter(n => n.type === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}