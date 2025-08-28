import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, AlertTriangle, CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, Notification } from '@/services/notifications';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'deadline_approaching':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'task_overdue':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'task_starting_soon':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'task_in_progress_ending':
      return <Clock className="h-4 w-4 text-purple-500" />;
    case 'task_rescheduled':
      return <ArrowRight className="h-4 w-4 text-indigo-500" />;
    case 'dependency_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const variants = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  
  return (
    <Badge className={variants[priority as keyof typeof variants] || variants.low}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { isAuthenticated } = useAuth();

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      await Promise.all(
        unreadIds.map(id => notificationService.markAsRead(id))
      );
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const checkForNewNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      await notificationService.checkAndCreateNotifications();
      // Refresh notifications after checking
      fetchNotifications();
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    checkForNewNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.is_read
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'h:mm a')}`;
    }
    
    return `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'MMM d, h:mm a')}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-500 text-center">
              {filter === 'unread' 
                ? 'All caught up! Check back later for updates.'
                : 'You\'ll see notifications here when tasks are scheduled, deadlines approach, or dependencies change.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <div key={notification.id}>
                <Card 
                  className={`cursor-pointer transition-colors ${
                    !notification.is_read 
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <NotificationIcon type={notification.type} />
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {notification.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {notification.task_title}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={notification.priority} />
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    
                    {/* Show rescheduling details */}
                    {notification.type === 'task_rescheduled' && notification.metadata.old_start && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <span className="font-medium">Previous:</span>
                          {formatTimeRange(notification.metadata.old_start, notification.metadata.old_end!)}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <span className="font-medium">New:</span>
                          {formatTimeRange(notification.metadata.new_start!, notification.metadata.new_end!)}
                        </div>
                      </div>
                    )}
                    
                    {/* Show deadline details */}
                    {notification.type === 'deadline_approaching' && notification.metadata.deadline && (
                      <div className="bg-orange-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Deadline:</span>
                          {format(new Date(notification.metadata.deadline), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {index < filteredNotifications.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Notifications;
