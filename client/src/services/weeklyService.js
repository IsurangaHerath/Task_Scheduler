import api from './api';

// Helper to unwrap API response
const unwrap = (response) => response.data;

export const weeklyService = {
    getAllTasks() {
        return api.get('/weekly/tasks').then(unwrap);
    },

    getTasksWithCompletions(weekStart) {
        return api.get('/weekly/tasks-with-completions', { params: { weekStart } }).then(unwrap);
    },

    getWeeklyProgress(weekStart) {
        return api.get('/weekly/progress', { params: { weekStart } }).then(unwrap);
    },

    createTask(name) {
        return api.post('/weekly/tasks', { name });
    },

    updateTask(id, name) {
        return api.put(`/weekly/tasks/${id}`, { name });
    },

    deleteTask(id) {
        return api.delete(`/weekly/tasks/${id}`);
    },

    toggleCompletion(id, dayOfWeek, weekStart) {
        return api.post(`/weekly/tasks/${id}/toggle`, { dayOfWeek, weekStart });
    }
};

export default weeklyService;
