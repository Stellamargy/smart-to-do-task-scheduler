from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from bson import ObjectId
from marshmallow import Schema, fields, ValidationError
from app.models.task import Task, TaskStatus, TaskPriority
from app.models import User
from app.services.scheduler import TaskScheduler
import traceback

tasks_bp = Blueprint('tasks', __name__)

# Handle preflight requests explicitly
@tasks_bp.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return '', 200

# Marshmallow schemas for validation
class TaskUpdateSchema(Schema):
    title = fields.Str(validate=lambda x: len(x.strip()) > 0)
    description = fields.Str()
    dependency = fields.Str(allow_none=True)
    deadline = fields.DateTime()
    estimated_duration = fields.Float(validate=lambda x: x > 0)
    priority = fields.Int(validate=lambda x: 1 <= x <= 5)
    status = fields.Str(validate=lambda x: x in [status.value for status in TaskStatus])

@tasks_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Tasks API is running'})

@tasks_bp.route('', methods=['GET'])
@jwt_required()
def get_all_tasks():
    """Get all tasks for the current user and automatically run scheduling"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get current time and timezone from frontend for accurate local scheduling
        frontend_current_time = request.args.get('current_time')
        frontend_timezone = request.args.get('timezone')  # e.g., "Africa/Nairobi"
        
        if frontend_current_time:
            try:
                # Parse the frontend time (should be in user's local time as ISO string)
                current_time = datetime.fromisoformat(frontend_current_time.replace('Z', '+00:00'))
                
                # If timezone is provided, use it for proper local time handling
                if frontend_timezone:
                    import pytz
                    try:
                        user_timezone = pytz.timezone(frontend_timezone)
                        # Convert to user's timezone if needed
                        if current_time.tzinfo is None or current_time.tzinfo.utcoffset(current_time) is None:
                            # If time is naive, assume it's already in user's timezone
                            current_time = user_timezone.localize(current_time.replace(tzinfo=None))
                        else:
                            # Convert to user's timezone
                            current_time = current_time.astimezone(user_timezone)
                        print(f"🌍 Using user's local time ({frontend_timezone}): {current_time}")
                    except pytz.exceptions.UnknownTimeZoneError:
                        print(f"⚠️ Unknown timezone {frontend_timezone}, using original time")
                else:
                    print(f"Using frontend time: {current_time}")
            except ValueError:
                current_time = datetime.now(timezone.utc)
                print(f"Invalid frontend time format, using server UTC time: {current_time}")
        else:
            current_time = datetime.now(timezone.utc)
            print(f"No frontend time provided, using server UTC time: {current_time}")
        
        # Automatically run MeTTa scheduling algorithm on fetch
        try:
            # Initialize scheduler with user's timezone for accurate scheduling
            scheduler_timezone = frontend_timezone if frontend_timezone else 'UTC'
            scheduler = TaskScheduler(current_time=current_time, user_timezone=scheduler_timezone)
            # Check if there are any unscheduled tasks that need scheduling
            all_user_tasks = Task.objects(user=user, status__ne=TaskStatus.COMPLETED.value)
            unscheduled_tasks = [task for task in all_user_tasks if not task.start_time or not task.end_time]
            
            if unscheduled_tasks:
                print(f"🔄 Auto-scheduling {len(unscheduled_tasks)} unscheduled tasks on fetch")
                result = scheduler.auto_schedule_on_task_change(current_user_id)
                print(f"📅 Auto-scheduling completed: {result.get('message', 'Success')}")
        except Exception as e:
            print(f"⚠️ Warning: Auto-scheduling failed on fetch: {e}")
            # Continue with regular task fetch even if scheduling fails
        
        # Get query parameters
        status = request.args.get('status')
        include_completed = request.args.get('include_completed', 'false').lower() == 'true'
        
        # Build query
        query = {'user': user}
        if status:
            query['status'] = status
        elif not include_completed:
            query['status__ne'] = TaskStatus.COMPLETED.value
        
        tasks = Task.objects(**query).order_by('-created_at')
        
        return jsonify({
            'tasks': [task.to_dict() for task in tasks],
            'total': len(tasks)
        })
        
    except Exception as e:
        print(f"Error getting tasks: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@tasks_bp.route('/scheduled', methods=['GET'])
@jwt_required()
def get_scheduled_tasks():
    """
    Get scheduled tasks for the current user.
    First checks for unscheduled tasks and schedules them using MeTTa logic:
    1. Independent tasks (no dependencies)
    2. Dependent tasks whose dependencies are completed
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get current time and timezone from frontend query parameter
        frontend_current_time = request.args.get('current_time')
        frontend_timezone = request.args.get('timezone')  # e.g., "Africa/Nairobi"
        
        if frontend_current_time:
            try:
                current_time = datetime.fromisoformat(frontend_current_time.replace('Z', '+00:00'))
                
                # If timezone is provided, use it for proper local time handling
                if frontend_timezone:
                    import pytz
                    try:
                        user_timezone = pytz.timezone(frontend_timezone)
                        # Convert to user's timezone if needed
                        if current_time.tzinfo is None or current_time.tzinfo.utcoffset(current_time) is None:
                            # If time is naive, assume it's already in user's timezone
                            current_time = user_timezone.localize(current_time.replace(tzinfo=None))
                        else:
                            # Convert to user's timezone
                            current_time = current_time.astimezone(user_timezone)
                        print(f"🌍 Using user's local time ({frontend_timezone}): {current_time}")
                    except pytz.exceptions.UnknownTimeZoneError:
                        print(f"⚠️ Unknown timezone {frontend_timezone}, using original time")
                else:
                    print(f"Using frontend time: {current_time}")
            except ValueError:
                current_time = datetime.now(timezone.utc)
                print(f"Invalid frontend time format, using server time: {current_time}")
        else:
            current_time = datetime.now(timezone.utc)
            print(f"No frontend time provided, using server time: {current_time}")
        
        # Get all non-completed user tasks (excluding completed tasks from scheduling)
        all_tasks = Task.objects(user=user, status__ne=TaskStatus.COMPLETED.value)
        print(f"📋 Found {len(all_tasks)} non-completed tasks for user")
        
        # Find unscheduled tasks (no start_time or end_time)
        unscheduled_tasks = [task for task in all_tasks if not task.start_time or not task.end_time]
        print(f"⏱️ Found {len(unscheduled_tasks)} unscheduled tasks that need scheduling")
        
        # Always run MeTTa scheduling to ensure fresh and optimal scheduling
        scheduled_count = 0
        try:
            # Initialize scheduler with user's timezone for accurate scheduling
            scheduler_timezone = frontend_timezone if frontend_timezone else 'UTC'
            scheduler = TaskScheduler(current_time=current_time, user_timezone=scheduler_timezone)
            print(f"🔄 Running MeTTa scheduling algorithm for {len(all_tasks)} total tasks ({len(unscheduled_tasks)} unscheduled)")
            result = scheduler.auto_schedule_on_task_change(current_user_id)
            scheduled_count = result.get('result', {}).get('total_scheduled', 0)
            print(f"📅 MeTTa scheduling completed: {result}")
            print(f"✅ Scheduled {scheduled_count} tasks with latest MeTTa logic")
        except Exception as e:
            print(f"❌ Error in MeTTa scheduling: {e}")
            # Continue without failing the request
        
        # Get all scheduled tasks (non-completed tasks with both start_time and end_time)
        # Use explicit status filtering for pending and in_progress only
        scheduled_tasks = Task.objects(
            user=user,
            status__in=[TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value],
            start_time__exists=True,
            end_time__exists=True,
            start_time__ne=None,
            end_time__ne=None
        ).order_by('start_time')
        
        # Triple-check filter to absolutely ensure no completed tasks are returned
        scheduled_tasks = [task for task in scheduled_tasks if task.status in ['pending', 'in_progress']]
        
        # Log any potential completed tasks that might have been filtered out
        all_scheduled_including_completed = Task.objects(
            user=user,
            start_time__exists=True,
            end_time__exists=True,
            start_time__ne=None,
            end_time__ne=None
        )
        completed_but_scheduled = [task for task in all_scheduled_including_completed if task.status == 'completed']
        if completed_but_scheduled:
            print(f"⚠️ Found {len(completed_but_scheduled)} completed tasks that still have scheduling data:")
            for task in completed_but_scheduled:
                print(f"   - '{task.title}' (ID: {task.id}) - Status: {task.status}")
        
        print(f"📅 Returning {len(scheduled_tasks)} scheduled tasks (only pending/in_progress)")
        print(f"📊 Scheduled task statuses: {[task.status for task in scheduled_tasks]}")
        
        # Count tasks by dependency status for better insights
        independent_scheduled = len([t for t in scheduled_tasks if not t.dependency])
        dependent_scheduled = len([t for t in scheduled_tasks if t.dependency])
        print(f"🔗 Scheduled tasks breakdown: {independent_scheduled} independent, {dependent_scheduled} dependent")
        
        return jsonify({
            'scheduled_tasks': [task.to_dict() for task in scheduled_tasks],
            'total_scheduled': len(scheduled_tasks),
            'newly_scheduled': scheduled_count,
            'metta_logic_applied': len(unscheduled_tasks) > 0,
            'scheduling_summary': {
                'independent_tasks_scheduled': independent_scheduled,
                'dependent_tasks_scheduled': dependent_scheduled,
                'completed_tasks_excluded': True  # Make it explicit that completed tasks are excluded
            }
        })
        
    except Exception as e:
        print(f"Error getting scheduled tasks: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@tasks_bp.route('/<task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a single task by ID"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        # Get the task and ensure it belongs to the current user
        task = Task.objects.get(id=ObjectId(task_id), user=user)
        
        # Get dependency details if exists
        dependency_details = None
        if task.dependency:
            try:
                dependency_task = Task.objects.get(id=task.dependency.id, user=user)
                dependency_details = {
                    'id': str(dependency_task.id),
                    'title': dependency_task.title,
                    'status': dependency_task.status,
                    'completed': dependency_task.status == TaskStatus.COMPLETED.value
                }
            except Task.DoesNotExist:
                dependency_details = None
        
        # Get dependent tasks (tasks that depend on this one)
        dependent_tasks = Task.objects.filter(dependency=task, user=user)
        dependent_tasks_list = []
        for dep_task in dependent_tasks:
            dependent_tasks_list.append({
                'id': str(dep_task.id),
                'title': dep_task.title,
                'status': dep_task.status,
                'priority': dep_task.priority,
                'deadline': dep_task.deadline.isoformat() if dep_task.deadline else None
            })
        
        # Check if task is overdue
        is_overdue = False
        if task.deadline:
            # Ensure both datetimes are timezone-aware for comparison
            now_utc = datetime.now(timezone.utc)
            task_deadline = task.deadline
            if task_deadline.tzinfo is None:
                # If deadline is naive, assume it's in UTC
                task_deadline = task_deadline.replace(tzinfo=timezone.utc)
            is_overdue = task_deadline < now_utc and task.status != TaskStatus.COMPLETED.value
        
        # Calculate completion percentage for dependent tasks
        dependent_completion = 0
        if dependent_tasks_list:
            completed_dependents = len([t for t in dependent_tasks_list if t['status'] == TaskStatus.COMPLETED.value])
            dependent_completion = (completed_dependents / len(dependent_tasks_list)) * 100
        
        task_data = {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'dependency': str(task.dependency.id) if task.dependency else None,
            'dependency_title': task.dependency.title if task.dependency else None,
            'dependency_details': dependency_details,
            'dependent_tasks': dependent_tasks_list,
            'dependent_completion': dependent_completion,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'estimated_duration': task.estimated_duration,
            'priority': task.priority,
            'start_time': task.start_time.isoformat() if task.start_time else None,
            'end_time': task.end_time.isoformat() if task.end_time else None,
            'status': task.status,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat(),
            'user': str(task.user.id),
            'is_independent': task.dependency is None,
            'is_overdue': is_overdue,
            'is_scheduled': task.start_time is not None and task.end_time is not None
        }
        
        return jsonify({
            'task': task_data,
            'message': 'Task retrieved successfully'
        })
        
    except Task.DoesNotExist:
        return jsonify({'error': 'Task not found or access denied'}), 404
    except User.DoesNotExist:
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        print(f"Error getting task: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@tasks_bp.route('/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update a task"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        task = Task.objects.get(id=ObjectId(task_id), user=user)
        
        # Validate request data
        schema = TaskUpdateSchema()
        data = schema.load(request.json)
        
        # Check if dependency exists and belongs to the same user
        if 'dependency' in data:
            if data['dependency']:
                try:
                    dependency_task = Task.objects.get(
                        id=ObjectId(data['dependency']),
                        user=user
                    )
                    # Validate dependency to prevent circular references
                    if not task.validate_dependency(dependency_task):
                        return jsonify({'error': 'Invalid dependency: would create circular reference'}), 400
                    task.dependency = dependency_task
                except Task.DoesNotExist:
                    return jsonify({'error': 'Dependency task not found or does not belong to user'}), 400
            else:
                task.dependency = None
        
        # Update task fields
        for field, value in data.items():
            if field != 'dependency':  # Already handled above
                setattr(task, field, value)
        
        # MeTTa Logic: Check if task can be completed when status is being set to completed
        if 'status' in data and data['status'] == TaskStatus.COMPLETED.value:
            if not task.can_be_completed():
                dependency_title = task.dependency.title if task.dependency else "Unknown"
                return jsonify({
                    'error': 'Cannot complete task: dependency not completed',
                    'message': f'Task "{task.title}" cannot be completed because its dependency "{dependency_title}" is not yet completed.',
                    'details': {
                        'task_id': str(task.id),
                        'task_title': task.title,
                        'dependency_id': str(task.dependency.id) if task.dependency else None,
                        'dependency_title': dependency_title,
                        'dependency_status': task.dependency.status if task.dependency else None
                    }
                }), 400
        
        # Log when a task is being marked as completed
        if 'status' in data and data['status'] == TaskStatus.COMPLETED.value:
            print(f"✅ Task '{task.title}' marked as completed - will be excluded from future scheduling")
            # Clear scheduling data for completed tasks to prevent them from appearing in scheduled lists
            task.start_time = None
            task.end_time = None
            print(f"🧹 Cleared scheduling data for completed task '{task.title}'")
        
        # Save the task (this will automatically trigger rescheduling)
        task.save()
        
        # If task was marked as completed, trigger immediate rescheduling to update dependencies
        if 'status' in data and data['status'] == TaskStatus.COMPLETED.value:
            try:
                scheduler = TaskScheduler()
                result = scheduler.auto_schedule_on_task_change(current_user_id)
                print(f"🔄 Auto-rescheduling triggered after task completion: {result.get('message', 'Success')}")
            except Exception as e:
                print(f"⚠️ Warning: Auto-rescheduling failed after task completion: {e}")
        
        return jsonify({
            'message': 'Task updated and schedule automatically adjusted',
            'task': task.to_dict()
        })
        
    except Task.DoesNotExist:
        return jsonify({'error': 'Task not found'}), 404
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        print(f"Error updating task: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@tasks_bp.route('/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    try:
        current_user_id = get_jwt_identity()
        user = User.objects.get(id=ObjectId(current_user_id))
        
        task = Task.objects.get(id=ObjectId(task_id), user=user)
        
        # Check if other tasks depend on this task
        dependent_tasks = task.get_dependencies()
        if dependent_tasks:
            return jsonify({
                'error': 'Cannot delete task with dependencies',
                'dependent_tasks': [dep.title for dep in dependent_tasks]
            }), 400
        
        task.delete()
        
        # Trigger automatic rescheduling for remaining tasks
        try:
            scheduler = TaskScheduler()
            scheduler.auto_schedule_on_task_change(current_user_id)
        except Exception as e:
            print(f"Error in automatic rescheduling after deletion: {e}")
        
        return jsonify({'message': 'Task deleted successfully'})
        
    except Task.DoesNotExist:
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error deleting task: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500
