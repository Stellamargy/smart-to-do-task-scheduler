#!/usr/bin/env python3
"""
Test script for MeTTa integration in the task scheduler
"""

import os
import sys
from datetime import datetime, timedelta
import pytz

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.scheduler import TaskScheduler

def test_metta_integration():
    """Test MeTTa integration with scheduler"""
    print("🧪 Testing MeTTa Integration with Task Scheduler")
    print("=" * 60)
    
    # Create scheduler instance
    current_time = datetime.now(pytz.timezone('Africa/Nairobi'))
    scheduler = TaskScheduler(
        deadline_weight=0.6,
        priority_weight=0.4,
        current_time=current_time,
        user_timezone='Africa/Nairobi'
    )
    
    print(f"📅 Current time: {current_time}")
    print(f"🕰️ User timezone: {scheduler.user_timezone}")
    print(f"🧠 MeTTa available: {scheduler.metta_loaded}")
    
    if scheduler.metta_loaded:
        print("✅ MeTTa engine initialized successfully!")
        
        # Test urgency calculation
        print("\n🔍 Testing urgency calculation...")
        
        # Create a mock task for testing
        class MockTask:
            def __init__(self, task_id, title, priority, deadline, estimated_duration):
                self.id = task_id
                self.title = title
                self.priority = priority
                self.deadline = deadline
                self.estimated_duration = estimated_duration
                self.status = 'pending'
                self.dependency = None
        
        # Test task with high urgency
        test_deadline = current_time + timedelta(hours=2)  # 2 hours from now
        high_urgency_task = MockTask(
            "test-001", 
            "High Priority Test Task", 
            5, 
            test_deadline, 
            1.0
        )
        
        urgency_score = scheduler.calculate_urgency_score(high_urgency_task)
        print(f"   📊 High urgency task score: {urgency_score:.3f}")
        
        # Test optimal time slot calculation
        print("\n⏰ Testing optimal time slot calculation...")
        try:
            # Test the MeTTa optimal time slot function
            if scheduler.metta_engine:
                result = scheduler.metta_engine.run(f'(optimal-time-slot {urgency_score} {high_urgency_task.priority})')
                if result:
                    time_slot = str(result[0]).strip('"')
                    print(f"   🧠 MeTTa suggested time slot: {time_slot}")
                else:
                    print("   ⚠️ No result from MeTTa time slot query")
        except Exception as e:
            print(f"   ❌ MeTTa time slot test failed: {e}")
        
        # Test dependency checking
        print("\n🔗 Testing dependency checking...")
        try:
            if scheduler.metta_engine:
                # Test independent task
                scheduler.metta_engine.run(f'(= (independent-task "{high_urgency_task.id}"))')
                can_schedule_result = scheduler.metta_engine.run(f'(can-schedule "{high_urgency_task.id}")')
                if can_schedule_result:
                    print(f"   🧠 MeTTa dependency check: {can_schedule_result[0]}")
                else:
                    print("   ⚠️ No result from MeTTa dependency query")
        except Exception as e:
            print(f"   ❌ MeTTa dependency test failed: {e}")
        
        print("\n✅ MeTTa integration tests completed!")
    else:
        print("❌ MeTTa engine not available - tests skipped")
        print("   Make sure 'hyperon' package is installed: pip install hyperon")
    
    print("\n" + "=" * 60)
    print("🏁 Test completed")

if __name__ == "__main__":
    test_metta_integration()
