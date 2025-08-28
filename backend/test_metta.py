#!/usr/bin/env python3
"""
Test script for MeTTa integration in the task scheduler.
This script tests both MeTTa-available and fallback scenarios.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, timedelta
import pytz

# Mock Task class for testing
class MockTask:
    def __init__(self, id, title, priority, estimated_duration, deadline, status='pending', dependency=None):
        self.id = id
        self.title = title
        self.priority = priority
        self.estimated_duration = estimated_duration
        self.deadline = deadline
        self.status = status
        self.dependency = dependency
        self.start_time = None
        self.end_time = None
    
    def can_be_scheduled(self):
        if not self.dependency:
            return True
        return self.dependency.status in ['completed', 'overdue']

def test_metta_integration():
    """Test the scheduler with and without MeTTa"""
    print("🧪 Testing MeTTa Integration in Task Scheduler")
    print("=" * 50)
    
    try:
        from app.services.scheduler import TaskScheduler, METTA_AVAILABLE
        
        # Test scheduler initialization
        print(f"📦 MeTTa Available: {METTA_AVAILABLE}")
        
        # Create scheduler with test timezone
        current_time = datetime.now(pytz.timezone('UTC'))
        scheduler = TaskScheduler(
            deadline_weight=0.6,
            priority_weight=0.4,
            current_time=current_time,
            user_timezone='UTC'
        )
        
        print(f"✅ Scheduler initialized successfully")
        print(f"🧠 MeTTa loaded: {scheduler.metta_loaded}")
        print(f"📁 MeTTa file path: {scheduler.metta_file_path}")
        
        # Create test tasks
        task1 = MockTask(
            id="1",
            title="High Priority Task",
            priority=5,
            estimated_duration=2.0,
            deadline=current_time + timedelta(hours=6),
            status='pending'
        )
        
        task2 = MockTask(
            id="2", 
            title="Medium Priority Task",
            priority=3,
            estimated_duration=1.5,
            deadline=current_time + timedelta(hours=8),
            status='pending'
        )
        
        task3 = MockTask(
            id="3",
            title="Low Priority Task", 
            priority=1,
            estimated_duration=3.0,
            deadline=current_time + timedelta(hours=12),
            status='pending'
        )
        
        # Test urgency calculation
        print("\n🎯 Testing Urgency Calculation:")
        for task in [task1, task2, task3]:
            urgency = scheduler.calculate_urgency_score(task)
            print(f"   {task.title}: {urgency:.3f} (Priority: {task.priority})")
        
        # Test optimal time finding
        print("\n⏰ Testing Optimal Time Finding:")
        optimal_time = scheduler.find_optimal_start_time_with_metta(task1, [task2, task3])
        print(f"   Optimal time for '{task1.title}': {optimal_time}")
        
        # Test proportional allocation
        print("\n📊 Testing Proportional Allocation:")
        available_time = 6.0  # 6 hours available
        allocated = scheduler.allocate_time_proportionally([task1, task2, task3])
        
        if allocated:
            for alloc in allocated:
                task = alloc['task']
                duration = alloc['allocated_duration']
                print(f"   {task.title}: {duration:.1f}h allocated")
        
        print(f"\n✅ All tests completed successfully!")
        
        if METTA_AVAILABLE and scheduler.metta_loaded:
            print("🧠 MeTTa integration is working properly!")
        else:
            print("🔄 Using Python fallback (MeTTa not available)")
            print("💡 To enable MeTTa, follow WSL_METTA_SETUP.md")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure you're running from the backend directory")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

def test_metta_knowledge_base():
    """Test MeTTa knowledge base file"""
    print("\n📖 Testing MeTTa Knowledge Base:")
    print("-" * 30)
    
    metta_file = os.path.join(os.path.dirname(__file__), 'metta', 'scheduler.metta')
    
    if os.path.exists(metta_file):
        print(f"✅ MeTTa file found: {metta_file}")
        
        with open(metta_file, 'r') as f:
            content = f.read()
            
        # Count key MeTTa constructs
        lines = content.split('\n')
        rule_count = len([line for line in lines if line.strip().startswith('(=')])
        function_count = len([line for line in lines if line.strip().startswith('(:')])
        comment_count = len([line for line in lines if line.strip().startswith(';;')])
        
        print(f"📏 File size: {len(content)} characters")
        print(f"📏 Total lines: {len(lines)}")
        print(f"🔧 Function definitions: {function_count}")
        print(f"📐 Rules: {rule_count}")
        print(f"💬 Comments: {comment_count}")
        
        # Check for key functions
        key_functions = [
            'optimal-time-slot',
            'calculate-urgency',
            'proportional-time-allocation',
            'resolve-time-conflict',
            'can-schedule'
        ]
        
        print(f"\n🔍 Key functions present:")
        for func in key_functions:
            if func in content:
                print(f"   ✅ {func}")
            else:
                print(f"   ❌ {func}")
                
    else:
        print(f"❌ MeTTa file not found: {metta_file}")

if __name__ == "__main__":
    test_metta_integration()
    test_metta_knowledge_base()
    
    print(f"\n🎉 Testing complete!")
    print(f"📋 Next steps:")
    print(f"   1. Install WSL if not already installed")
    print(f"   2. Follow WSL_METTA_SETUP.md to install MeTTa")
    print(f"   3. Run this test again to verify MeTTa integration")
    print(f"   4. Start the backend server to test full functionality")
