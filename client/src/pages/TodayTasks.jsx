import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';

const TodayTasks = () => {
    const { todayTasks, loading, fetchTodayTasks } = useTasks();
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterPriority, setFilterPriority] = useState('all');
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        fetchTodayTasks();
    }, []);

    // Filter tasks by priority
    const filteredTasks = todayTasks.filter(task => {
        if (filterPriority === 'all') return true;
        return task.priority === filterPriority;
    });

    // Separate pending and completed tasks
    const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
    const completedTasks = filteredTasks.filter(task => task.status === 'completed');

    const handleEdit = (task) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setEditingTask(null);
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
                    <h1 className="text-2xl font-bold text-text-primary">Today's Tasks</h1>
                    <p className="text-text-secondary mt-1">
                        {pendingTasks.length} pending, {completedTasks.length} completed
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-ghost flex items-center gap-2 ${showFilters ? 'bg-primary-light/30' : ''}`}
                    >
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <TaskFilters
                    filterPriority={filterPriority}
                    setFilterPriority={setFilterPriority}
                />
            )}

            {/* Tasks list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner spinner-lg" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="card text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        No tasks for today
                    </h3>
                    <p className="text-text-secondary mb-4">
                        {filterPriority !== 'all'
                            ? `No ${filterPriority} priority tasks`
                            : 'You have no tasks scheduled for today'}
                    </p>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn-primary"
                    >
                        Add a task
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Pending tasks */}
                    {pendingTasks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-text-primary">
                                Pending ({pendingTasks.length})
                            </h2>
                            {pendingTasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}

                    {/* Completed tasks */}
                    {completedTasks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-text-primary">
                                Completed ({completedTasks.length})
                            </h2>
                            {completedTasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}
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

export default TodayTasks;
