# Smart Task Scheduler with Python-MeTTa Integration

A comprehensive task management system featuring intelligent scheduling powered by Python and MeTTa's reasoning engine, with a modern React frontend and MongoDB persistence.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based secure authentication with registration and login
- **Task Management**: Create, edit, delete tasks with rich metadata (priority, deadline, duration, dependencies)
- **Intelligent Scheduling**: MeTTa-powered automatic schedule generation and optimization
- **Dependency Management**: Visual dependency chains with circular reference detection
- **Real-time Updates**: Live task status updates and schedule recomputation
- **Multi-user Support**: Isolated task spaces for different users

### Advanced Features
- **MeTTa Integration**: Logical reasoning for optimal task scheduling
- **Dependency Validation**: Prevent circular dependencies and validate task relationships
- **Schedule Optimization**: Multiple optimization strategies (urgent, important, balanced)
- **Critical Path Analysis**: Identify bottlenecks and optimize workflow
- **MongoDB Persistence**: Scalable data storage with proper indexing
- **RESTful API**: Clean API design for frontend-backend communication

## 🏗️ Architecture

```
smart-to-do-task-scheduler/
├── backend/                    # Python Flask API with MeTTa integration
│   ├── app/
│   │   ├── models/            # MongoDB data models
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic & MeTTa integration
│   ├── metta_space/           # MeTTa knowledge base files
│   └── requirements.txt       # Python dependencies
├── client/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages
│   │   ├── services/          # API integration
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript definitions
│   └── package.json           # Node.js dependencies
└── README.md                  # This file
```

## 🛠️ Tech Stack

### Backend
- **Python 3.8+** - Core language
- **Flask** - Web framework
- **MeTTa (Hyperon)** - Reasoning engine for intelligent scheduling
- **MongoDB** - Document database
- **JWT** - Authentication
- **Marshmallow** - Request/response validation

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

5. **Initialize database**:
   ```bash
   python setup_db.py
   ```

6. **Run backend server**:
   ```bash
   python run.py
   ```
   
   Backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with backend API URL
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
MONGODB_URI=mongodb://localhost:27017/task_scheduler
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
METTA_SPACE_PATH=./metta_space/
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Task Management Endpoints
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - Get user tasks (with filtering)
- `GET /api/tasks/{id}` - Get specific task
- `PATCH /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/stats` - Get task statistics

### Scheduling Endpoints
- `GET /api/schedule` - Get current schedule
- `POST /api/schedule/generate` - Generate new schedule
- `POST /api/schedule/optimize` - Optimize schedule
- `GET /api/schedule/dependencies` - Get dependency analysis

## 🧠 MeTTa Integration

The system uses MeTTa for intelligent task scheduling with the following capabilities:

### Knowledge Base Features
- **Task Representation**: Store tasks with metadata in logical format
- **Dependency Rules**: Validate and resolve task dependencies
- **Priority Algorithms**: Compute priority scores based on multiple factors
- **Schedule Generation**: Create optimal schedules using reasoning

### Scheduling Rules
```metta
; Priority calculation
(= (calculate-priority-score $task)
   (+ (* (priority-weight (get-task-priority $task)) 10)
      (* (get-deadline-urgency $task) 5)
      (get-dependency-weight $task)))

; Dependency validation
(= (validate-dependencies $task)
   (not (has-circular-dependency $task $task (list))))
```

## 🚀 Usage Examples

### Creating a Task with Dependencies
```typescript
const newTask = await taskService.createTask({
  title: "Deploy to production",
  description: "Deploy the application to production environment",
  priority: "high",
  deadline: "2024-01-15T10:00:00Z",
  estimated_duration: 90,
  dependencies: ["task-id-1", "task-id-2"]
});
```

### Generating an Optimized Schedule
```typescript
const schedule = await scheduleService.optimizeSchedule({
  focus_area: "urgent",
  working_hours: { start: 9, end: 17 },
  max_daily_hours: 8
});
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd client
npm test
```

## 📈 Performance & Scalability

### Database Optimization
- MongoDB indexes on user, status, priority, and deadline fields
- Efficient query patterns for task retrieval
- Pagination support for large task lists

### MeTTa Performance
- Optimized knowledge base structure
- Cached schedule computation results
- Incremental updates for task changes

### Frontend Optimization
- Component lazy loading
- Efficient state management
- Optimistic UI updates

## 🔒 Security

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Token expiration and refresh

### API Security
- CORS configuration
- Request validation with Marshmallow
- User isolation for data access

## 🚀 Deployment

### Production Setup

#### Backend (Docker)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
```

#### Frontend (Docker)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Variables for Production
- Use strong JWT secrets
- Configure MongoDB Atlas for cloud deployment
- Set proper CORS origins
- Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices for frontend
- Use Python type hints for backend
- Write tests for new features
- Update documentation for API changes

## 📚 Learning Resources

### MeTTa/Hyperon
- [Hyperon Documentation](https://github.com/trueagi-io/hyperon-experimental)
- [MeTTa Language Guide](https://github.com/trueagi-io/hyperon-experimental/blob/main/docs/metta_lang.md)

### Technologies Used
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

2. **MeTTa Import Errors**
   - Install hyperon: `pip install hyperon`
   - Check Python version compatibility

3. **CORS Issues**
   - Verify CORS_ORIGINS in backend .env
   - Check frontend API URL configuration

4. **Authentication Failures**
   - Verify JWT_SECRET_KEY is set
   - Check token expiration
   - Clear browser localStorage if needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TrueAGI](https://github.com/trueagi-io) for the Hyperon/MeTTa reasoning engine
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- The open-source community for the amazing tools and libraries

---

**Happy Task Scheduling! 🎯**
