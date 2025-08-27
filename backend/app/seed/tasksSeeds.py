#!/usr/bin/env python3
"""
Task Seeds Script
Creates test tasks for user with ObjectId: 68aee670cb70236f120d9dbb

Structure:
- Chain 1: 2 tasks (Task 1 → Task 2)
- Chain 2: 3 tasks (Task 3 → Task 4 → Task 5)  
- Chain 3: 4 tasks (Task 6 → Task 7 → Task 8 → Task 9)
- Independent: 3 tasks (Task 10, Task 11, Task 12)

Total: 12 tasks
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize database connection
import mongoengine
mongoengine.connect('task_scheduler')

from app.models.task import Task, TaskStatus
from app.models import User
from datetime import datetime, timezone, timedelta
from bson import ObjectId

def seed_tasks():
    """Seed tasks for testing the immediate dependency logic."""
    
    USER_ID = "68aee670cb70236f120d9dbb"
    
    print("=== Task Seeding Script ===")
    print(f"Target User ID: {USER_ID}")
    
    # Check if user exists, if not create one
    try:
        user = User.objects.get(id=ObjectId(USER_ID))
        print(f"✓ Found user: {user.username} ({user.name})")
    except User.DoesNotExist:
        print(f"✗ User with ID {USER_ID} not found")
        print("Available users:")
        all_users = User.objects.all()
        if all_users:
            for u in all_users:
                print(f"  - {u.id}: {u.username} ({u.name})")
            # Use the first available user
            user = all_users[0]
            print(f"✓ Using first available user: {user.username} ({user.name})")
        else:
            print("No users found in database. Creating a test user...")
            import bcrypt
            # Create a test user
            password_hash = bcrypt.hashpw("testpass123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(
                username="testuser",
                name="Test User",
                email="test@example.com",
                password_hash=password_hash
            )
            user.save()
            print(f"✓ Created test user: {user.username} ({user.name}) with ID: {user.id}")
    
    print(f"Using User ID: {user.id}")
    
    # Delete all existing tasks for this user
    print("\n=== Cleaning Existing Tasks ===")
    existing_count = Task.objects(user=user).count()
    if existing_count > 0:
        Task.objects(user=user).delete()
        print(f"✓ Deleted {existing_count} existing tasks")
    else:
        print("✓ No existing tasks to delete")
    
    # Base deadline and priority settings
    base_deadline = datetime.now(timezone.utc) + timedelta(days=7)
    
    print("\n=== Creating New Tasks ===")
    
    # Task list to store all created tasks
    all_tasks = []
    
    # ============================================
    # CHAIN 1: 2 tasks (Task 1 → Task 2)
    # ============================================
    print("\n--- Chain 1: 2 tasks ---")
    
    # Task 1 (Independent)
    task1 = Task(
        title="Design System Architecture",
        description="Create the overall system architecture and design patterns",
        deadline=base_deadline + timedelta(hours=24),
        estimated_duration=4.0,
        priority=5,  # Critical
        user=user
    )
    task1.save()
    all_tasks.append(task1)
    print(f"✓ Created Task 1: {task1.title} (Independent, Priority: {task1.priority})")
    
    # Task 2 (Depends on Task 1)
    task2 = Task(
        title="Implement Core Components",
        description="Build the core components based on the architecture design",
        dependency=task1,
        deadline=base_deadline + timedelta(hours=48),
        estimated_duration=6.0,
        priority=4,  # Urgent
        user=user
    )
    task2.save()
    all_tasks.append(task2)
    print(f"✓ Created Task 2: {task2.title} (Depends on Task 1, Priority: {task2.priority})")
    
    # ============================================
    # CHAIN 2: 3 tasks (Task 3 → Task 4 → Task 5)
    # ============================================
    print("\n--- Chain 2: 3 tasks ---")
    
    # Task 3 (Independent)
    task3 = Task(
        title="Database Schema Design",
        description="Design the database schema and relationships",
        deadline=base_deadline + timedelta(hours=36),
        estimated_duration=3.0,
        priority=5,  # Critical
        user=user
    )
    task3.save()
    all_tasks.append(task3)
    print(f"✓ Created Task 3: {task3.title} (Independent, Priority: {task3.priority})")
    
    # Task 4 (Depends on Task 3)
    task4 = Task(
        title="Database Implementation",
        description="Implement the database schema and create initial migrations",
        dependency=task3,
        deadline=base_deadline + timedelta(hours=60),
        estimated_duration=4.0,
        priority=4,  # Urgent
        user=user
    )
    task4.save()
    all_tasks.append(task4)
    print(f"✓ Created Task 4: {task4.title} (Depends on Task 3, Priority: {task4.priority})")
    
    # Task 5 (Depends on Task 4)
    task5 = Task(
        title="Data Access Layer",
        description="Create data access layer and repository patterns",
        dependency=task4,
        deadline=base_deadline + timedelta(hours=84),
        estimated_duration=5.0,
        priority=3,  # High
        user=user
    )
    task5.save()
    all_tasks.append(task5)
    print(f"✓ Created Task 5: {task5.title} (Depends on Task 4, Priority: {task5.priority})")
    
    # ============================================
    # CHAIN 3: 4 tasks (Task 6 → Task 7 → Task 8 → Task 9)
    # ============================================
    print("\n--- Chain 3: 4 tasks ---")
    
    # Task 6 (Independent)
    task6 = Task(
        title="API Specification",
        description="Define API endpoints, request/response formats, and documentation",
        deadline=base_deadline + timedelta(hours=72),
        estimated_duration=3.0,
        priority=4,  # Urgent
        user=user
    )
    task6.save()
    all_tasks.append(task6)
    print(f"✓ Created Task 6: {task6.title} (Independent, Priority: {task6.priority})")
    
    # Task 7 (Depends on Task 6)
    task7 = Task(
        title="API Controllers",
        description="Implement API controllers and routing logic",
        dependency=task6,
        deadline=base_deadline + timedelta(hours=96),
        estimated_duration=4.0,
        priority=3,  # High
        user=user
    )
    task7.save()
    all_tasks.append(task7)
    print(f"✓ Created Task 7: {task7.title} (Depends on Task 6, Priority: {task7.priority})")
    
    # Task 8 (Depends on Task 7)
    task8 = Task(
        title="API Middleware",
        description="Implement authentication, validation, and error handling middleware",
        dependency=task7,
        deadline=base_deadline + timedelta(hours=120),
        estimated_duration=3.0,
        priority=3,  # High
        user=user
    )
    task8.save()
    all_tasks.append(task8)
    print(f"✓ Created Task 8: {task8.title} (Depends on Task 7, Priority: {task8.priority})")
    
    # Task 9 (Depends on Task 8)
    task9 = Task(
        title="API Testing",
        description="Create comprehensive API tests and integration tests",
        dependency=task8,
        deadline=base_deadline + timedelta(hours=144),
        estimated_duration=4.0,
        priority=2,  # Medium
        user=user
    )
    task9.save()
    all_tasks.append(task9)
    print(f"✓ Created Task 9: {task9.title} (Depends on Task 8, Priority: {task9.priority})")
    
    # ============================================
    # INDEPENDENT TASKS: 3 tasks
    # ============================================
    print("\n--- Independent Tasks: 3 tasks ---")
    
    # Task 10 (Independent)
    task10 = Task(
        title="UI/UX Design",
        description="Create user interface mockups and user experience flows",
        deadline=base_deadline + timedelta(hours=168),
        estimated_duration=5.0,
        priority=3,  # High
        user=user
    )
    task10.save()
    all_tasks.append(task10)
    print(f"✓ Created Task 10: {task10.title} (Independent, Priority: {task10.priority})")
    
    # Task 11 (Independent)
    task11 = Task(
        title="Security Audit",
        description="Conduct security audit and vulnerability assessment",
        deadline=base_deadline + timedelta(hours=192),
        estimated_duration=3.0,
        priority=4,  # Urgent
        user=user
    )
    task11.save()
    all_tasks.append(task11)
    print(f"✓ Created Task 11: {task11.title} (Independent, Priority: {task11.priority})")
    
    # Task 12 (Independent)
    task12 = Task(
        title="Documentation",
        description="Write comprehensive project documentation and user guides",
        deadline=base_deadline + timedelta(hours=216),
        estimated_duration=6.0,
        priority=2,  # Medium
        user=user
    )
    task12.save()
    all_tasks.append(task12)
    print(f"✓ Created Task 12: {task12.title} (Independent, Priority: {task12.priority})")
    
    # ============================================
    # SUMMARY
    # ============================================
    print("\n=== Seeding Summary ===")
    print(f"Total tasks created: {len(all_tasks)}")
    print("\nDependency Chains:")
    print("Chain 1: Task 1 → Task 2")
    print("Chain 2: Task 3 → Task 4 → Task 5")
    print("Chain 3: Task 6 → Task 7 → Task 8 → Task 9")
    print("Independent: Task 10, Task 11, Task 12")
    
    print("\nScheduling Eligibility (Initially):")
    eligible_tasks = []
    for task in all_tasks:
        if task.can_be_scheduled():
            eligible_tasks.append(task)
    
    print(f"✓ {len(eligible_tasks)} tasks eligible for immediate scheduling:")
    for task in eligible_tasks:
        print(f"  - {task.title} (Priority: {task.priority})")
    
    print(f"\n✗ {len(all_tasks) - len(eligible_tasks)} tasks waiting for dependencies:")
    for task in all_tasks:
        if not task.can_be_scheduled():
            dep_title = task.dependency.title if task.dependency else "None"
            print(f"  - {task.title} (waiting for: {dep_title})")
    
    print("\n✅ Task seeding completed successfully!")
    return True

if __name__ == "__main__":
    try:
        success = seed_tasks()
        if success:
            print("\n🎉 All tasks have been seeded successfully!")
        else:
            print("\n❌ Task seeding failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error during task seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)