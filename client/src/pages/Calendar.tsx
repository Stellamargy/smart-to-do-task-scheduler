import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addDays, 
  subDays,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  parseISO
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const { tasks, toggleTaskComplete } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.deadline && isSameDay(parseISO(task.deadline), date)
    );
  };

  // Task Event Component
  const TaskEvent = ({ task, isCompact = false }) => {
    const priorityColors = {
      high: 'bg-priority-high/90 text-priority-high-foreground border-l-priority-high hover:bg-priority-high',
      medium: 'bg-priority-medium/90 text-priority-medium-foreground border-l-priority-medium hover:bg-priority-medium',
      low: 'bg-priority-low/90 text-priority-low-foreground border-l-priority-low hover:bg-priority-low'
    };

    const statusStyles = task.status === 'completed' 
      ? 'opacity-70 line-through bg-success/30 text-success-foreground border-l-success hover:bg-success/40' 
      : priorityColors[task.priority];

    return (
      <div
        className={`
          p-2 mb-1 rounded-r text-xs cursor-pointer transition-all hover:shadow-sm border-l-4 font-medium
          ${statusStyles}
          ${isCompact ? 'truncate py-1' : 'min-h-[2rem]'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskComplete(task.id);
        }}
        title={`${task.title} - ${task.description || 'No description'} (${task.priority} priority)`}
      >
        <div className="font-medium truncate leading-tight">{task.title}</div>
        {!isCompact && task.description && (
          <div className="text-xs opacity-80 truncate mt-0.5 leading-tight">{task.description}</div>
        )}
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="h-full">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 h-32 border-b">
              {week.map(day => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      border-r p-2 overflow-hidden hover:bg-muted/20 cursor-pointer
                      ${!isCurrentMonth ? 'text-muted-foreground bg-muted/10' : ''}
                      ${isDayToday ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
                    `}
                  >
                    <div className={`
                      text-sm mb-1 ${isDayToday ? 'font-bold text-primary' : ''}
                    `}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayTasks.slice(0, 4).map(task => (
                        <TaskEvent key={task.id} task={task} isCompact />
                      ))}
                      {dayTasks.length > 4 && (
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                          +{dayTasks.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Week View Component
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart)
    });

    return (
      <div className="h-full">
        {/* Week headers */}
        <div className="grid grid-cols-8 border-b bg-muted/30">
          <div className="p-3 border-r"></div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-3 text-center border-r">
              <div className="text-sm font-medium">{format(day, 'EEE')}</div>
              <div className={`text-lg ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="grid grid-cols-8 border-b h-16">
              <div className="p-2 border-r bg-muted/20 text-xs text-muted-foreground">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
              {weekDays.map(day => {
                const dayTasks = getTasksForDate(day);
                return (
                  <div key={day.toISOString()} className="border-r p-1 hover:bg-muted/10 relative">
                    {/* Display tasks in different time slots */}
                    {hour >= 8 && hour <= 18 && dayTasks.length > 0 && (
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task, idx) => (
                          <TaskEvent 
                            key={task.id} 
                            task={task} 
                            isCompact={dayTasks.length > 1}
                          />
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-1 py-0.5">
                            +{dayTasks.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View Component
  const DayView = () => {
    const dayTasks = getTasksForDate(currentDate);

    return (
      <div className="h-full">
        {/* Day header */}
        <div className="border-b bg-muted/30 p-4">
          <div className="text-center">
            <div className="text-sm font-medium">{format(currentDate, 'EEEE')}</div>
            <div className={`text-2xl ${isToday(currentDate) ? 'font-bold text-primary' : ''}`}>
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Time column */}
          <div className="w-20 border-r bg-muted/20">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b p-2 text-xs text-muted-foreground">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
            ))}
          </div>

          {/* Day content */}
          <div className="flex-1">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b p-2 hover:bg-muted/10">
                {hour >= 6 && hour <= 22 && dayTasks.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <TaskEvent key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground">
            Manage your tasks in calendar view
          </p>
        </div>
        
        <Button className="bg-gradient-to-r from-primary to-primary-light hover:shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={goToToday}
                className="min-w-20"
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <CardTitle className="ml-4">{getTitle()}</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="h-[600px] border rounded-lg overflow-hidden">
            {viewMode === 'month' && <MonthView />}
            {viewMode === 'week' && <WeekView />}
            {viewMode === 'day' && <DayView />}
          </div>
        </CardContent>
      </Card>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {tasks.filter(t => t.deadline).length}
            </div>
            <div className="text-sm text-muted-foreground">Total Scheduled</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {tasks.filter(t => t.deadline && t.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-priority-high">
              {tasks.filter(t => t.deadline && t.priority === 'high').length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}