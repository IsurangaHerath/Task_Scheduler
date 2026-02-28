import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarComponent, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskModal from '../components/tasks/TaskModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Calendar = () => {
    const { getCalendarTasks, loading } = useTasks();
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Fetch tasks for the visible date range
    const fetchEvents = useCallback(async () => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (view === 'month') {
            start.setDate(1);
            start.setMonth(start.getMonth() - 1);
            end.setMonth(end.getMonth() + 2);
            end.setDate(0);
        } else if (view === 'week') {
            start.setDate(start.getDate() - 7);
            end.setDate(end.getDate() + 14);
        } else {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() + 2);
        }

        const tasks = await getCalendarTasks(start.toISOString(), end.toISOString());

        const calendarEvents = tasks.map(task => ({
            ...task,
            start: new Date(`${task.dueDate.split('T')[0]}T${task.time}:00`),
            end: new Date(`${task.dueDate.split('T')[0]}T${task.time}:00`),
            title: task.title
        }));

        setEvents(calendarEvents);
    }, [currentDate, view, getCalendarTasks]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            low: '#A8E6CF',
            medium: '#FFD93D',
            high: '#FF6B6B'
        };
        return colors[priority] || colors.medium;
    };

    // Custom event style
    const eventStyleGetter = (event) => {
        const isCompleted = event.status === 'completed';
        return {
            style: {
                borderRadius: '6px',
                opacity: isCompleted ? 0.7 : 1,
                borderLeft: `4px solid ${getPriorityColor(event.priority)}`,
                backgroundColor: isCompleted ? '#A8E6CF' : '#fff',
                color: '#1B4332',
                display: 'block',
                padding: '2px 6px',
                fontSize: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
        };
    };

    // Handle event click
    const handleSelectEvent = (event) => {
        setSelectedTask(event);
        setShowTaskModal(true);
    };

    // Handle date/time slot selection
    const handleSelectSlot = ({ start }) => {
        setSelectedTask(null);
        setSelectedDate(start);
        setShowTaskModal(true);
    };

    // Navigate to today
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Navigate to previous period
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    // Navigate to next period
    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    // Get view title
    const getViewTitle = () => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        if (view === 'month') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (view === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
                    <p className="text-text-secondary mt-1">
                        View and manage your schedule
                    </p>
                </div>

                <button
                    onClick={() => {
                        setSelectedTask(null);
                        setSelectedDate(new Date());
                        setShowTaskModal(true);
                    }}
                    className="btn-primary flex items-center gap-2 self-start"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </button>
            </div>

            {/* Calendar Controls */}
            <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrev}
                            className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-text-secondary" />
                        </button>
                        <button
                            onClick={handleToday}
                            className="btn-secondary"
                        >
                            Today
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-text-secondary" />
                        </button>
                        <h2 className="text-lg font-semibold text-text-primary ml-2">
                            {getViewTitle()}
                        </h2>
                    </div>

                    {/* View selector */}
                    <div className="flex gap-1 bg-primary-light/20 rounded-lg p-1">
                        {['month', 'week', 'day'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === v
                                        ? 'bg-background-card text-text-primary shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calendar */}
                <div className="h-[600px] calendar-container">
                    <CalendarComponent
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={view}
                        onView={setView}
                        date={currentDate}
                        onNavigate={setCurrentDate}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        views={['month', 'week', 'day']}
                        popup
                        tooltipAccessor={(event) => `${event.title} - ${event.time}`}
                    />
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => {
                        setShowTaskModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                />
            )}
        </motion.div>
    );
};

export default Calendar;
