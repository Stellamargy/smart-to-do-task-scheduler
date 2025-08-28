# Smart To-Do Task Scheduler - Backend

## Overview

The backend is a Flask-based REST API that powers an intelligent task scheduling system using MeTTa (Meta Type Theory) logic for automatic task scheduling. It provides advanced dependency management, priority-based scheduling, and real-time schedule optimization.

## Key Features

### 🧠 MeTTa-Powered Intelligence
- **Automatic Task Scheduling**: Uses MeTTa logic engine for intelligent task scheduling
- **Dependency-Aware Scheduling**: Tasks with completed or overdue dependencies are automatically scheduled
- **Priority-Based Optimization**: Higher priority tasks get optimal time slots
- **Real-time Rescheduling**: Tasks are automatically rescheduled when changes occur

### 📅 Advanced Scheduling Features
- **Timezone-Aware**: Handles user timezones for accurate local scheduling
- **Conflict Resolution**: Prevents scheduling conflicts with smart collision detection
- **Proportional Time Allocation**: Fairly distributes time when multiple tasks compete for deadlines
- **Context Switching Minimization**: Groups similar tasks to improve efficiency

### 🔗 Dependency Management
- **Immediate Dependency Validation**: Tasks can only depend on their immediate parent
- **Overdue Dependency Handling**: Dependent tasks can be scheduled even if parent tasks are overdue
- **Circular Dependency Prevention**: Validates dependencies to prevent infinite loops
- **Automatic Unlocking**: When tasks complete, dependent tasks are automatically scheduled

## Tech Stack

- **Framework**: Flask 2.3.3
- **Database**: MongoDB with MongoEngine ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Logic Engine**: MeTTa (Meta Type Theory) for scheduling algorithms
- **Timezone**: pytz for timezone handling
- **Validation**: Marshmallow for request/response validation

## Prerequisites

- Python 3.8 or higher
- MongoDB (local or cloud instance)
- pip (Python package manager)

## Installation & Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd smart-to-do-task-scheduler/backend
```

### 2. Create Virtual Environment (Recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/task_scheduler
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_scheduler

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### 5. MongoDB Setup
- **Local MongoDB**: Install and start MongoDB service
- **MongoDB Atlas**: Create a cluster and get connection string

## Running the Backend

### Development Mode
```bash
# Method 1: Using Flask development server
python run.py

# Method 2: Using Flask CLI
flask run

# Method 3: Using development server script
python dev_server.py
```

### Windows Batch Script
```bash
# For Windows users
start.bat
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires JWT)

### Tasks
- `GET /api/tasks` - Get all user tasks (triggers auto-scheduling)
- `GET /api/tasks/scheduled` - Get MeTTa-scheduled tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task (triggers rescheduling)
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/{id}` - Get specific task
- `GET /api/tasks/health` - Health check

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read

## Automatic Scheduling Triggers

The MeTTa scheduling engine automatically runs in these scenarios:

1. **Task Fetch** (`GET /api/tasks`): Schedules any unscheduled or newly schedulable tasks
2. **Task Creation** (`POST /api/tasks`): Reschedules all user tasks to accommodate the new task
3. **Task Update** (`PUT /api/tasks/{id}`): Reschedules when priority, deadline, dependency, or status changes
4. **Task Completion**: Unlocks dependent tasks and reschedules them immediately
5. **Task Save**: Background scheduling through model hooks

## MeTTa Logic Features

### Dependency Rules
```metta
;; A task can be scheduled if its immediate dependency is completed OR overdue
(= (can-schedule $task-id)
   (and (depends-on $task-id $dependency-id)
        (or (task-completed $dependency-id)
            (task-overdue $dependency-id))))
