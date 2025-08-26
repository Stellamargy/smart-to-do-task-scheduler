# Smart Task Scheduler

**Smart Task Scheduler** is an intelligent task management web application that helps you organize, prioritize, and track tasks with support for dependencies, deadlines, and productivity insights.

## Features

- **Task Management**: Create, edit, and delete tasks with titles, descriptions, priorities, deadlines, and completion status.
- **Task Dependencies**: Link tasks together to enforce completion order and visualize dependency chains.
- **Dashboard**: View statistics such as total, completed, pending, overdue, and today’s tasks.
- **Filtering & Search**: Filter tasks by status, priority, and search by keywords.
- **Notifications**: Get alerts for upcoming deadlines, overdue tasks, and recommendations.
- **User Preferences**: Customize your profile and app settings.
- **Modern UI**: Responsive design using Radix UI, shadcn/ui, and Tailwind CSS.

## Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies:**
	```sh
	npm install
	```

2. **Run the development server:**
	```sh
	npm run dev
	```

3. **Build for production:**
	```sh
	npm run build
	```

4. **Preview production build:**
	```sh
	npm run preview
	```

## Project Structure

- `src/pages/`: Main app pages (Dashboard, Task List, Calendar, Dependencies, Notifications, Settings)
- `src/components/`: Reusable UI components
- `src/hooks/`: Custom React hooks (e.g., task management)
- `src/types/`: TypeScript type definitions
- `public/`: Static assets

## Customization

- Update theme and UI in `tailwind.config.ts` and `src/components/ui/`.
- Modify mock data and logic in `src/hooks/useTasks.ts`.

## License

MIT
