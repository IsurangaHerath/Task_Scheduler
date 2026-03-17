import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import { Users, Search, Trash2, Shield, ShieldOff, ToggleLeft, ToggleRight, X } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, [pagination.page]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers(pagination.page);
            setUsers(response.data.data.users);
            setPagination(response.data.data.pagination);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await adminService.updateUserStatus(userId, newStatus);
            toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await adminService.updateUserRole(userId, newRole);
            toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            await adminService.deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleViewUser = async (userId) => {
        try {
            const response = await adminService.getUser(userId);
            setSelectedUser(response.data.data);
        } catch (error) {
            toast.error('Failed to load user details');
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-background-main min-h-screen">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
                <p className="text-text-muted">Manage all registered users</p>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background-card border border-primary-light/30 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Users Table */}
            <div className="bg-background-card rounded-xl border border-primary-light/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary-light/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">User</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Created</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-light/20">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="spinner spinner-md mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-text-muted">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-primary-light/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-text-primary">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin' 
                                                    ? 'bg-primary/10 text-primary' 
                                                    : 'bg-primary-light/20 text-text-secondary'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.status === 'active' 
                                                    ? 'bg-priority-high/10 text-priority-high' 
                                                    : 'bg-priority-medium/10 text-priority-medium'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRoleChange(user.id, user.role)}
                                                    className="p-2 hover:bg-primary-light/20 rounded-lg transition-colors"
                                                    title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                                >
                                                    {user.role === 'admin' ? (
                                                        <ShieldOff className="w-4 h-4 text-priority-medium" />
                                                    ) : (
                                                        <Shield className="w-4 h-4 text-primary" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(user.id, user.status)}
                                                    className="p-2 hover:bg-primary-light/20 rounded-lg transition-colors"
                                                    title={user.status === 'active' ? 'Disable user' : 'Enable user'}
                                                >
                                                    {user.status === 'active' ? (
                                                        <ToggleRight className="w-4 h-4 text-priority-high" />
                                                    ) : (
                                                        <ToggleLeft className="w-4 h-4 text-priority-medium" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 hover:bg-priority-high/10 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4 text-priority-high" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-primary-light/30 flex items-center justify-between">
                        <span className="text-text-muted text-sm">
                            Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} users
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                className="px-4 py-2 bg-primary-light/20 rounded-lg text-text-primary hover:bg-primary-light/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-text-secondary">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                className="px-4 py-2 bg-primary-light/20 rounded-lg text-text-primary hover:bg-primary-light/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
