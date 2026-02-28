import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/tasks/TaskCard';

const CompletedTasks = () => {
    const { completedTasks, loading, fetchCompletedTasks } = useTasks();
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        fetchCompletedTasks(100);
    }, []);

    // Group tasks by completion date
    const groupedTasks = completedTasks.reduce((groups, task) => {
        const date = task.completedAt
            ? format(new Date(task.completedAt), 'yyyy-MM-dd')
            : 'Unknown';
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(task);
        return groups;
    }, {});

    const handleEdit = (task) => {
        setEditingTask(task);
    };

    // Format date for display
    const formatDateHeader = (dateStr) => {
        if (dateStr === 'Unknown') return 'Unknown Date';

        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return format(date, 'EEEE, MMMM d, yyyy');
    };

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return new Date(b) - new Date(a);
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Completed Tasks</h1>
                    <p className="text-text-secondary mt-1">
                        {completedTasks.length} tasks completed
                    </p>
                </div>
            </div>

            {/* Tasks list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner spinner-lg" />
                </div>
            ) : completedTasks.length === 0 ? (
                <div className="card text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        No completed tasks yet
                    </h3>
                    <p className="text-text-secondary">
                        Tasks you complete will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map((date) => (
                        <div key={date} className="space-y-3">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-status-success" />
                                {formatDateHeader(date)}
                                <span className="text-sm font-normal text-text-muted">
                                    ({groupedTasks[date].length} task{groupedTasks[date].length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            {groupedTasks[date].map(task => (
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
        </motion.div>
    );
};

export default CompletedTasks;
