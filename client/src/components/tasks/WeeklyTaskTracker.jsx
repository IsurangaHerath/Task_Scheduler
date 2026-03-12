import { useState, useEffect, useCallback } from 'react';
import weeklyService from '../../services/weeklyService';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStartDate(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function formatDateRange(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

function WeeklyTaskTracker() {
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState({ completed: 0, missed: 0, total: 0, completionRate: 0 });
    const [weekStart, setWeekStart] = useState(getWeekStartDate());
    const [newTaskName, setNewTaskName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [tasksResponse, progressResponse] = await Promise.all([
                weeklyService.getTasksWithCompletions(weekStart),
                weeklyService.getWeeklyProgress(weekStart)
            ]);
            setTasks(tasksResponse.data);
            setProgress(progressResponse.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching weekly tasks:', err);
            setError('Failed to load weekly tasks');
        } finally {
            setLoading(false);
        }
    }, [weekStart]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;

        try {
            await weeklyService.createTask(newTaskName.trim());
            setNewTaskName('');
            fetchData();
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await weeklyService.deleteTask(taskId);
            fetchData();
        } catch (err) {
            console.error('Error deleting task:', err);
            setError('Failed to delete task');
        }
    };

    const handleToggleDay = async (taskId, dayIndex) => {
        try {
            await weeklyService.toggleCompletion(taskId, dayIndex, weekStart);
            fetchData();
        } catch (err) {
            console.error('Error toggling completion:', err);
            setError('Failed to update task');
        }
    };

    const goToPreviousWeek = () => {
        const current = new Date(weekStart);
        current.setDate(current.getDate() - 7);
        setWeekStart(current.toISOString().split('T')[0]);
    };

    const goToNextWeek = () => {
        const current = new Date(weekStart);
        current.setDate(current.getDate() + 7);
        setWeekStart(current.toISOString().split('T')[0]);
    };

    const goToCurrentWeek = () => {
        setWeekStart(getWeekStartDate());
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading weekly tasks...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Weekly Task Tracker</h2>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={goToCurrentWeek}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                            This Week
                        </button>
                        
                        <button
                            onClick={goToNextWeek}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        {formatDateRange(weekStart)}
                    </span>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAddTask} className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            placeholder="Enter new task name..."
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={!newTaskName.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                        >
                            Add Task
                        </button>
                    </div>
                </form>

                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No weekly tasks yet. Add your first task above!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Task</th>
                                    {DAYS_OF_WEEK.map((day, index) => (
                                        <th key={day} className="px-3 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            {day}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">
                                            {task.name}
                                        </td>
                                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                                            const completion = task.completions?.[dayIndex];
                                            const isCompleted = completion?.completed;
                                            
                                            return (
                                                <td key={dayIndex} className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleDay(task.id, dayIndex)}
                                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                            isCompleted
                                                                ? 'bg-green-500 border-green-500 text-white'
                                                                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                                                        }`}
                                                    >
                                                        {isCompleted && (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete task"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Weekly Progress</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{progress.completed}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">{progress.missed}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Missed</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progress.completionRate}%</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Completion Rate</div>
                    </div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress.completionRate}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default WeeklyTaskTracker;
