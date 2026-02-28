import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Calendar } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';

const UpcomingTasks = () => {
    const { upcomingTasks, loading, fetchUpcomingTasks } = useTasks();
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        fetchUpcomingTasks(14); // Get next 14 days
    }, []);

    // Group tasks by date
    const groupedTasks = upcomingTasks.reduce((groups, task) => {
        const date = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(task);
        return groups;
    }, {});

    const handleEdit = (task) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setEditingTask(null);
    };

    // Format date for display
    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }
        return format(date, 'EEEE, MMMM d, yyyy');
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
                    <h1 className="text-2xl font-bold text-text-primary">Upcoming Tasks</h1>
                    <p className="text-text-secondary mt-1">
                        {upcomingTasks.length} tasks in the next 14 days
                    </p>
                </div>

                <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn-primary flex items-center gap-2 self-start"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </button>
            </div>

            {/* Tasks list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner spinner-lg" />
                </div>
            ) : upcomingTasks.length === 0 ? (
                <div className="card text-center py-12">
                    <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        No upcoming tasks
                    </h3>
                    <p className="text-text-secondary mb-4">
                        You have no tasks scheduled for the next 14 days
                    </p>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn-primary"
                    >
                        Schedule a task
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTasks).map(([date, tasks]) => (
                        <div key={date} className="space-y-3">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-dark" />
                                {formatDateHeader(date)}
                                <span className="text-sm font-normal text-text-muted">
                                    ({tasks.length} task{tasks.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            {tasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={handleCloseModal}
                    task={editingTask}
                />
            )}
        </motion.div>
    );
};

export default UpcomingTasks;
