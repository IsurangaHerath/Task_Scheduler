import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Plus,
    ArrowRight,
    Calendar
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import StatsCard from '../components/dashboard/StatsCard';
import ProgressBar from '../components/dashboard/ProgressBar';
import ProductivityChart from '../components/dashboard/ProductivityChart';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';

const Dashboard = () => {
    const { stats, todayTasks, loading, refreshAll } = useTasks();
    const [showTaskModal, setShowTaskModal] = useState(false);

    useEffect(() => {
        refreshAll();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Get priority tasks (high priority pending)
    const priorityTasks = todayTasks
        .filter(task => task.status === 'pending' && task.priority === 'high')
        .slice(0, 3);

    // Get upcoming tasks for today
    const upcomingToday = todayTasks
        .filter(task => task.status === 'pending')
        .slice(0, 5);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Welcome section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                        Good {getTimeOfDay()}! 👋
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Here's what's happening with your tasks today
                    </p>
                </div>
                <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn-primary flex items-center gap-2 self-start"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </motion.div>

            {/* Stats cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Tasks"
                    value={stats?.stats?.total || 0}
                    icon={Calendar}
                    color="bg-blue-500"
                    trend={stats?.stats?.week?.completed ? `+${stats.stats.week.completed} this week` : null}
                />
                <StatsCard
                    title="Completed"
                    value={stats?.stats?.completed || 0}
                    icon={CheckCircle2}
                    color="bg-status-success"
                    trend={stats?.stats?.completionRate ? `${stats.stats.completionRate}% rate` : null}
                />
                <StatsCard
                    title="Pending"
                    value={stats?.stats?.pending || 0}
                    icon={Clock}
                    color="bg-priority-medium"
                />
                <StatsCard
                    title="High Priority"
                    value={stats?.stats?.priority?.high || 0}
                    icon={AlertCircle}
                    color="bg-priority-high"
                />
            </motion.div>

            {/* Progress and Chart section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Progress */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Today's Progress</h3>
                    <ProgressBar
                        completed={stats?.stats?.today?.completed || 0}
                        total={stats?.stats?.today?.total || 0}
                    />
                    <div className="mt-4 flex justify-between text-sm">
                        <span className="text-text-secondary">
                            {stats?.stats?.today?.completed || 0} completed
                        </span>
                        <span className="text-text-muted">
                            {stats?.stats?.today?.pending || 0} remaining
                        </span>
                    </div>
                </div>

                {/* Weekly Chart */}
                <div className="card lg:col-span-2">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Weekly Overview</h3>
                    <ProductivityChart data={stats?.weekData || []} />
                </div>
            </motion.div>

            {/* Tasks sections */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Tasks */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">High Priority</h3>
                        <Link
                            to="/today"
                            className="text-sm text-primary-dark hover:text-primary-hover flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {priorityTasks.length > 0 ? (
                            priorityTasks.map((task) => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    compact
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-2" />
                                <p className="text-text-secondary">No high priority tasks!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Tasks */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Today's Tasks</h3>
                        <Link
                            to="/today"
                            className="text-sm text-primary-dark hover:text-primary-hover flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingToday.length > 0 ? (
                            upcomingToday.map((task) => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    compact
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-primary mx-auto mb-2" />
                                <p className="text-text-secondary">No tasks for today</p>
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="btn-secondary mt-4"
                                >
                                    Add a task
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Task Modal */}
            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                />
            )}
        </motion.div>
    );
};

// Helper function to get time of day greeting
const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
};

export default Dashboard;
