from datetime import datetime, timedelta, timezone
from typing import List, Dict, Tuple, Optional
import os
import pytz
import threading
import time
from app.models.task import Task
from app.services.notification_service import NotificationService
from bson import ObjectId

# Global lock to prevent concurrent scheduling operations
_scheduling_lock = threading.Lock()
_user_scheduling_locks = {}  # Per-user locks

class TaskScheduler:
    """
    Smart task scheduler that uses MeTTa for knowledge representation
    and scheduling algorithms
    """
    
    def __init__(self, deadline_weight: float = 0.6, priority_weight: float = 0.4, current_time: datetime = None, user_timezone: str = None):
        """
        Initialize scheduler with weighting preferences, current time, and user timezone
        All time operations will be performed in the user's local timezone
        
        Args:
            deadline_weight: Weight for deadline priority (0.0-1.0)
            priority_weight: Weight for task priority (0.0-1.0)
            current_time: Current time from frontend (timezone-aware)
            user_timezone: User's timezone (e.g., "Africa/Nairobi")
        """
        self.deadline_weight = deadline_weight
        self.priority_weight = priority_weight
        self.user_timezone = user_timezone
        
        # Set up timezone object - this is our PRIMARY working timezone
        if not user_timezone:
            print("⚠️ WARNING: No user timezone provided. Automatic scheduling may use incorrect local time.")
            print("Please provide user_timezone parameter for accurate scheduling.")
            # Use a system default but warn about it
            self.user_tz = pytz.timezone('UTC')
            self.user_timezone = 'UTC'
        else:
            try:
                self.user_tz = pytz.timezone(self.user_timezone)
                print(f"🌍 Scheduler working in timezone: {self.user_timezone}")
            except pytz.exceptions.UnknownTimeZoneError:
                raise ValueError(f"⚠️ Unknown timezone {self.user_timezone}. Please provide a valid timezone.")
        
        # Set current time in user's timezone - NO CONVERSIONS
        if current_time:
            if current_time.tzinfo is None:
                # Assume frontend time is already in user's timezone
                self.current_time = self.user_tz.localize(current_time)
            else:
                # Convert to user timezone once and work there
                self.current_time = current_time.astimezone(self.user_tz)
        else:
            # Default to user's current time
            self.current_time = datetime.now(self.user_tz)
            
        print(f"🕐 Scheduler current time: {self.current_time} ({self.user_timezone})")
            
        self._scheduling_in_progress = False  # Prevent recursive scheduling
        self.metta_file_path = os.path.join(os.path.dirname(__file__), '..', 'metta', 'scheduler.metta')
    
    def calculate_urgency_score(self, task: Task) -> float:
        """
        Calculate urgency score for a task based on deadline and priority
        
        Args:
            task: Task object
            
        Returns:
            Float urgency score (higher = more urgent)
        """
        now = self.current_time
        # Handle both timezone-aware and timezone-naive deadlines
        deadline = task.deadline
        if deadline.tzinfo is None:
            # Treat naive datetime as already in user's timezone
            deadline = self.user_tz.localize(deadline)
        else:
            # Convert to user's timezone if different
            deadline = deadline.astimezone(self.user_tz)
        
        time_until_deadline = (deadline - now).total_seconds() / 3600  # Hours
        
        # Deadline urgency (inverted - closer deadline = higher urgency)
        if time_until_deadline <= 0:
            deadline_urgency = 100  # Maximum urgency for overdue tasks
        else:
            deadline_urgency = 1 / (1 + time_until_deadline / 24)  # Normalized by days
        
        # Priority urgency (1-5 scale, normalized to 0-1)
        priority_urgency = task.priority / 5.0
        
        # Combined urgency score
        urgency_score = (deadline_urgency * self.deadline_weight + 
                        priority_urgency * self.priority_weight)
        
        return urgency_score
    
    def convert_db_time_to_user_timezone(self, db_time: datetime) -> datetime:
        """
        Convert database time to user's local timezone
        MongoEngine stores all datetimes in UTC, so we need to convert back
        
        Args:
            db_time: Time from database (should be in UTC)
            
        Returns:
            Datetime in user's timezone
        """
        if db_time.tzinfo is None:
            # Database stored as naive datetime - treat as UTC (MongoEngine default)
            user_local_time = pytz.UTC.localize(db_time).astimezone(self.user_tz)
        else:
            # Convert whatever timezone to user's timezone
            user_local_time = db_time.astimezone(self.user_tz)
        
        return user_local_time
    
    def get_schedulable_tasks(self, user_id: str) -> List[Task]:
        """
        Get all tasks that can be scheduled for a user.
        
        A task is schedulable if:
        1. It's not completed
        2. It has no dependency (independent task), OR
        3. Its immediate dependency is completed
        
        Args:
            user_id: User ID
            
        Returns:
            List of schedulable tasks
        """
        # First, get all non-completed tasks (only pending and in_progress)
        user_tasks = Task.objects(user=ObjectId(user_id), status__in=['pending', 'in_progress'])
        print(f"📋 Found {len(user_tasks)} non-completed tasks for user {user_id}")
        print(f"📊 Task statuses: {[task.status for task in user_tasks]}")
        
        # Additional safety check to ensure no completed tasks slip through
        user_tasks = [task for task in user_tasks if task.status in ['pending', 'in_progress']]
        print(f"🔒 After safety filter: {len(user_tasks)} schedulable tasks")
        
        schedulable = []
        blocked_by_dependencies = []
        
        for task in user_tasks:
            # Use the corrected immediate dependency logic
            if task.can_be_scheduled():
                schedulable.append(task)
            else:
                blocked_by_dependencies.append(task)
        
        print(f"✅ Schedulable tasks: {len(schedulable)} (independent or with completed dependencies)")
        print(f"🔒 Blocked tasks: {len(blocked_by_dependencies)} (waiting for dependencies to complete)")
        
        if blocked_by_dependencies:
            for blocked_task in blocked_by_dependencies:
                dep_status = blocked_task.dependency.status if blocked_task.dependency else "None"
                print(f"   🔒 '{blocked_task.title}' blocked by dependency (status: {dep_status})")
        
        return schedulable
    
    def sort_tasks_by_urgency(self, tasks: List[Task]) -> List[Task]:
        """
        Sort tasks by urgency score (highest first)
        
        Args:
            tasks: List of tasks to sort
            
        Returns:
            Sorted list of tasks
        """
        return sorted(tasks, key=self.calculate_urgency_score, reverse=True)
    
    def find_optimal_start_time_with_metta(self, task: Task, user_tasks: List[Task]) -> datetime:
        """
        Find optimal start time for a task using MeTTa logic and avoiding conflicts
        
        MeTTa Optimal Scheduling Logic:
        1. Calculate urgency-based priority slot
        2. Find gaps in existing schedule
        3. Balance deadline pressure with priority
        4. Optimize for minimal context switching
        
        Args:
            task: Task to schedule
            user_tasks: All user's scheduled tasks
            
        Returns:
            Optimal start time based on MeTTa logic
        """
        now = self.current_time
        
        # MeTTa Logic 1: Calculate urgency-based time preference
        urgency_score = self.calculate_urgency_score(task)
        
        # MeTTa Logic 2: Prefer working hours (9 AM - 6 PM) for high urgency tasks
        if urgency_score > 0.7:  # High urgency
            preferred_start_hour = 9  # Start early for urgent tasks
        elif urgency_score > 0.4:  # Medium urgency  
            preferred_start_hour = 10  # Standard start time
        else:  # Low urgency
            preferred_start_hour = 14  # Afternoon for low priority
        
        # Get all scheduled time slots for conflict detection
        scheduled_slots = []
        for existing_task in user_tasks:
            if existing_task.start_time and existing_task.end_time and existing_task.id != task.id:
                # Convert UTC times from database to user's local timezone
                start_time = existing_task.start_time
                end_time = existing_task.end_time
                
                # Convert from UTC (database storage) to user's local timezone
                if start_time.tzinfo is None:
                    # Treat naive datetime as UTC (MongoEngine default)
                    start_time = pytz.UTC.localize(start_time).astimezone(self.user_tz)
                else:
                    start_time = start_time.astimezone(self.user_tz)
                    
                if end_time.tzinfo is None:
                    # Treat naive datetime as UTC (MongoEngine default)
                    end_time = pytz.UTC.localize(end_time).astimezone(self.user_tz)
                else:
                    end_time = end_time.astimezone(self.user_tz)
                
                scheduled_slots.append((start_time, end_time))
                print(f"🔍 Collision check: Found existing task '{existing_task.title}' at {start_time} to {end_time} ({self.user_timezone})")
        
        
        # Sort slots by start time for gap analysis
        scheduled_slots.sort(key=lambda x: x[0])
        
        # Start with preferred time based on urgency
        task_duration = timedelta(hours=task.estimated_duration)
        
        # Start with preferred time based on urgency, but never in the past
        today = now.replace(hour=preferred_start_hour, minute=0, second=0, microsecond=0)
        if today < now:
            today += timedelta(days=1)  # Move to next day if time has passed
            
        # Always start from current time or later, never in the past
        current_time = max(now, today)
        
        # MeTTa Logic 4: Advanced collision detection and gap optimization
        max_attempts = 50  # Prevent infinite loops
        attempt = 0
        
        while attempt < max_attempts:
            attempt += 1
            # Check if the proposed time slot has any conflicts
            proposed_end_time = current_time + task_duration
            has_conflict = False
            conflict_end_time = None
            
            # Check all scheduled slots for conflicts
            for start_time, end_time in scheduled_slots:
                # Check for time overlap
                if self.times_overlap(current_time, proposed_end_time, start_time, end_time):
                    has_conflict = True
                    # Find the latest conflict end time to move past all conflicts
                    if conflict_end_time is None or end_time > conflict_end_time:
                        conflict_end_time = end_time
            
            if not has_conflict:
                # Found a slot without conflicts - ensure it's not in the past
                if current_time >= now:
                    break
                else:
                    # If somehow we got a time in the past, move to current time
                    current_time = now
                    continue
            else:
                # Move current_time to after the latest conflicting slot
                current_time = max(conflict_end_time, now)  # Ensure never in the past
                print(f"🔄 Conflict detected for '{task.title}', moving to {current_time}")
                
            # Safety check to prevent scheduling too far in the future
            if current_time > now + timedelta(days=7):
                print(f"⚠️ Warning: Could not find slot within 7 days for task {task.title}")
                break
        
        # MeTTa Logic 5: Consider urgency for final placement
        if urgency_score > 0.8:  # Critical urgency
            # For critical tasks, try to fit them as early as possible
            early_time = max(now, now.replace(hour=9, minute=0, second=0, microsecond=0))
            if not self.has_conflicts_with_existing(early_time, early_time + task_duration, scheduled_slots):
                current_time = early_time

        # Final safety check: Never schedule in the past
        if current_time < now:
            print(f"⚠️ Warning: Correcting past scheduling time for '{task.title}' from {current_time} to {now}")
            current_time = now

        return current_time

    def times_overlap(self, start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        """
        Check if two time periods overlap
        
        Args:
            start1, end1: First time period
            start2, end2: Second time period
            
        Returns:
            True if periods overlap, False otherwise
        """
        return start1 < end2 and start2 < end1

    def has_conflicts_with_existing(self, start_time: datetime, end_time: datetime, scheduled_slots: List) -> bool:
        """
        Check if a proposed time slot conflicts with existing scheduled slots
        
        Args:
            start_time: Proposed start time
            end_time: Proposed end time
            scheduled_slots: List of existing (start, end) tuples
            
        Returns:
            True if conflicts exist, False otherwise
        """
        for existing_start, existing_end in scheduled_slots:
            if self.times_overlap(start_time, end_time, existing_start, existing_end):
                return True
        return False
    
    def schedule_task(self, task: Task) -> Tuple[datetime, datetime]:
        """
        Schedule a single task using MeTTa optimal time calculation
        
        Args:
            task: Task to schedule
            
        Returns:
            Tuple of (start_time, end_time)
        """
        # Get all user's tasks for conflict detection
        user_tasks = list(Task.objects(user=task.user))
        
        # Use MeTTa logic to find optimal start time
        start_time = self.find_optimal_start_time_with_metta(task, user_tasks)
        end_time = start_time + timedelta(hours=task.estimated_duration)
        
        # Ensure all datetimes are timezone-aware for comparison
        deadline = task.deadline
        if deadline.tzinfo is None:
            # Treat naive datetime as already in user's timezone
            deadline = self.user_tz.localize(deadline)
        else:
            # Convert to user's timezone if different
            deadline = deadline.astimezone(self.user_tz)
            
        if start_time.tzinfo is None:
            start_time = self.user_tz.localize(start_time)
        else:
            start_time = start_time.astimezone(self.user_tz)
            
        if end_time.tzinfo is None:
            end_time = self.user_tz.localize(end_time)
        else:
            end_time = end_time.astimezone(self.user_tz)
            
        if end_time > deadline:
            # Use MeTTa urgency recalculation to adjust timing
            adjusted_start, adjusted_end = self.metta_deadline_adjustment(task, start_time, deadline)
            start_time, end_time = adjusted_start, adjusted_end
        
        return start_time, end_time
    
    def metta_deadline_adjustment(self, task: Task, proposed_start: datetime, deadline: datetime) -> Tuple[datetime, datetime]:
        """
        MeTTa logic for deadline-based time adjustment
        
        Args:
            task: Task to adjust
            proposed_start: Originally proposed start time
            deadline: Task deadline
            
        Returns:
            Tuple of (adjusted_start_time, adjusted_end_time)
        """
        # Ensure all datetimes are timezone-aware for comparison
        if proposed_start.tzinfo is None:
            proposed_start = self.user_tz.localize(proposed_start)
        else:
            proposed_start = proposed_start.astimezone(self.user_tz)
            
        if deadline.tzinfo is None:
            deadline = self.user_tz.localize(deadline)
        else:
            deadline = deadline.astimezone(self.user_tz)
            
        task_duration = timedelta(hours=task.estimated_duration)
        proposed_end = proposed_start + task_duration
        
        # MeTTa deadline logic: If task exceeds deadline, apply urgency-based adjustments
        if proposed_end > deadline:
            # Try to schedule earlier if possible
            latest_start = deadline - task_duration
            now = self.current_time
            
            if latest_start > now:
                # Can meet deadline by starting earlier
                return latest_start, deadline
            else:
                # Cannot meet deadline - apply MeTTa priority rules
                urgency_score = self.calculate_urgency_score(task)
                
                if urgency_score > 0.8:  # Critical - compress working hours
                    # For critical tasks, consider extending work day slightly
                    extended_start = now
                    extended_end = extended_start + task_duration
                    return extended_start, extended_end
                else:
                    # For non-critical, accept deadline miss but optimize start time
                    optimal_start = max(now, proposed_start)
                    return optimal_start, optimal_start + task_duration
        
        return proposed_start, proposed_end

    def save_task_schedule_to_db(self, task: Task, start_time: datetime, end_time: datetime) -> bool:
        """
        Save task schedule to database in user's local timezone
        ALL TIMES ARE KEPT IN USER'S TIMEZONE - NO CONVERSIONS
        
        Args:
            task: Task to update
            start_time: Scheduled start time (in user's timezone)
            end_time: Scheduled end time (in user's timezone)
            
        Returns:
            True if successfully saved, False otherwise
        """
        try:
            # Ensure times are in user's timezone (no conversion, just validation)
            if start_time.tzinfo is None:
                start_time = self.user_tz.localize(start_time)
            if end_time.tzinfo is None:
                end_time = self.user_tz.localize(end_time)
            
            # Capture original times for notification comparison
            original_start = task.start_time
            original_end = task.end_time
            
            # Set the scheduling flag to prevent recursive scheduling
            task._scheduling_in_progress = True
            
            # For status comparison, work entirely in user's timezone
            deadline = task.deadline
            if deadline.tzinfo is None:
                deadline = self.user_tz.localize(deadline)
            elif deadline.tzinfo != self.user_tz:
                deadline = deadline.astimezone(self.user_tz)
            
            status = 'overdue' if end_time > deadline else task.status
            
            # Save to database using UTC times (MongoEngine requirement)
            # Convert user's local times to UTC for database storage
            start_time_utc = start_time.astimezone(pytz.UTC) if start_time.tzinfo else pytz.UTC.localize(start_time)
            end_time_utc = end_time.astimezone(pytz.UTC) if end_time.tzinfo else pytz.UTC.localize(end_time)
            updated_at_utc = datetime.now(pytz.UTC)
            
            print(f"💾 Saving task in {self.user_timezone}: {start_time} to {end_time}")
            print(f"💾 Converting to UTC for DB: {start_time_utc} to {end_time_utc}")
            
            Task.objects(id=task.id).update(
                start_time=start_time_utc,     # Store in UTC as MongoEngine expects
                end_time=end_time_utc,         # Store in UTC as MongoEngine expects
                updated_at=updated_at_utc,     # Store in UTC as MongoEngine expects
                status=status
            )
            
            # Create notification if task was rescheduled
            try:
                if original_start and original_end:
                    # Convert original times from UTC (database) to user's timezone for comparison
                    original_start_local = self.convert_db_time_to_user_timezone(original_start)
                    original_end_local = self.convert_db_time_to_user_timezone(original_end)
                    
                    # Check if times actually changed (more than 1 minute difference to avoid noise)
                    start_changed = abs((start_time - original_start_local).total_seconds()) > 60
                    end_changed = abs((end_time - original_end_local).total_seconds()) > 60
                    
                    if start_changed or end_changed:
                        notification_service = NotificationService()
                        notification_service.create_task_rescheduled_notification(
                            task_id=str(task.id),
                            user_id=str(task.user_id),
                            old_start=original_start_local,
                            new_start=start_time,
                            old_end=original_end_local,
                            new_end=end_time
                        )
                        print(f"📝 Created rescheduling notification for task '{task.title}'")
            except Exception as e:
                print(f"⚠️ Error creating rescheduling notification: {e}")
                # Don't fail the scheduling if notification fails
            
            print(f"✅ Successfully saved schedule for '{task.title}' in {self.user_timezone}: {start_time} to {end_time}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving schedule for task '{task.title}': {e}")
            return False
        finally:
            # Always clear the scheduling flag
            if hasattr(task, '_scheduling_in_progress'):
                delattr(task, '_scheduling_in_progress')
    
    def schedule_all_user_tasks(self, user_id: str) -> Dict[str, Dict]:
        """
        Schedule all tasks for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with scheduling results
        """
        schedulable_tasks = self.get_schedulable_tasks(user_id)
        sorted_tasks = self.sort_tasks_by_urgency(schedulable_tasks)
        
        scheduled = []
        conflicts = []
        overdue = []
        
        for task in sorted_tasks:
            try:
                start_time, end_time = self.schedule_task(task)
                
                # Use the new MeTTa-aware database save method
                if self.save_task_schedule_to_db(task, start_time, end_time):
                    # Check if task will be overdue
                    if end_time > task.deadline:
                        task.status = 'overdue'
                        overdue.append(task.to_dict())
                    else:
                        scheduled.append(task.to_dict())
                else:
                    # If saving failed, add to conflicts
                    conflicts.append({
                        'task': task.to_dict(),
                        'error': 'Failed to save schedule to database'
                    })
                
                print(f"✅ MeTTa scheduled task: {task.title} from {start_time} to {end_time}")
                
            except Exception as e:
                print(f"❌ Error scheduling task {task.title}: {e}")
                conflicts.append({
                    'task': task.to_dict(),
                    'error': str(e)
                })
        
        return {
            'scheduled': scheduled,
            'conflicts': conflicts,
            'overdue': overdue,
            'total_scheduled': len(scheduled),
            'total_conflicts': len(conflicts),
            'total_overdue': len(overdue)
        }
    
    def schedule_all_user_tasks_sequential(self, user_id: str) -> Dict[str, Dict]:
        """
        Schedule all tasks for a user with proper sequential collision detection
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with scheduling results
        """
        schedulable_tasks = self.get_schedulable_tasks(user_id)
        sorted_tasks = self.sort_tasks_by_urgency(schedulable_tasks)
        
        scheduled = []
        conflicts = []
        overdue = []
        
        # Group tasks by similar deadlines for proportional allocation
        deadline_groups = self.group_tasks_by_deadline_proximity(sorted_tasks)
        
        for deadline_group in deadline_groups:
            # Check if proportional allocation is needed for this group
            if self.needs_proportional_allocation(deadline_group):
                print(f"📊 Applying proportional time allocation for {len(deadline_group)} tasks with tight deadline")
                allocated_tasks = self.allocate_time_proportionally(deadline_group)
                
                # Schedule each proportionally allocated task
                for task_info in allocated_tasks:
                    task = task_info['task']
                    allocated_duration = task_info['allocated_duration']
                    start_time = task_info['start_time']
                    end_time = task_info['end_time']
                    
                    if self.save_task_schedule_to_db(task, start_time, end_time):
                        # Check if task will be overdue
                        deadline = task.deadline
                        if deadline.tzinfo is None:
                            deadline = self.user_tz.localize(deadline)
                        else:
                            deadline = deadline.astimezone(self.user_tz)
                            
                        if end_time.tzinfo is None:
                            end_time = self.user_tz.localize(end_time)
                        else:
                            end_time = end_time.astimezone(self.user_tz)
                            
                        task_info_dict = task.to_dict()
                        task_info_dict['allocated_duration'] = allocated_duration
                        task_info_dict['original_duration'] = task.estimated_duration
                        
                        if end_time > deadline:
                            task.status = 'overdue'
                            overdue.append(task_info_dict)
                        else:
                            scheduled.append(task_info_dict)
                    else:
                        conflicts.append({
                            'task': task.to_dict(),
                            'error': 'Failed to save proportionally allocated schedule to database'
                        })
                    
                    print(f"✅ Proportionally allocated: {task.title} - {allocated_duration:.1f}h/{task.estimated_duration}h from {start_time} to {end_time}")
            else:
                # Use standard sequential scheduling for this group
                for i, task in enumerate(deadline_group):
                    try:
                        # Get currently scheduled tasks from database (including ones we just scheduled)
                        current_user_tasks = list(Task.objects(
                            user=ObjectId(user_id), 
                            start_time__exists=True, 
                            end_time__exists=True,
                            start_time__ne=None,
                            end_time__ne=None
                        ))
                        
                        start_time, end_time = self.schedule_task_with_live_collision_check(task, current_user_tasks)
                        
                        # Use the new MeTTa-aware database save method
                        if self.save_task_schedule_to_db(task, start_time, end_time):
                            # Check if task will be overdue
                            deadline = task.deadline
                            if deadline.tzinfo is None:
                                deadline = self.user_tz.localize(deadline)
                            else:
                                deadline = deadline.astimezone(self.user_tz)
                                
                            if end_time.tzinfo is None:
                                end_time = self.user_tz.localize(end_time)
                            else:
                                end_time = end_time.astimezone(self.user_tz)
                                
                            if end_time > deadline:
                                task.status = 'overdue'
                                overdue.append(task.to_dict())
                            else:
                                scheduled.append(task.to_dict())
                        else:
                            # If saving failed, add to conflicts
                            conflicts.append({
                                'task': task.to_dict(),
                                'error': 'Failed to save schedule to database'
                            })
                        
                        print(f"✅ Standard scheduled: {task.title} from {start_time} to {end_time}")
                        
                    except Exception as e:
                        print(f"❌ Error scheduling task {task.title}: {e}")
                        conflicts.append({
                            'task': task.to_dict(),
                            'error': str(e)
                        })
        
        return {
            'scheduled': scheduled,
            'conflicts': conflicts,
            'overdue': overdue,
            'total_scheduled': len(scheduled),
            'total_conflicts': len(conflicts),
            'total_overdue': len(overdue)
        }

    def schedule_task_with_live_collision_check(self, task: Task, current_user_tasks: List[Task]) -> Tuple[datetime, datetime]:
        """
        Schedule a single task with real-time collision checking against currently scheduled tasks
        Preserves exact MeTTa-calculated times without timezone conversion
        
        Args:
            task: Task to schedule
            current_user_tasks: Currently scheduled tasks from database
            
        Returns:
            Tuple of (start_time, end_time) with exact MeTTa-calculated times
        """
        # Use MeTTa logic to find optimal start time with current collision data
        metta_start_time = self.find_optimal_start_time_with_metta(task, current_user_tasks)
        metta_end_time = metta_start_time + timedelta(hours=task.estimated_duration)
        
        # For deadline comparison only (not for saving), ensure timezone compatibility
        deadline = task.deadline
        comparison_deadline = deadline
        comparison_start = metta_start_time
        comparison_end = metta_end_time
        
        if comparison_deadline.tzinfo is None:
            comparison_deadline = self.user_tz.localize(comparison_deadline)
        else:
            comparison_deadline = comparison_deadline.astimezone(self.user_tz)
            
        if comparison_start.tzinfo is None:
            comparison_start = self.user_tz.localize(comparison_start)
        else:
            comparison_start = comparison_start.astimezone(self.user_tz)
            
        if comparison_end.tzinfo is None:
            comparison_end = self.user_tz.localize(comparison_end)
        else:
            comparison_end = comparison_end.astimezone(self.user_tz)
            
        # Use MeTTa urgency recalculation to adjust timing if needed
        if comparison_end > comparison_deadline:
            print(f"⚠️ MeTTa adjustment needed: Task '{task.title}' end time {comparison_end} exceeds deadline {comparison_deadline}")
            adjusted_start, adjusted_end = self.metta_deadline_adjustment(task, metta_start_time, deadline)
            return adjusted_start, adjusted_end
        
        # Return the EXACT MeTTa-calculated times without any conversion
        print(f"✅ MeTTa time preserved: Task '{task.title}' scheduled {metta_start_time} to {metta_end_time}")
        return metta_start_time, metta_end_time
    
    def group_tasks_by_deadline_proximity(self, tasks: List[Task]) -> List[List[Task]]:
        """
        Group tasks by deadline proximity for proportional allocation
        
        Args:
            tasks: List of tasks to group
            
        Returns:
            List of task groups, each group has similar deadlines
        """
        if not tasks:
            return []
        
        # Sort tasks by deadline
        sorted_tasks = sorted(tasks, key=lambda t: t.deadline)
        groups = []
        current_group = [sorted_tasks[0]]
        
        for i in range(1, len(sorted_tasks)):
            current_task = sorted_tasks[i]
            previous_task = sorted_tasks[i-1]
            
            # Group tasks if their deadlines are within 2 hours of each other
            deadline_diff = abs((current_task.deadline - previous_task.deadline).total_seconds() / 3600)
            
            if deadline_diff <= 2:  # Within 2 hours
                current_group.append(current_task)
            else:
                groups.append(current_group)
                current_group = [current_task]
        
        groups.append(current_group)
        return groups
    
    def needs_proportional_allocation(self, tasks: List[Task]) -> bool:
        """
        Check if a group of tasks needs proportional time allocation
        
        Args:
            tasks: List of tasks with similar deadlines
            
        Returns:
            True if proportional allocation is needed
        """
        if len(tasks) <= 1:
            return False
        
        # Find the earliest deadline in the group
        earliest_deadline = min(task.deadline for task in tasks)
        
        # Handle timezone-aware comparison
        if earliest_deadline.tzinfo is None:
            earliest_deadline = self.user_tz.localize(earliest_deadline)
        else:
            earliest_deadline = earliest_deadline.astimezone(self.user_tz)
        
        # Calculate available time until deadline
        available_time = (earliest_deadline - self.current_time).total_seconds() / 3600  # Hours
        
        # Calculate total required time
        total_required_time = sum(task.estimated_duration for task in tasks)
        
        # Need proportional allocation if total required time exceeds available time
        needs_allocation = total_required_time > available_time and available_time > 0
        
        if needs_allocation:
            print(f"📊 Proportional allocation needed: {total_required_time:.1f}h required, {available_time:.1f}h available")
        
        return needs_allocation
    
    def allocate_time_proportionally(self, tasks: List[Task]) -> List[Dict]:
        """
        Allocate time proportionally among tasks competing for the same deadline
        
        Args:
            tasks: List of tasks with similar deadlines
            
        Returns:
            List of task allocation info with start_time, end_time, and allocated_duration
        """
        if not tasks:
            return []
        
        # Find the earliest deadline in the group
        earliest_deadline = min(task.deadline for task in tasks)
        if earliest_deadline.tzinfo is None:
            earliest_deadline = self.user_tz.localize(earliest_deadline)
        else:
            earliest_deadline = earliest_deadline.astimezone(self.user_tz)
        
        # Calculate available time until deadline
        available_time = (earliest_deadline - self.current_time).total_seconds() / 3600  # Hours
        
        if available_time <= 0:
            print(f"⚠️ No time available before deadline: {earliest_deadline}")
            return []
        
        # Calculate total required time
        total_required_time = sum(task.estimated_duration for task in tasks)
        
        # Sort tasks by urgency for scheduling order
        sorted_tasks = sorted(tasks, key=self.calculate_urgency_score, reverse=True)
        
        allocated_tasks = []
        current_start_time = self.current_time
        
        for task in sorted_tasks:
            # Calculate proportional allocation
            # allocated_time = (task_duration / total_required_duration) * available_time
            proportional_factor = task.estimated_duration / total_required_time
            allocated_duration = proportional_factor * available_time
            
            # Ensure minimum allocation of 15 minutes
            allocated_duration = max(allocated_duration, 0.25)  # 15 minutes minimum
            
            # Calculate end time
            end_time = current_start_time + timedelta(hours=allocated_duration)
            
            allocated_tasks.append({
                'task': task,
                'start_time': current_start_time,
                'end_time': end_time,
                'allocated_duration': allocated_duration,
                'proportional_factor': proportional_factor
            })
            
            print(f"📊 Proportional allocation: {task.title} gets {allocated_duration:.1f}h/{task.estimated_duration}h ({proportional_factor*100:.1f}%)")
            
            # Move start time for next task
            current_start_time = end_time
        
        return allocated_tasks
    
    def _get_user_lock(self, user_id: str) -> threading.Lock:
        """
        Get or create a lock for a specific user to prevent concurrent scheduling
        
        Args:
            user_id: User ID
            
        Returns:
            Threading lock for the user
        """
        global _user_scheduling_locks
        
        with _scheduling_lock:
            if user_id not in _user_scheduling_locks:
                _user_scheduling_locks[user_id] = threading.Lock()
            return _user_scheduling_locks[user_id]
    
    def auto_schedule_on_task_change(self, user_id: str, changed_task_id: str = None) -> Dict:
        """
        Automatically reschedule all user tasks when a task is created/updated
        Uses per-user locking to prevent concurrent scheduling operations
        
        Args:
            user_id: User ID
            changed_task_id: ID of the task that was changed (for optimization)
            
        Returns:
            Dictionary with scheduling results
        """
        user_lock = self._get_user_lock(user_id)
        
        # Try to acquire lock with timeout to prevent hanging
        lock_acquired = user_lock.acquire(timeout=5.0)
        if not lock_acquired:
            print(f"⚠️ Could not acquire scheduling lock for user {user_id} - another scheduling operation in progress")
            return {
                'success': False,
                'message': 'Another scheduling operation is already in progress. Please try again in a moment.'
            }
        
        try:
            print(f"🔒 Acquired scheduling lock for user {user_id}")
            
            # Get all user tasks that need scheduling
            user_tasks = Task.objects(user=ObjectId(user_id), status__ne='completed')
            
            # Clear existing schedules for non-completed tasks to allow fresh scheduling
            for task in user_tasks:
                if task.status != 'completed':
                    # Clear schedule using direct database update to avoid recursive scheduling
                    Task.objects(id=task.id).update(
                        start_time=None,
                        end_time=None
                    )
                    print(f"🔄 Cleared schedule for task: {task.title}")
            
            # Sequential scheduling with proper collision detection
            result = self.schedule_all_user_tasks_sequential(user_id)
            
            print(f"🔓 Releasing scheduling lock for user {user_id}")
            return {
                'success': True,
                'message': 'Tasks automatically rescheduled',
                'result': result
            }
            
        except Exception as e:
            print(f"❌ Error in auto_schedule_on_task_change: {e}")
            return {
                'success': False,
                'message': f'Error in automatic scheduling: {str(e)}'
            }
        finally:
            user_lock.release()
    
    def reschedule_task(self, task_id: str) -> Dict:
        """
        Reschedule a specific task
        
        Args:
            task_id: Task ID to reschedule
            
        Returns:
            Rescheduling result
        """
        try:
            task = Task.objects.get(id=ObjectId(task_id))
            
            # Check if task is overdue and cannot be rescheduled
            if task.is_overdue() and task.status != 'completed':
                return {
                    'success': False,
                    'message': 'Cannot reschedule overdue task',
                    'task': task.to_dict()
                }
            
            # Reschedule the task using MeTTa logic
            start_time, end_time = self.schedule_task(task)
            
            if self.save_task_schedule_to_db(task, start_time, end_time):
                return {
                    'success': True,
                    'message': 'Task rescheduled successfully using MeTTa logic',
                    'task': task.to_dict()
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to save rescheduled task to database'
                }
            
        except Task.DoesNotExist:
            return {
                'success': False,
                'message': 'Task not found'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error rescheduling task: {str(e)}'
            }
    
    def update_weights(self, deadline_weight: float, priority_weight: float):
        """
        Update scheduling weights
        
        Args:
            deadline_weight: New deadline weight (0.0-1.0)
            priority_weight: New priority weight (0.0-1.0)
        """
        # Normalize weights to sum to 1
        total = deadline_weight + priority_weight
        if total > 0:
            self.deadline_weight = deadline_weight / total
            self.priority_weight = priority_weight / total
        else:
            self.deadline_weight = 0.5
            self.priority_weight = 0.5
    
    def get_task_dependencies(self, task_id: str) -> List[Dict]:
        """
        Get immediate dependency for a task (non-recursive)
        
        Args:
            task_id: Task ID
            
        Returns:
            List containing the immediate dependency task (if any)
        """
        try:
            task = Task.objects.get(id=ObjectId(task_id))
            dependencies = []
            
            if task.dependency:
                dep_task = task.dependency
                dependencies.append(dep_task.to_dict())
            
            return dependencies
            
        except Task.DoesNotExist:
            return []
    
    def get_dependent_tasks(self, task_id: str) -> List[Dict]:
        """
        Get all tasks that depend on this task
        
        Args:
            task_id: Task ID
            
        Returns:
            List of dependent tasks
        """
        try:
            task = Task.objects.get(id=ObjectId(task_id))
            dependent_tasks = task.get_dependencies()
            return [dep_task.to_dict() for dep_task in dependent_tasks]
            
        except Task.DoesNotExist:
            return []
    
    def generate_metta_knowledge_base(self, user_id: str) -> str:
        """
        Generate MeTTa knowledge base for user's tasks
        
        Args:
            user_id: User ID
            
        Returns:
            MeTTa knowledge base as string
        """
        user_tasks = Task.objects(user=ObjectId(user_id))
        
        metta_kb = ";; Generated MeTTa Knowledge Base for User Tasks\n\n"
        
        # Add task atoms
        for task in user_tasks:
            metta_kb += task.to_metta_atom() + "\n"
        
        # Add dependency facts
        metta_kb += "\n;; Task Dependencies\n"
        for task in user_tasks:
            if task.is_independent():
                metta_kb += f"(independent-task {str(task.id)})\n"
            else:
                metta_kb += f"(depends-on {str(task.id)} {str(task.dependency.id)})\n"
        
        # Add completion status
        metta_kb += "\n;; Task Completion Status\n"
        for task in user_tasks:
            if task.status == 'completed':
                metta_kb += f"(task-completed {str(task.id)})\n"
        
        return metta_kb
