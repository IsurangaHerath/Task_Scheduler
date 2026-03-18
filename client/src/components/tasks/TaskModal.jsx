import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, Bell, Save } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { format } from 'date-fns';

/**
 * TaskModal Component
 * 
 * Modal dialog for creating and editing tasks.
 * Provides form validation and handles task submission to the backend.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback to close the modal
 * @param {object} task - Optional task object for edit mode
 */
const TaskModal = ({ isOpen, onClose, task = null }) => {
    const { createTask, updateTask } = useTasks();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    
    // Form state with default values
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        priority: 'medium',
        category: 'general',
        reminderEnabled: true
    });

    // Determine if we're in edit mode or create mode
    const isEditMode = task !== null;

    // Reset form when modal opens/closes or task changes
    useEffect(() => {
        if (isOpen) {
            if (task) {
                // Populate form with existing task data for editing
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
                // Reset to defaults for new task
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
            setFormErrors({});
        }
    }, [task, isOpen]);

    // Validate form fields before submission
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const taskPayload = {
                ...formData,
                dueDate: new Date(formData.dueDate)
            };

            let result;
            if (isEditMode) {
                result = await updateTask(task._id, taskPayload);
            } else {
                result = await createTask(taskPayload);
            }

            if (result.success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle input field changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error for this field if it exists
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Don't render if modal is closed
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-background-card rounded-2xl shadow-hover overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-primary-light/20">
                        <h2 className="text-xl font-semibold text-text-primary">
                            {isEditMode ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>

                    {/* Task Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title Input */}
                        <div>
                            <label htmlFor="title" className="label">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter task title"
                                className={`input ${formErrors.title ? 'input-error' : ''}`}
                            />
                            {formErrors.title && (
                                <p className="text-priority-high text-sm mt-1">{formErrors.title}</p>
                            )}
                        </div>

                        {/* Description Textarea */}
                        <div>
                            <label htmlFor="description" className="label">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Add a description (optional)"
                                rows={3}
                                className="input resize-none"
                            />
                        </div>

                        {/* Date and Time Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Due Date */}
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
                                    onChange={handleInputChange}
                                    className={`input ${formErrors.dueDate ? 'input-error' : ''}`}
                                />
                                {formErrors.dueDate && (
                                    <p className="text-priority-high text-sm mt-1">{formErrors.dueDate}</p>
                                )}
                            </div>

                            {/* Time */}
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
                                    onChange={handleInputChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Priority and Category Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority Select */}
                            <div>
                                <label htmlFor="priority" className="label">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="input"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Category Input */}
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
                                    onChange={handleInputChange}
                                    placeholder="e.g., Work, Personal"
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Reminder Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="reminderEnabled"
                                name="reminderEnabled"
                                checked={formData.reminderEnabled}
                                onChange={handleInputChange}
                                className="checkbox-custom"
                            />
                            <label htmlFor="reminderEnabled" className="flex items-center gap-2 text-text-secondary">
                                <Bell className="w-4 h-4" />
                                Enable reminder
                            </label>
                        </div>

                        {/* Form Actions */}
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
                                disabled={isSubmitting}
                                className="btn-primary flex-1"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner" />
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Save className="w-5 h-5" />
                                        {isEditMode ? 'Update Task' : 'Create Task'}
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
