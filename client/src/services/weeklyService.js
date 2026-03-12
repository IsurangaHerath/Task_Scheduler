import api from './api';

export const weeklyService = {
    getAllTasks() {
        return api.get('/weekly/tasks');
    },

    getTasksWithCompletions(weekStart) {
        return api.get('/weekly/tasks-with-completions', { params: { weekStart } });
    },

    getWeeklyProgress(weekStart) {
        return api.get('/weekly/progress', { params: { weekStart } });
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
