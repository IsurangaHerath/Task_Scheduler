import api from './api';

const adminService = {
    // Get all users
    getUsers: (page = 1, limit = 20) => 
        api.get(`/admin/users?page=${page}&limit=${limit}`),
    
    // Get user stats
    getUserStats: () => 
        api.get('/admin/users/stats'),
    
    // Get user by ID
    getUser: (id) => 
        api.get(`/admin/users/${id}`),
    
    // Update user status
    updateUserStatus: (id, status) => 
        api.put(`/admin/users/${id}/status`, { status }),
    
    // Update user role
    updateUserRole: (id, role) => 
        api.put(`/admin/users/${id}/role`, { role }),
    
    // Delete user
    deleteUser: (id) => 
        api.delete(`/admin/users/${id}`),
    
    // Session Management
    getActiveSessions: () => 
        api.get('/admin/sessions'),
    
    forceLogoutUser: (userId) => 
        api.delete(`/admin/sessions/${userId}`),
    
    // Get activity overview
    getActivity: () => 
        api.get('/admin/activity')
};

export default adminService;
