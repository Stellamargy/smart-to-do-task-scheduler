from mongoengine import Document, StringField, DateTimeField, ReferenceField, BooleanField
from datetime import datetime, timezone
import enum

class NotificationType(enum.Enum):
    TASK_RESCHEDULED = "task_rescheduled"
    DEADLINE_APPROACHING = "deadline_approaching"
    TASK_OVERDUE = "task_overdue"
    TASK_STARTING_SOON = "task_starting_soon"
    TASK_IN_PROGRESS = "task_in_progress"
    TASK_ENDING_SOON = "task_ending_soon"
    TASK_COMPLETED = "task_completed"
    DEPENDENCY_COMPLETED = "dependency_completed"

class NotificationPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Notification(Document):
    """Notification model for the task scheduler"""
    title = StringField(required=True, max_length=200)
    message = StringField(required=True, max_length=500)
    type = StringField(choices=[ntype.value for ntype in NotificationType], required=True)
    priority = StringField(choices=[priority.value for priority in NotificationPriority], default=NotificationPriority.MEDIUM.value)
    is_read = BooleanField(default=False)
    task = ReferenceField('Task', required=False)  # Reference to related task
    user = ReferenceField('User', required=True)  # Reference to user who should receive notification
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    read_at = DateTimeField(required=False)
    
    meta = {
        'collection': 'notifications',
        'indexes': ['user', 'created_at', 'is_read', 'type', 'priority'],
        'ordering': ['-created_at']  # Most recent first
    }
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.now(timezone.utc)
            self.save()
    
    def to_dict(self):
        """Convert notification to dictionary representation"""
        return {
            'id': str(self.id),
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'priority': self.priority,
            'is_read': self.is_read,
            'task_id': str(self.task.id) if self.task else None,
            'task_title': self.task.title if self.task else None,
            'user_id': str(self.user.id),
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }
    
    @classmethod
    def create_notification(cls, user, title, message, notification_type, priority=NotificationPriority.MEDIUM, task=None):
        """
        Create a new notification
        
        Args:
            user: User object who should receive the notification
            title: Notification title
            message: Notification message
            notification_type: NotificationType enum value
            priority: NotificationPriority enum value (optional)
            task: Task object related to notification (optional)
        
        Returns:
            Created notification object
        """
        notification = cls(
            title=title,
            message=message,
            type=notification_type.value,
            priority=priority.value,
            user=user,
            task=task
        )
        notification.save()
        return notification
    
    @classmethod
    def get_user_notifications(cls, user, is_read=None, limit=50):
        """
        Get notifications for a user
        
        Args:
            user: User object
            is_read: Boolean to filter by read status (None for all)
            limit: Maximum number of notifications to return
        
        Returns:
            List of notifications
        """
        query = {'user': user}
        if is_read is not None:
            query['is_read'] = is_read
            
        return cls.objects(**query).limit(limit)
    
    @classmethod
    def get_unread_count(cls, user):
        """Get count of unread notifications for a user"""
        return cls.objects(user=user, is_read=False).count()
    
    @classmethod
    def mark_all_as_read(cls, user):
        """Mark all notifications as read for a user"""
        notifications = cls.objects(user=user, is_read=False)
        for notification in notifications:
            notification.mark_as_read()
        return notifications.count()
