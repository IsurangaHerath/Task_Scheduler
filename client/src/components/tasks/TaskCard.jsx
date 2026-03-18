import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    CheckCircle2,
    Circle,
    Clock,
    Calendar,
    Edit2,
    Trash2,
    MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';

/**
 * TaskCard Component
 * 
 * Displays a single task item with options to toggle completion, edit, or delete.
 * Supports two display modes: compact (for lists) and full (for card views).
 * 
 * @param {object} task - The task object containing all task data
 * @param {boolean} compact - If true, renders in compact mode for list views
 * @param {function} onEdit - Callback function to open edit modal
 */
const TaskCard = ({ task, compact = false, onEdit }) => {
    const { toggleComplete, deleteTask } = useTasks();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    // Handle task completion toggle with loading state
    const handleToggleComplete = async () => {
        setIsCompleting(true);
        await toggleComplete(task._id);
        setIsCompleting(false);
    };

    // Handle task deletion with confirmation dialog
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task._id);
        }
        setIsMenuOpen(false);
    };

    // Handle edit action from menu
    const handleEdit = () => {
        if (onEdit) {
            onEdit(task);
        }
        setIsMenuOpen(false);
    };

    // Get priority indicator color
    const getPriorityColorClass = (priority) => {
        const priorityColors = {
            low: 'bg-priority-low',
            medium: 'bg-priority-medium',
            high: 'bg-priority-high'
        };
        return priorityColors[priority] || priorityColors.medium;
    };

    // Get priority badge styling class
    const getPriorityBadgeClass = (priority) => {
        const priorityBadges = {
            low: 'badge-low',
            medium: 'badge-medium',
            high: 'badge-high'
        };
        return priorityBadges[priority] || priorityBadges.medium;
    };

    // Determine if task is completed
    const isCompleted = task.status === 'completed';

    // Get formatted due date
    const formattedDueDate = format(new Date(task.dueDate), 'MMM d, yyyy');

    // Determine card styling based on completion status
    const getCardBaseClasses = () => {
        if (compact) {
            return `flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCompleted
                    ? 'bg-primary-light/20 border-primary-light/30'
                    : 'bg-background-card border-gray-100 hover:border-primary-light/50'
            }`;
        }
        return `card-hover relative ${isCompleted ? 'opacity-75' : ''}`;
    };

    // Render compact version for list displays
    if (compact) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={getCardBaseClasses()}
            >
                {/* Completion Toggle Button */}
                <button
                    onClick={handleToggleComplete}
                    disabled={isCompleting}
                    className="flex-shrink-0"
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                    ) : (
                        <Circle className="w-5 h-5 text-text-muted hover:text-primary-dark transition-colors" />
                    )}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                        isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColorClass(task.priority)}`} />
                        <span className="text-xs text-text-muted">{task.time}</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Render full card version
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={getCardBaseClasses()}
        >
            {/* Priority Indicator Strip */}
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${getPriorityColorClass(task.priority)}`} />

            <div className="flex items-start gap-4 pl-3">
                {/* Completion Toggle Button */}
                <button
                    onClick={handleToggleComplete}
                    disabled={isCompleting}
                    className="flex-shrink-0 mt-1"
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-status-success" />
                    ) : (
                        <Circle className="w-6 h-6 text-text-muted hover:text-primary-dark transition-colors" />
                    )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        {/* Task Title */}
                        <h3 className={`font-semibold text-text-primary ${
                            isCompleted ? 'line-through text-text-muted' : ''
                        }`}>
                            {task.title}
                        </h3>

                        {/* Actions Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-1 hover:bg-primary-light/30 rounded-lg transition-colors"
                                aria-label="Task options"
                            >
                                <MoreVertical className="w-4 h-4 text-text-muted" />
                            </button>

                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 mt-1 w-36 bg-background-card rounded-lg shadow-hover border border-primary-light/20 overflow-hidden z-10"
                                >
                                    <button
                                        onClick={handleEdit}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-primary-light/30 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-priority-high hover:bg-priority-high/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Task Metadata */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        {/* Due Date */}
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDueDate}</span>
                        </div>

                        {/* Due Time */}
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                            <Clock className="w-4 h-4" />
                            <span>{task.time}</span>
                        </div>

                        {/* Priority Badge */}
                        <span className={getPriorityBadgeClass(task.priority)}>
                            {task.priority}
                        </span>

                        {/* Category Badge (only shown if not general) */}
                        {task.category && task.category !== 'general' && (
                            <span className="badge bg-gray-100 text-gray-600">
                                {task.category}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
