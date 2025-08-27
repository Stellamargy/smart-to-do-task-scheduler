"""
MeTTa Integration Service for Task Scheduling
This service handles the integration between the Flask API and MeTTa reasoning engine
"""

import os
import tempfile
from typing import List, Dict, Any
from datetime import datetime, timezone

class MettaService:
    """
    Service for integrating with MeTTa reasoning engine
    """
    
    def __init__(self):
        self.metta_file_path = os.path.join(
            os.path.dirname(__file__), 
            '..', '..', 
            'metta', 
            'scheduler.metta'
        )
    
    def create_task_atom(self, task_data: Dict[str, Any]) -> str:
        """
        Create a MeTTa atom representation of a task
        
        Args:
            task_data: Dictionary containing task information
            
        Returns:
            MeTTa atom string
        """
        task_id = task_data.get('id', '')
        title = task_data.get('title', '').replace('"', '\\"')
        description = task_data.get('description', '').replace('"', '\\"')
        dependency = task_data.get('dependency', 'none')
        deadline = task_data.get('deadline', '')
        duration = task_data.get('estimated_duration', 0)
        priority = task_data.get('priority', 1)
        status = task_data.get('status', 'pending')
        user_id = task_data.get('user', '')
        
        return f'''(task (id {task_id}) 
                       (title "{title}") 
                       (description "{description}")
                       (dependency {dependency})
                       (deadline "{deadline}")
                       (duration {duration})
                       (priority {priority})
                       (status {status})
                       (user {user_id}))'''
    
    def create_dependency_atoms(self, tasks: List[Dict[str, Any]]) -> List[str]:
        """
        Create MeTTa atoms for task dependencies
        
        Args:
            tasks: List of task dictionaries
            
        Returns:
            List of MeTTa dependency atoms
        """
        atoms = []
        
        for task in tasks:
            task_id = task.get('id', '')
            dependency = task.get('dependency')
            
            if dependency:
                atoms.append(f"(depends-on {task_id} {dependency})")
            else:
                atoms.append(f"(independent-task {task_id})")
        
        return atoms
    
    def create_completion_atoms(self, tasks: List[Dict[str, Any]]) -> List[str]:
        """
        Create MeTTa atoms for task completion status
        
        Args:
            tasks: List of task dictionaries
            
        Returns:
            List of MeTTa completion atoms
        """
        atoms = []
        
        for task in tasks:
            if task.get('status') == 'completed':
                atoms.append(f"(task-completed {task.get('id', '')})")
        
        return atoms
    
    def generate_user_knowledge_base(self, tasks: List[Dict[str, Any]]) -> str:
        """
        Generate a complete MeTTa knowledge base for a user's tasks
        
        Args:
            tasks: List of task dictionaries
            
        Returns:
            Complete MeTTa knowledge base as string
        """
        kb_parts = [
            ";; Generated MeTTa Knowledge Base for User Tasks",
            f";; Generated at: {datetime.now(timezone.utc).isoformat()}",
            f";; Total tasks: {len(tasks)}",
            "",
            ";; Load base scheduler rules",
            f'(load "{self.metta_file_path}")',
            "",
            ";; Task Definitions"
        ]
        
        # Add task atoms
        for task in tasks:
            kb_parts.append(self.create_task_atom(task))
        
        kb_parts.extend([
            "",
            ";; Task Dependencies"
        ])
        
        # Add dependency atoms
        dependency_atoms = self.create_dependency_atoms(tasks)
        kb_parts.extend(dependency_atoms)
        
        kb_parts.extend([
            "",
            ";; Task Completion Status"
        ])
        
        # Add completion atoms
        completion_atoms = self.create_completion_atoms(tasks)
        kb_parts.extend(completion_atoms)
        
        kb_parts.extend([
            "",
            ";; Current timestamp for scheduling",
            f'(current-time "{datetime.now(timezone.utc).isoformat()}")',
            "",
            ";; Query schedulable tasks",
            "(schedulable-tasks (get-all-tasks))"
        ])
        
        return "\n".join(kb_parts)
    
    def write_knowledge_base_to_file(self, kb_content: str) -> str:
        """
        Write knowledge base content to a temporary file
        
        Args:
            kb_content: MeTTa knowledge base content
            
        Returns:
            Path to the temporary file
        """
        with tempfile.NamedTemporaryFile(mode='w', suffix='.metta', delete=False) as f:
            f.write(kb_content)
            return f.name
    
    def create_scheduling_query(self, deadline_weight: float = 0.6, priority_weight: float = 0.4) -> str:
        """
        Create a MeTTa query for task scheduling
        
        Args:
            deadline_weight: Weight for deadline priority
            priority_weight: Weight for task priority
            
        Returns:
            MeTTa scheduling query
        """
        return f"""
;; Set scheduling weights
(= (get-deadline-weight) {deadline_weight})
(= (get-priority-weight) {priority_weight})

;; Query: Schedule all tasks with current weights
(schedule-all-tasks (get-all-tasks) {deadline_weight} {priority_weight})
"""
    
    def format_scheduling_result(self, raw_result: str) -> Dict[str, Any]:
        """
        Format raw MeTTa scheduling result into structured data
        
        Args:
            raw_result: Raw result from MeTTa execution
            
        Returns:
            Formatted scheduling result
        """
        # This would parse the MeTTa output and convert it to structured data
        # For now, return a placeholder structure
        return {
            'status': 'success',
            'scheduled_tasks': [],
            'conflicts': [],
            'raw_output': raw_result,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def validate_task_dependencies(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate task dependency graph for cycles and invalid references
        
        Args:
            tasks: List of task dictionaries
            
        Returns:
            Validation result
        """
        task_ids = {task['id'] for task in tasks}
        errors = []
        warnings = []
        
        # Check for invalid dependency references
        for task in tasks:
            dependency = task.get('dependency')
            if dependency and dependency != 'none' and dependency not in task_ids:
                errors.append(f"Task {task['id']} has invalid dependency: {dependency}")
        
        # Check for circular dependencies (simple cycle detection)
        visited = set()
        rec_stack = set()
        
        def has_cycle(task_id: str) -> bool:
            if task_id in rec_stack:
                return True
            if task_id in visited:
                return False
            
            visited.add(task_id)
            rec_stack.add(task_id)
            
            # Find the task with this ID
            task = next((t for t in tasks if t['id'] == task_id), None)
            if task and task.get('dependency') and task['dependency'] != 'none':
                if has_cycle(task['dependency']):
                    return True
            
            rec_stack.remove(task_id)
            return False
        
        # Check each task for cycles
        for task in tasks:
            if task['id'] not in visited:
                if has_cycle(task['id']):
                    errors.append(f"Circular dependency detected involving task {task['id']}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def generate_scheduling_report(self, tasks: List[Dict[str, Any]], 
                                 scheduled_result: Dict[str, Any]) -> str:
        """
        Generate a human-readable scheduling report
        
        Args:
            tasks: List of task dictionaries
            scheduled_result: Result from scheduling operation
            
        Returns:
            Formatted scheduling report
        """
        total_tasks = len(tasks)
        independent_tasks = len([t for t in tasks if not t.get('dependency') or t.get('dependency') == 'none'])
        dependent_tasks = total_tasks - independent_tasks
        
        report_lines = [
            "=== Task Scheduling Report ===",
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            "",
            f"Total Tasks: {total_tasks}",
            f"Independent Tasks: {independent_tasks}",
            f"Dependent Tasks: {dependent_tasks}",
            "",
            "Priority Distribution:",
        ]
        
        # Priority distribution
        priority_counts = {}
        for task in tasks:
            priority = task.get('priority', 1)
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        for priority in sorted(priority_counts.keys()):
            count = priority_counts[priority]
            report_lines.append(f"  Priority {priority}: {count} tasks")
        
        report_lines.extend([
            "",
            "=== Scheduling Results ===",
            f"Status: {scheduled_result.get('status', 'unknown')}",
            f"Scheduled Tasks: {len(scheduled_result.get('scheduled_tasks', []))}",
            f"Conflicts: {len(scheduled_result.get('conflicts', []))}",
        ])
        
        return "\n".join(report_lines)
