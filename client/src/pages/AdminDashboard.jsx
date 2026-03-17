import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, Activity, TrendingUp, UserPlus, ListTodo } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                adminService.getUserStats(),
                adminService.getActivity()
            ]);
            setStats(statsRes.data.data);
            setActivity(activityRes.data.data);
        } catch (error) {
            toast.error('Failed to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-main">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-background-main min-h-screen">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-text-muted">Welcome back, {user?.name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-background-card p-6 rounded-xl border border-primary-light/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-text-muted text-sm">Total Users</p>
                            <p className="text-2xl font-bold text-text-primary">{stats?.totalUsers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-background-card p-6 rounded-xl border border-primary-light/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-priority-high/10 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-priority-high" />
                        </div>
                        <div>
                            <p className="text-text-muted text-sm">Active Users</p>
                            <p className="text-2xl font-bold text-text-primary">{stats?.activeUsers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-background-card p-6 rounded-xl border border-primary-light/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-priority-medium/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-priority-medium" />
                        </div>
                        <div>
                            <p className="text-text-muted text-sm">Disabled</p>
                            <p className="text-2xl font-bold text-text-primary">{stats?.disabledUsers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-background-card p-6 rounded-xl border border-primary-light/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-dark/10 rounded-lg flex items-center justify-center">
                            <ListTodo className="w-6 h-6 text-primary-dark" />
                        </div>
                        <div>
                            <p className="text-text-muted text-sm">Total Tasks</p>
                            <p className="text-2xl font-bold text-text-primary">{stats?.totalTasks || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-background-card p-6 rounded-xl border border-primary-light/30 mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">Weekly Activity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary-light/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-text-muted text-sm">Tasks Created</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{activity?.summary?.tasksCreatedLastWeek || 0}</p>
                    </div>

                    <div className="bg-priority-high/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-priority-high" />
                            <span className="text-text-muted text-sm">Tasks Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{activity?.summary?.tasksCompletedLastWeek || 0}</p>
                    </div>

                    <div className="bg-primary-dark/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <UserPlus className="w-4 h-4 text-primary-dark" />
                            <span className="text-text-muted text-sm">New Users</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{activity?.summary?.newUsersLastWeek || 0}</p>
                    </div>
                </div>

                {/* Daily Activity Chart */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-text-muted text-sm">
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Tasks Created</th>
                                <th className="pb-3 font-medium">Tasks Completed</th>
                                <th className="pb-3 font-medium">New Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity?.dailyActivity?.map((day) => (
                                <tr key={day.date} className="border-t border-primary-light/20">
                                    <td className="py-3 text-text-primary">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                    <td className="py-3 text-text-primary">{day.tasksCreated}</td>
                                    <td className="py-3 text-priority-high">{day.tasksCompleted}</td>
                                    <td className="py-3 text-primary-dark">{day.newUsers}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