```

### Priority-Based Time Allocation
- **Critical/Urgent (4-5)**: Early morning slots (9:00 AM)
- **High Priority (3)**: Morning slots (10:00 AM)
- **Medium Priority (2)**: Midday slots (12:00 PM)
- **Low Priority (1)**: Afternoon slots (2:00 PM)

### Smart Features
- **Gap-Based Scheduling**: Finds optimal time gaps between existing tasks
- **Deadline Pressure**: Automatically adjusts scheduling when deadlines approach
- **Time Compression**: Reduces buffer time for urgent tasks
- **Proportional Allocation**: Fairly distributes time when multiple tasks compete

## Database Models

### Task Model
```python
class Task(Document):
    title = StringField(required=True)
    description = StringField()
    notes = StringField()
    dependency = ReferenceField('self')  # Immediate parent task
    deadline = DateTimeField(required=True)
    estimated_duration = FloatField(required=True)  # Hours
    priority = IntField(1-5)  # 1=low, 5=critical
    start_time = DateTimeField()  # Auto-calculated
    end_time = DateTimeField()    # Auto-calculated
    status = StringField()  # pending, in_progress, completed, overdue
    user = ReferenceField('User')
```

### User Model
```python
class User(Document):
    name = StringField(required=True)
    email = StringField(required=True, unique=True)
    password = StringField(required=True)  # Hashed with bcrypt
```

## Testing & Development

### Seed Data
Generate test data for development:
```bash
python simple_seed.py
```

### Health Check
```bash
curl http://localhost:5000/api/tasks/health
```

### View Logs
The backend provides detailed logging for debugging:
- 🔄 Auto-scheduling operations
- 📅 MeTTa logic decisions
- 🔒 Dependency validations
- ⚠️ Error handling
- 🌍 Timezone operations

## Architecture

### Key Components

1. **Routes** (`app/routes/`):
   - `tasks.py`: Task CRUD operations and scheduling triggers
   - `auth.py`: Authentication and user management
   - `notifications.py`: Notification system

2. **Models** (`app/models/`):
   - `task.py`: Task model with scheduling logic
   - `user.py`: User model with authentication
   - `notification.py`: Notification model

3. **Services** (`app/services/`):
   - `scheduler.py`: Core MeTTa scheduling engine
   - `notification_service.py`: Notification management
   - `metta_service.py`: MeTTa logic interface

4. **MeTTa Logic** (`metta/scheduler.metta`):
   - Declarative scheduling rules
   - Dependency validation logic
   - Priority and urgency calculations

### Request Flow
1. **Client Request** → Flask Route
2. **Authentication** → JWT Validation
3. **Data Validation** → Marshmallow Schemas
4. **Business Logic** → Service Layer
5. **MeTTa Engine** → Automatic Scheduling
6. **Database** → MongoDB via MongoEngine
7. **Response** → JSON with scheduled tasks

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   ```bash
   # Check if MongoDB is running
   # Update MONGODB_URI in .env
   ```

2. **Import Errors**:
   ```bash
   # Ensure virtual environment is activated
   # Reinstall dependencies: pip install -r requirements.txt
   ```

3. **JWT Errors**:
   ```bash
   # Check JWT_SECRET_KEY in .env
   # Ensure it's a secure random string
   ```

4. **Scheduling Not Working**:
   - Check server logs for MeTTa errors
   - Verify tasks have valid deadlines and durations
   - Ensure user timezone is correctly set

### Debug Mode
Enable detailed logging:
```python
# In run.py or dev_server.py
app.config['DEBUG'] = True
```

## Production Deployment

### Environment Variables
```env
FLASK_ENV=production
FLASK_DEBUG=False
MONGODB_URI=mongodb+srv://prod-user:password@production-cluster.mongodb.net/prod_db
JWT_SECRET_KEY=super-secure-production-key
```

### WSGI Server
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

## API Documentation

For detailed API documentation with request/response examples, use tools like:
- Postman collection
- Swagger/OpenAPI (can be added)
- Thunder Client (VS Code extension)

## Contributing

1. Follow PEP 8 style guidelines
2. Add proper error handling and logging
3. Update tests for new features
4. Document MeTTa logic changes
5. Ensure timezone compatibility

## License

This project is part of the Smart To-Do Task Scheduler application.
