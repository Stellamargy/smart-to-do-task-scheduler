from datetime import datetime, timedelta
from .extension import db
from server.models import Task  
from .app import app
def seed_tasks():
    
    with app.app_context():
        # Clear existing data
        # db.drop_all()
        # db.create_all()
        # Create sample tasks
        task1 = Task(
            task_description="Set up project structure",
            deadline=datetime.now() + timedelta(days=2),
            status="Incomplete",
            level_priority="High"
        )

        task2 = Task(
            task_description="Create database models",
            deadline=datetime.now() + timedelta(days=4),
            status="Incomplete",
            level_priority="High"
        )

        task3 = Task(
            task_description="Implement task scheduler",
            deadline=datetime.now() + timedelta(days=7),
            status="Incomplete",
            level_priority="Medium"
        )

        task4 = Task(
            task_description="Write documentation",
            deadline=datetime.now() + timedelta(days=10),
            status="Incomplete",
            level_priority="Low"
        )

        # Set dependencies
        # task2 depends on task1
        task2.dependencies.append(task1)

        # task3 depends on task2
        task3.dependencies.append(task2)

        # task4 depends on task3
        task4.dependencies.append(task3)

        # Add tasks to session
        db.session.add_all([task1, task2, task3, task4])

        # Commit to DB
        db.session.commit()
        print(" Seed data inserted successfully!")

if __name__ == "__main__":
    seed_tasks()
