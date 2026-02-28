import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import taskService from '../services/taskService';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};

export const TaskProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        search: '',
        sort: 'dueDate'
    });

    // Fetch all tasks
    const fetchTasks = useCallback(async (filterParams = {}) => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            setError(null);

            const params = { ...filters, ...filterParams };
            const response = await taskService.getTasks(params);

            if (response.success) {
                setTasks(response.data.tasks);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch tasks';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, filters]);

    // Fetch today's tasks
    const fetchTodayTasks = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await taskService.getTodayTasks();
            if (response.success) {
                setTodayTasks(response.data.tasks);
            }
        } catch (err) {
            console.error('Failed to fetch today tasks:', err);
        }
    }, [isAuthenticated]);

    // Fetch upcoming tasks
    const fetchUpcomingTasks = useCallback(async (days = 7) => {
        if (!isAuthenticated) return;

        try {
            const response = await taskService.getUpcomingTasks(days);
            if (response.success) {
                setUpcomingTasks(response.data.tasks);
            }
        } catch (err) {
            console.error('Failed to fetch upcoming tasks:', err);
        }
    }, [isAuthenticated]);

    // Fetch completed tasks
    const fetchCompletedTasks = useCallback(async (limit = 50) => {
        if (!isAuthenticated) return;

        try {
            const response = await taskService.getCompletedTasks(limit);
            if (response.success) {
                setCompletedTasks(response.data.tasks);
            }
        } catch (err) {
            console.error('Failed to fetch completed tasks:', err);
        }
    }, [isAuthenticated]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await taskService.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, [isAuthenticated]);

    // Create new task
    const createTask = async (taskData) => {
        try {
            setLoading(true);
            const response = await taskService.createTask(taskData);

            if (response.success) {
                const newTask = response.data.task;
                setTasks((prev) => [...prev, newTask]);

                // Update relevant lists
                if (isToday(new Date(newTask.dueDate))) {
                    setTodayTasks((prev) => [...prev, newTask]);
                }

                toast.success('Task created successfully! ✅');
                return { success: true, task: newTask };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create task';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Update task
    const updateTask = async (id, taskData) => {
        try {
            setLoading(true);
            const response = await taskService.updateTask(id, taskData);

            if (response.success) {
                const updatedTask = response.data.task;

                // Update in all lists
                setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
                setTodayTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
                setUpcomingTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
                setCompletedTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));

                toast.success('Task updated successfully');
                return { success: true, task: updatedTask };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update task';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Delete task
    const deleteTask = async (id) => {
        try {
            setLoading(true);
            const response = await taskService.deleteTask(id);

            if (response.success) {
                // Remove from all lists
                setTasks((prev) => prev.filter((t) => t._id !== id));
                setTodayTasks((prev) => prev.filter((t) => t._id !== id));
                setUpcomingTasks((prev) => prev.filter((t) => t._id !== id));
                setCompletedTasks((prev) => prev.filter((t) => t._id !== id));

                toast.success('Task deleted');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete task';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Toggle task completion
    const toggleComplete = async (id) => {
        try {
            const response = await taskService.toggleComplete(id);

            if (response.success) {
                const updatedTask = response.data.task;

                // Update in all lists
                setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
                setTodayTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
                setUpcomingTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));

                // Move between completed/pending lists
                if (updatedTask.status === 'completed') {
                    setCompletedTasks((prev) => [updatedTask, ...prev]);
                    toast.success('Task completed! 🎉');
                } else {
                    setCompletedTasks((prev) => prev.filter((t) => t._id !== id));
                    toast.success('Task marked as pending');
                }

                return { success: true, task: updatedTask };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update task';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Reorder tasks
    const reorderTasks = async (taskOrders) => {
        try {
            const response = await taskService.reorderTasks(taskOrders);
            return { success: response.success };
        } catch (err) {
            const message = 'Failed to reorder tasks';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Bulk update tasks
    const bulkUpdate = async (taskIds, updates) => {
        try {
            setLoading(true);
            const response = await taskService.bulkUpdate(taskIds, updates);

            if (response.success) {
                // Refresh tasks
                await fetchTasks();
                toast.success(`${response.data.modifiedCount} tasks updated`);
                return { success: true };
            }
        } catch (err) {
            const message = 'Failed to update tasks';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Bulk delete tasks
    const bulkDelete = async (taskIds) => {
        try {
            setLoading(true);
            const response = await taskService.bulkDelete(taskIds);

            if (response.success) {
                // Remove from all lists
                setTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));
                setTodayTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));
                setUpcomingTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));
                setCompletedTasks((prev) => prev.filter((t) => !taskIds.includes(t._id)));

                toast.success(`${response.data.deletedCount} tasks deleted`);
                return { success: true };
            }
        } catch (err) {
            const message = 'Failed to delete tasks';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Get calendar tasks
    const getCalendarTasks = async (start, end) => {
        try {
            const response = await taskService.getCalendarTasks(start, end);
            if (response.success) {
                return response.data.tasks;
            }
            return [];
        } catch (err) {
            console.error('Failed to fetch calendar tasks:', err);
            return [];
        }
    };

    // Refresh all data
    const refreshAll = async () => {
        await Promise.all([
            fetchTasks(),
            fetchTodayTasks(),
            fetchUpcomingTasks(),
            fetchCompletedTasks(),
            fetchStats()
        ]);
    };

    // Helper function to check if date is today
    const isToday = (date) => {
        const today = new Date();
        const checkDate = new Date(date);
        return (
            checkDate.getDate() === today.getDate() &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear()
        );
    };

    // Initial fetch when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            refreshAll();
        } else {
            // Clear data when logged out
            setTasks([]);
            setTodayTasks([]);
            setUpcomingTasks([]);
            setCompletedTasks([]);
            setStats(null);
        }
    }, [isAuthenticated]);

    const value = {
        tasks,
        todayTasks,
        upcomingTasks,
        completedTasks,
        stats,
        loading,
        error,
        filters,
        setFilters,
        fetchTasks,
        fetchTodayTasks,
        fetchUpcomingTasks,
        fetchCompletedTasks,
        fetchStats,
        createTask,
        updateTask,
        deleteTask,
        toggleComplete,
        reorderTasks,
        bulkUpdate,
        bulkDelete,
        getCalendarTasks,
        refreshAll,
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export default TaskContext;
