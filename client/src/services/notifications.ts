import { apiService, ApiResponse } from './api';
import { API_CONFIG } from '@/config/api';

interface Notification {
  id: string;
  user_id: string;
  task_id: string;
  task_title: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: {
    old_start?: string;
    new_start?: string;
    old_end?: string;
    new_end?: string;
    deadline?: string;
    duration_minutes?: number;
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

class NotificationService {
  // Get all notifications for the current user
  async getNotifications(): Promise<ApiResponse<NotificationsResponse>> {
    return apiService.get<NotificationsResponse>('/api/notifications');
  }

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.put<{ message: string }>(`/api/notifications/${notificationId}/mark-read`, {});
  }

  // Check for new notifications and create them
  async checkAndCreateNotifications(): Promise<ApiResponse<{ message: string; notifications_created: number }>> {
    return apiService.post<{ message: string; notifications_created: number }>('/api/notifications/check-and-create', {});
  }

  // Get unread count
  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return apiService.get<{ unread_count: number }>('/api/notifications/unread-count');
  }
}

export const notificationService = new NotificationService();
export type { Notification, NotificationsResponse };
