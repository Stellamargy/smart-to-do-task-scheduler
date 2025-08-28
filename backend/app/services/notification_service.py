from datetime import datetime, timezone, timedelta
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.task import Task, TaskStatus
from app.models import User
from bson import ObjectId
import traceback

class NotificationService:
    """Service for creating and managing notifications using MeTTa logic"""
    
    def __init__(self):
        self.notification_rules = {
            # Time-based notification rules (in minutes)
            'deadline_approaching': 24 * 60,  # 24 hours before deadline
            'task_starting_soon': 30,         # 30 minutes before start time
            'task_ending_soon': 15,           # 15 minutes before end time
        }
    
    def create_task_rescheduled_notification(self, user, task, old_start_time=None, old_end_time=None):
        """Create notification when a task is rescheduled"""
        try:
            if old_start_time and old_end_time and task.start_time and task.end_time:
                old_start = old_start_time.strftime("%Y-%m-%d %H:%M")
                new_start = task.start_time.strftime("%Y-%m-%d %H:%M")
                
                title = f"Task Rescheduled: {task.title}"
                message = f"Your task has been rescheduled from {old_start} to {new_start} based on MeTTa optimization."
                
                return Notification.create_notification(
                    user=user,
                    title=title,
                    message=message,
                    notification_type=NotificationType.TASK_RESCHEDULED,
                    priority=NotificationPriority.MEDIUM,
                    task=task
                )
        except Exception as e:
            print(f"Error creating rescheduled notification: {e}")
            return None
    
    def create_deadline_approaching_notification(self, user, task):
        """Create notification when deadline is approaching"""
        try:
            hours_until_deadline = self._get_hours_until_deadline(task)
            
            title = f"Deadline Approaching: {task.title}"
            if hours_until_deadline <= 1:
                message = f"Your task deadline is in less than 1 hour! Complete it soon."
                priority = NotificationPriority.URGENT
            elif hours_until_deadline <= 6:
                message = f"Your task deadline is in {int(hours_until_deadline)} hours."
                priority = NotificationPriority.HIGH
            else:
                message = f"Your task deadline is approaching in {int(hours_until_deadline)} hours."
                priority = NotificationPriority.MEDIUM
            
            return Notification.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=NotificationType.DEADLINE_APPROACHING,
                priority=priority,
                task=task
            )
        except Exception as e:
            print(f"Error creating deadline approaching notification: {e}")
            return None
    
    def create_task_overdue_notification(self, user, task):
        """Create notification when task becomes overdue"""
        try:
            title = f"Task Overdue: {task.title}"
            message = f"Your task is now overdue. Please complete it as soon as possible to avoid delays in dependent tasks."
            
            return Notification.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=NotificationType.TASK_OVERDUE,
                priority=NotificationPriority.URGENT,
                task=task
            )
        except Exception as e:
            print(f"Error creating overdue notification: {e}")
            return None
    
    def create_task_starting_soon_notification(self, user, task):
        """Create notification when task is about to start"""
        try:
            title = f"Task Starting Soon: {task.title}"
            message = f"Your scheduled task will start in 30 minutes. Get ready!"
            
            return Notification.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=NotificationType.TASK_STARTING_SOON,
                priority=NotificationPriority.HIGH,
                task=task
            )
        except Exception as e:
            print(f"Error creating starting soon notification: {e}")
            return None
    
    def create_task_ending_soon_notification(self, user, task):
        """Create notification when task is about to end"""
        try:
            title = f"Task Ending Soon: {task.title}"
            message = f"Your current task will end in 15 minutes. Prepare to wrap up!"
            
            return Notification.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=NotificationType.TASK_ENDING_SOON,
                priority=NotificationPriority.MEDIUM,
                task=task
            )
        except Exception as e:
            print(f"Error creating ending soon notification: {e}")
            return None
    
    def create_dependency_completed_notification(self, user, completed_task, dependent_tasks):
        """Create notification when a dependency is completed, enabling other tasks"""
        try:
            if not dependent_tasks:
                return None
                
            dependent_titles = [task.title for task in dependent_tasks[:3]]  # Show first 3
            remaining_count = len(dependent_tasks) - 3
            
            title = f"Dependency Completed: {completed_task.title}"
            if len(dependent_tasks) == 1:
                message = f"Great! Completing this task has unlocked '{dependent_titles[0]}' for scheduling."
            else:
                message = f"Great! Completing this task has unlocked {len(dependent_tasks)} tasks: {', '.join(dependent_titles)}"
                if remaining_count > 0:
                    message += f" and {remaining_count} more"
                message += " for scheduling."
            
            return Notification.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=NotificationType.DEPENDENCY_COMPLETED,
                priority=NotificationPriority.MEDIUM,
                task=completed_task
            )
        except Exception as e:
            print(f"Error creating dependency completed notification: {e}")
            return None
    
    def check_and_create_time_based_notifications(self, user_id):
        """
        Check for time-based notifications that need to be created
        This should be called periodically (e.g., every 15 minutes)
        """
        try:
            user = User.objects.get(id=ObjectId(user_id))
            now = datetime.now(timezone.utc)
            
            # Get all active tasks for the user
            tasks = Task.objects(user=user, status__ne=TaskStatus.COMPLETED.value)
            
            notifications_created = []
            
            for task in tasks:
                # Check for deadline approaching
                if task.deadline:
                    hours_until_deadline = self._get_hours_until_deadline(task)
                    if 0 < hours_until_deadline <= 24:
                        # Check if we haven't already sent this notification recently
                        existing_notification = Notification.objects(
                            user=user,
                            task=task,
                            type=NotificationType.DEADLINE_APPROACHING.value,
                            created_at__gte=now - timedelta(hours=12)  # Don't spam
                        ).first()
                        
                        if not existing_notification:
                            notification = self.create_deadline_approaching_notification(user, task)
                            if notification:
                                notifications_created.append(notification)
                
                # Check for overdue tasks
                if task.is_overdue() and task.status != TaskStatus.OVERDUE.value:
                    # Update task status to overdue
                    task.status = TaskStatus.OVERDUE.value
                    task.save()
                    
                    # Check if we haven't already sent this notification
                    existing_notification = Notification.objects(
                        user=user,
                        task=task,
                        type=NotificationType.TASK_OVERDUE.value
                    ).first()
                    
                    if not existing_notification:
                        notification = self.create_task_overdue_notification(user, task)
                        if notification:
                            notifications_created.append(notification)
                
                # Check for scheduled tasks starting soon
                if task.start_time:
                    minutes_until_start = (task.start_time - now).total_seconds() / 60
                    if 0 < minutes_until_start <= 30:
                        existing_notification = Notification.objects(
                            user=user,
                            task=task,
                            type=NotificationType.TASK_STARTING_SOON.value,
                            created_at__gte=now - timedelta(hours=1)
                        ).first()
                        
                        if not existing_notification:
                            notification = self.create_task_starting_soon_notification(user, task)
                            if notification:
                                notifications_created.append(notification)
                
                # Check for tasks ending soon (if in progress)
                if task.end_time and task.status == TaskStatus.IN_PROGRESS.value:
                    minutes_until_end = (task.end_time - now).total_seconds() / 60
                    if 0 < minutes_until_end <= 15:
                        existing_notification = Notification.objects(
                            user=user,
                            task=task,
                            type=NotificationType.TASK_ENDING_SOON.value,
                            created_at__gte=now - timedelta(hours=1)
                        ).first()
                        
                        if not existing_notification:
                            notification = self.create_task_ending_soon_notification(user, task)
                            if notification:
                                notifications_created.append(notification)
            
            return notifications_created
            
        except Exception as e:
            print(f"Error checking time-based notifications: {traceback.format_exc()}")
            return []
    
    def _get_hours_until_deadline(self, task):
        """Calculate hours until task deadline"""
        if not task.deadline:
            return float('inf')
        
        now = datetime.now(timezone.utc)
        deadline = task.deadline
        
        # Handle timezone-naive deadlines
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        
        time_diff = deadline - now
        return time_diff.total_seconds() / 3600
    
    def cleanup_old_notifications(self, user_id, days_old=30):
        """Clean up old read notifications"""
        try:
            user = User.objects.get(id=ObjectId(user_id))
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            old_notifications = Notification.objects(
                user=user,
                is_read=True,
                created_at__lt=cutoff_date
            )
            
            count = old_notifications.count()
            old_notifications.delete()
            
            print(f"Cleaned up {count} old notifications for user {user_id}")
            return count
        except Exception as e:
            print(f"Error cleaning up notifications: {e}")
            return 0
