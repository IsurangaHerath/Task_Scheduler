import api from './api';

/**
 * Task Service
 * Handles all task-related API calls
 */

/**
 * Get all tasks
 * @param {Object} params - Query parameters (status, priority, category, search, sort, limit)
 * @returns {Promise} - API response
 */
const getTasks = async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
};

/**
 * Get single task by ID
 * @param {string} id - Task ID
 * @returns {Promise} - API response
 */
const getTask = async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
};

/**
 * Create new task
 * @param {Object} taskData - Task data
 * @returns {Promise} - API response
 */
const createTask = async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
};

/**
 * Update task
 * @param {string} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise} - API response
 */
const updateTask = async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
};

/**
 * Delete task
 * @param {string} id - Task ID
 * @returns {Promise} - API response
 */
const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
};

/**
 * Toggle task completion status
 * @param {string} id - Task ID
 * @returns {Promise} - API response
 */
const toggleComplete = async (id) => {
    const response = await api.patch(`/tasks/${id}/complete`);
    return response.data;
};

/**
 * Reorder tasks
 * @param {Array} taskOrders - Array of { id, order }
 * @returns {Promise} - API response
 */
const reorderTasks = async (taskOrders) => {
    const response = await api.put('/tasks/reorder', { taskOrders });
    return response.data;
};

/**
 * Get today's tasks
 * @returns {Promise} - API response
 */
const getTodayTasks = async () => {
    const response = await api.get('/tasks/today');
    return response.data;
};

/**
 * Get upcoming tasks
 * @param {number} days - Number of days to look ahead
 * @returns {Promise} - API response
 */
const getUpcomingTasks = async (days = 7) => {
    const response = await api.get('/tasks/upcoming', { params: { days } });
    return response.data;
};

/**
 * Get completed tasks
 * @param {number} limit - Maximum number of tasks to return
 * @returns {Promise} - API response
 */
const getCompletedTasks = async (limit = 50) => {
    const response = await api.get('/tasks/completed', { params: { limit } });
    return response.data;
};

/**
 * Get task statistics
 * @returns {Promise} - API response
 */
const getStats = async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
};

/**
 * Get tasks for calendar view
 * @param {string} start - Start date
 * @param {string} end - End date
 * @returns {Promise} - API response
 */
const getCalendarTasks = async (start, end) => {
    const response = await api.get('/tasks/calendar', { params: { start, end } });
    return response.data;
};

/**
 * Get tasks by date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise} - API response
 */
const getTasksByRange = async (startDate, endDate) => {
    const response = await api.get('/tasks/range', { params: { startDate, endDate } });
    return response.data;
};

/**
 * Bulk update tasks
 * @param {Array} taskIds - Array of task IDs
 * @param {Object} updates - Updates to apply
 * @returns {Promise} - API response
 */
const bulkUpdate = async (taskIds, updates) => {
    const response = await api.put('/tasks/bulk', { taskIds, updates });
    return response.data;
};

/**
 * Bulk delete tasks
 * @param {Array} taskIds - Array of task IDs
 * @returns {Promise} - API response
 */
const bulkDelete = async (taskIds) => {
    const response = await api.delete('/tasks/bulk', { data: { taskIds } });
    return response.data;
};

const taskService = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    getTodayTasks,
    getUpcomingTasks,
    getCompletedTasks,
    getStats,
    getCalendarTasks,
    getTasksByRange,
    bulkUpdate,
    bulkDelete,
};

export default taskService;
