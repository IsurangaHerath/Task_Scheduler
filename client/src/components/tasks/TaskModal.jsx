import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, Bell, Save } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { format } from 'date-fns';

const TaskModal = ({ isOpen, onClose, task = null }) => {
    const { createTask, updateTask } = useTasks();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        priority: 'medium',
        category: 'general',
        reminderEnabled: true
    });
    const [errors, setErrors] = useState({});

    // Populate form if editing existing task
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
                time: task.time || '09:00',
                priority: task.priority || 'medium',
                category: task.category || 'general',
                reminderEnabled: task.reminderEnabled ?? true
            });
        } else {
            // Reset form for new task
            setFormData({
                title: '',
                description: '',
                dueDate: format(new Date(), 'yyyy-MM-dd'),
                time: '09:00',
                priority: 'medium',
                category: 'general',
                reminderEnabled: true
            });
        }
        setErrors({});
    }, [task, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const taskData = {
                ...formData,
                dueDate: new Date(formData.dueDate)
            };

            let result;
            if (task) {
                result = await updateTask(task._id, taskData);
            } else {
                result = await createTask(taskData);
            }

            if (result.success) {
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-background-card rounded-2xl shadow-hover overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
                        <h2 className="text-xl font-semibold text-text-primary">
                            {task ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="label">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                                className={`input ${errors.title ? 'input-error' : ''}`}
                            />
                            {errors.title && (
                                <p className="text-priority-high text-sm mt-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="label">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add a description (optional)"
                                rows={3}
                                className="input resize-none"
                            />
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dueDate" className="label">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Due Date *
                                </label>
                                <input
                                    type="date"
                                    id="dueDate"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className={`input ${errors.dueDate ? 'input-error' : ''}`}
                                />
                                {errors.dueDate && (
                                    <p className="text-priority-high text-sm mt-1">{errors.dueDate}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="time" className="label">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Priority and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priority" className="label">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="category" className="label">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Category
                                </label>
                                <input
                                    type="text"
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g., Work, Personal"
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Reminder toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="reminderEnabled"
                                name="reminderEnabled"
                                checked={formData.reminderEnabled}
                                onChange={handleChange}
                                className="checkbox-custom"
                            />
                            <label htmlFor="reminderEnabled" className="flex items-center gap-2 text-text-secondary">
                                <Bell className="w-4 h-4" />
                                Enable reminder
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner" />
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Save className="w-5 h-5" />
                                        {task ? 'Update Task' : 'Create Task'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TaskModal;
