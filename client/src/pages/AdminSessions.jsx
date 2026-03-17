import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import { Users, LogOut, Clock, RefreshCw } from 'lucide-react';

const AdminSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await adminService.getActiveSessions();
            setSessions(response.data.data.sessions);
        } catch (error) {
            toast.error('Failed to load active sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleForceLogout = async (userId, userName) => {
        if (!window.confirm(`Force logout ${userName}? This will log them out immediately.`)) {
            return;
        }
        
        try {
            await adminService.forceLogoutUser(userId);
            toast.success('User logged out successfully');
            loadSessions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to logout user');
        }
    };

    return (
        <div className="p-6 bg-background-main min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Active Sessions
                    </h1>
                    <p className="text-text-muted">Currently logged-in users</p>
                </div>
                <button
                    onClick={loadSessions}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Session Count */}
            <div className="mb-6">
                <span className="text-lg text-text-secondary">
                    {sessions.length} user(s) currently logged in
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner spinner-lg"></div>
                </div>
            ) : sessions.length === 0 ? (
                <div className="bg-background-card rounded-xl border border-primary-light/30 p-12 text-center">
                    <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">No users are currently logged in</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(session => (
                        <div 
                            key={session.userId} 
                            className="bg-background-card p-6 rounded-xl border border-primary-light/30"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                        {session.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{session.user?.name}</h3>
                                        <p className="text-sm text-text-muted">{session.user?.email}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-priority-high/10 text-priority-high text-xs rounded-full">
                                    Online
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <Clock className="w-4 h-4" />
                                    <span>Last active: {new Date(session.lastActive).toLocaleTimeString()}</span>
                                </div>
                                {session.user?.role === 'admin' && (
                                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                        Admin
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => handleForceLogout(session.userId, session.user?.name)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-priority-high/10 text-priority-high rounded-lg hover:bg-priority-high/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Force Logout
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSessions;
