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

const TaskCard = ({ task, compact = false, onEdit }) => {
    const { toggleComplete, deleteTask } = useTasks();
    const [showMenu, setShowMenu] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const handleToggleComplete = async () => {
        setIsCompleting(true);
        await toggleComplete(task._id);
        setIsCompleting(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task._id);
        }
        setShowMenu(false);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-priority-low',
            medium: 'bg-priority-medium',
            high: 'bg-priority-high'
        };
        return colors[priority] || colors.medium;
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            low: 'badge-low',
            medium: 'badge-medium',
            high: 'badge-high'
        };
        return badges[priority] || badges.medium;
    };

    if (compact) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.status === 'completed'
                        ? 'bg-primary-light/20 border-primary-light/30'
                        : 'bg-background-card border-gray-100 hover:border-primary-light/50'
                    }`}
            >
                <button
                    onClick={handleToggleComplete}
                    disabled={isCompleting}
                    className="flex-shrink-0"
                >
                    {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                    ) : (
                        <Circle className="w-5 h-5 text-text-muted hover:text-primary-dark transition-colors" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className="text-xs text-text-muted">{task.time}</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card-hover relative ${task.status === 'completed' ? 'opacity-75' : ''
                }`}
        >
            {/* Priority indicator */}
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${getPriorityColor(task.priority)}`} />

            <div className="flex items-start gap-4 pl-3">
                {/* Complete button */}
                <button
                    onClick={handleToggleComplete}
                    disabled={isCompleting}
                    className="flex-shrink-0 mt-1"
                >
                    {task.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-status-success" />
                    ) : (
                        <Circle className="w-6 h-6 text-text-muted hover:text-primary-dark transition-colors" />
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-text-primary ${task.status === 'completed' ? 'line-through text-text-muted' : ''
                            }`}>
                            {task.title}
                        </h3>

                        {/* Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-primary-light/30 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-text-muted" />
                            </button>

                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 mt-1 w-36 bg-background-card rounded-lg shadow-hover border border-primary-light/20 overflow-hidden z-10"
                                >
                                    <button
                                        onClick={() => {
                                            onEdit && onEdit(task);
                                            setShowMenu(false);
                                        }}
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

                    {task.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        {/* Date */}
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                            <Clock className="w-4 h-4" />
                            <span>{task.time}</span>
                        </div>

                        {/* Priority badge */}
                        <span className={getPriorityBadge(task.priority)}>
                            {task.priority}
                        </span>

                        {/* Category */}
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
