#!/usr/bin/env python3
"""
Simple Task Seeds Runner
"""

import os
import sys
import mongoengine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize database connection with MongoDB URI from environment
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/task_scheduler')
mongoengine.connect(host=MONGODB_URI)

from app.models.task import Task, TaskStatus
from app.models import User
from datetime import datetime, timezone, timedelta
from bson import ObjectId

def create_tasks():
    """Create tasks for Elvis Kiplimo"""
    
    USER_ID = "68aee670cb70236f120d9dbb"
    
    print("=== Creating Tasks for Elvis Kiplimo ===")
    
    try:
        user = User.objects.get(id=ObjectId(USER_ID))
        print(f"✓ Found user: {user.username} ({user.name})")
    except Exception as e:
        print(f"✗ Error finding user: {e}")
        return
    
    # Delete existing tasks
    existing_count = Task.objects(user=user).count()
    if existing_count > 0:
        Task.objects(user=user).delete()
        print(f"✓ Deleted {existing_count} existing tasks")
    
    # Base deadline - from tomorrow onwards since it's 11:10 PM on August 27, 2025
    # All deadlines spread from tomorrow (August 28) until several days out, all before 4pm
    tomorrow = datetime(2025, 8, 28, 8, 0, 0, tzinfo=timezone.utc)  # Tomorrow 8:00 AM
    
    # Spread deadlines across multiple days to avoid conflicts
    # Each task gets progressively later deadlines
    time_slots = []
    base_time = tomorrow
    for i in range(12):  # 12 tasks
        # Spread across 3 days, 4 tasks per day, 2-hour intervals starting at 8am
        day_offset = i // 4  # 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2
        hour_offset = (i % 4) * 2  # 0, 2, 4, 6 (8am, 10am, 12pm, 2pm)
        slot_time = base_time + timedelta(days=day_offset, hours=hour_offset)
        time_slots.append(slot_time)
    
    print("\n=== Creating Task Chains ===")
    
    # CHAIN 1: 2 tasks
    print("\nChain 1 (2 tasks):")
    task1 = Task(
        title="Design System Architecture",
        description="Create the overall system architecture",
        deadline=time_slots[0],  # 8/28/2025 8:00 AM
        estimated_duration=4.0,
        priority=5,
        user=user
    )
    task1.save()
    print(f"✓ Task 1: {task1.title} - Due: {task1.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task2 = Task(
        title="Implement Core Components", 
        description="Build core components",
        dependency=task1,
        deadline=time_slots[1],  # 8/28/2025 10:00 AM
        estimated_duration=6.0,
        priority=4,
        user=user
    )
    task2.save()
    print(f"✓ Task 2: {task2.title} (depends on Task 1) - Due: {task2.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    # CHAIN 2: 3 tasks
    print("\nChain 2 (3 tasks):")
    task3 = Task(
        title="Database Schema Design",
        description="Design database schema",
        deadline=time_slots[2],  # 8/28/2025 12:00 PM
        estimated_duration=3.0,
        priority=5,
        user=user
    )
    task3.save()
    print(f"✓ Task 3: {task3.title} - Due: {task3.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task4 = Task(
        title="Database Implementation",
        description="Implement database",
        dependency=task3,
        deadline=time_slots[3],  # 8/28/2025 2:00 PM
        estimated_duration=4.0,
        priority=4,
        user=user
    )
    task4.save()
    print(f"✓ Task 4: {task4.title} (depends on Task 3) - Due: {task4.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task5 = Task(
        title="Data Access Layer",
        description="Create data access layer",
        dependency=task4,
        deadline=time_slots[4],  # 8/29/2025 8:00 AM
        estimated_duration=5.0,
        priority=3,
        user=user
    )
    task5.save()
    print(f"✓ Task 5: {task5.title} (depends on Task 4) - Due: {task5.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    # CHAIN 3: 4 tasks
    print("\nChain 3 (4 tasks):")
    task6 = Task(
        title="API Specification",
        description="Define API endpoints",
        deadline=time_slots[5],  # 8/29/2025 10:00 AM
        estimated_duration=3.0,
        priority=4,
        user=user
    )
    task6.save()
    print(f"✓ Task 6: {task6.title} - Due: {task6.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task7 = Task(
        title="API Controllers",
        description="Implement API controllers",
        dependency=task6,
        deadline=time_slots[6],  # 8/29/2025 12:00 PM
        estimated_duration=4.0,
        priority=3,
        user=user
    )
    task7.save()
    print(f"✓ Task 7: {task7.title} (depends on Task 6) - Due: {task7.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task8 = Task(
        title="API Middleware",
        description="Implement middleware",
        dependency=task7,
        deadline=time_slots[7],  # 8/29/2025 2:00 PM
        estimated_duration=3.0,
        priority=3,
        user=user
    )
    task8.save()
    print(f"✓ Task 8: {task8.title} (depends on Task 7) - Due: {task8.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task9 = Task(
        title="API Testing",
        description="Create API tests",
        dependency=task8,
        deadline=time_slots[8],  # 8/30/2025 8:00 AM
        estimated_duration=4.0,
        priority=2,
        user=user
    )
    task9.save()
    print(f"✓ Task 9: {task9.title} (depends on Task 8) - Due: {task9.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    # INDEPENDENT TASKS: 3 tasks
    print("\nIndependent Tasks:")
    task10 = Task(
        title="UI/UX Design",
        description="Create UI/UX designs",
        deadline=time_slots[9],  # 8/30/2025 10:00 AM
        estimated_duration=5.0,
        priority=3,
        user=user
    )
    task10.save()
    print(f"✓ Task 10: {task10.title} (independent) - Due: {task10.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task11 = Task(
        title="Security Audit",
        description="Conduct security audit",
        deadline=time_slots[10],  # 8/30/2025 12:00 PM
        estimated_duration=3.0,
        priority=4,
        user=user
    )
    task11.save()
    print(f"✓ Task 11: {task11.title} (independent) - Due: {task11.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    task12 = Task(
        title="Documentation",
        description="Write documentation",
        deadline=time_slots[11],  # 8/30/2025 2:00 PM
        estimated_duration=6.0,
        priority=2,
        user=user
    )
    task12.save()
    print(f"✓ Task 12: {task12.title} (independent) - Due: {task12.deadline.strftime('%m/%d/%Y %I:%M %p')}")
    
    print(f"\n✅ Successfully created 12 tasks for {user.name}!")
    print("\nTask Structure:")
    print("Chain 1: Task 1 → Task 2")
    print("Chain 2: Task 3 → Task 4 → Task 5")
    print("Chain 3: Task 6 → Task 7 → Task 8 → Task 9")
    print("Independent: Task 10, Task 11, Task 12")

if __name__ == "__main__":
    try:
        create_tasks()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
