from mongoengine import Document, StringField, DateTimeField, ReferenceField, IntField, FloatField
from datetime import datetime, timezone
import enum

class TaskStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class TaskPriority(enum.Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5

class Task(Document):
    """Task model for the task scheduler"""
    title = StringField(required=True, max_length=200)
    description = StringField(max_length=1000)
    dependency = ReferenceField('self', required=False)  # Reference to parent task
    deadline = DateTimeField(required=True)
    estimated_duration = FloatField(required=True)  # Duration in hours
    priority = IntField(required=True, min_value=1, max_value=5, default=1)  # 1=low, 5=critical
    start_time = DateTimeField(required=False)  # Auto-calculated by scheduler
    end_time = DateTimeField(required=False)    # Auto-calculated by scheduler
    status = StringField(choices=[status.value for status in TaskStatus], default=TaskStatus.PENDING.value)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    user = ReferenceField('User', required=True)  # Reference to user who created the task
    
    meta = {
        'collection': 'tasks',
        'indexes': ['user', 'deadline', 'priority', 'status', 'dependency']
    }
    
    def save(self, *args, **kwargs):
        """Override save to update the updated_at field and trigger automatic scheduling"""
        self.updated_at = datetime.now(timezone.utc)
        
        # Save the task first
        result = super(Task, self).save(*args, **kwargs)
        
        # Trigger automatic scheduling for this user's tasks
        # We'll use a simple signal-like approach to avoid circular imports
        try:
            import threading
            from app.services.scheduler import TaskScheduler
            
            # Run scheduling in a separate thread to avoid blocking
            def schedule_async():
                try:
                    scheduler = TaskScheduler()
                    scheduler.auto_schedule_on_task_change(str(self.user.id), str(self.id))
                except Exception as e:
                    print(f"Error in automatic scheduling: {e}")
            
            # Only schedule if this is not already a scheduling operation
            # and if this is a meaningful change (not just timestamp updates)
            if not getattr(self, '_scheduling_in_progress', False):
                threading.Thread(target=schedule_async, daemon=True).start()
                
        except Exception as e:
            # Log the error but don't fail the save operation
            print(f"Error starting automatic scheduling: {e}")
        
        return result
    
    def is_independent(self):
        """Check if task is independent (has no dependency)"""
        return self.dependency is None
    
    def is_dependent(self):
        """Check if task is dependent (has a dependency)"""
        return self.dependency is not None
    
    def is_overdue(self):
        """Check if task is overdue"""
        now = datetime.now(timezone.utc)
        # Handle both timezone-aware and timezone-naive deadlines
        deadline = self.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        return now > deadline and self.status != TaskStatus.COMPLETED.value
    
    def can_be_scheduled(self):
        """
        Check if task can be scheduled (immediate dependency is completed if exists)
        
        Key Rule: A task can only be scheduled if its IMMEDIATE dependency is completed.
        No recursive checking of the full dependency chain is required.
        
        Example chain: 1 → 2 → 3 → 4 → 5
        - Task 2 can be scheduled only when Task 1 is completed
        - Task 3 can be scheduled only when Task 2 is completed  
        - Task 5 can be scheduled only when Task 4 is completed
        - Task 5 does NOT need to check if Tasks 1, 2, or 3 are completed
        """
        # Independent tasks can always be scheduled
        if self.is_independent():
            return True
        
        # If task has no dependency (edge case), it can be scheduled
        if self.dependency is None:
            return True
            
        # Check only the immediate dependency status
        return self.dependency.status == TaskStatus.COMPLETED.value

    def can_be_completed(self):
        """
        Check if task can be marked as completed.
        
        MeTTa Logic Rule: A task can only be completed if its immediate dependency 
        (if any) is already completed. This prevents completing tasks out of order
        in dependency chains.
        
        Example chain: 1 → 2 → 3 → 4 → 5
        - Task 2 can only be completed after Task 1 is completed
        - Task 3 can only be completed after Task 2 is completed
        - Independent tasks can always be completed
        """
        # Independent tasks can always be completed
        if self.is_independent():
            return True
        
        # If task has no dependency (edge case), it can be completed
        if self.dependency is None:
            return True
            
        # Check only the immediate dependency status
        return self.dependency.status == TaskStatus.COMPLETED.value
    
    def get_immediate_dependency(self):
        """Get the immediate dependency task (if any)"""
        return self.dependency
    
    def get_dependencies(self):
        """Get all tasks that depend on this task (immediate dependents only)"""
        return Task.objects(dependency=self)
    
    def get_immediate_dependents(self):
        """Get tasks that directly depend on this task (same as get_dependencies)"""
        return self.get_dependencies()
    
    def count_immediate_dependents(self):
        """Count how many tasks directly depend on this task"""
        return self.get_dependencies().count()
    
    def validate_dependency(self, proposed_dependency):
        """
        Validate that a proposed dependency doesn't create a circular reference.
        Only checks immediate dependency to prevent Task A -> Task B -> Task A loops.
        """
        if proposed_dependency is None:
            return True
            
        # Can't depend on self
        if proposed_dependency.id == self.id:
            return False
            
        # Can't create immediate circular dependency (A -> B, B -> A)
        if proposed_dependency.dependency and proposed_dependency.dependency.id == self.id:
            return False
            
        # The dependency must not depend on this task (immediate check only)
        if proposed_dependency.dependency == self:
            return False
            
        return True
    
    def to_dict(self):
        """Convert task to dictionary representation"""
        return {
            'id': str(self.id),
            'title': self.title,
            'description': self.description,
            'dependency': str(self.dependency.id) if self.dependency else None,
            'dependency_title': self.dependency.title if self.dependency else None,
            'deadline': self.deadline.isoformat(),
            'estimated_duration': self.estimated_duration,
            'priority': self.priority,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user': str(self.user.id),
            'is_independent': self.is_independent(),
            'is_overdue': self.is_overdue(),
            'can_be_completed': self.can_be_completed(),
            'can_be_scheduled': self.can_be_scheduled()
        }
    
    def to_metta_atom(self):
        """Convert task to MeTTa atom representation"""
        dependency_id = str(self.dependency.id) if self.dependency else "none"
        return f"""(task (id {str(self.id)}) 
                       (title "{self.title}") 
                       (description "{self.description}")
                       (dependency {dependency_id})
                       (deadline "{self.deadline.isoformat()}")
                       (duration {self.estimated_duration})
                       (priority {self.priority})
                       (status {self.status})
                       (user {str(self.user.id)}))"""
