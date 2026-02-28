import api from './api';

/**
 * Authentication Service
 * Handles all auth-related API calls
 */

/**
 * Register new user
 * @param {Object} userData - { name, email, password }
 * @returns {Promise} - API response
 */
const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise} - API response
 */
const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

/**
 * Logout user
 * @returns {Promise} - API response
 */
const logout = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

/**
 * Get current user
 * @returns {Promise} - API response
 */
const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

/**
 * Update user profile
 * @param {Object} profileData - { name, email }
 * @returns {Promise} - API response
 */
const updateProfile = async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
};

/**
 * Change password
 * @param {Object} passwordData - { currentPassword, newPassword }
 * @returns {Promise} - API response
 */
const changePassword = async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
};

/**
 * Get user settings
 * @returns {Promise} - API response
 */
const getSettings = async () => {
    const response = await api.get('/auth/settings');
    return response.data;
};

/**
 * Update user settings
 * @param {Object} settings - Settings object
 * @returns {Promise} - API response
 */
const updateSettings = async (settings) => {
    const response = await api.put('/auth/settings', settings);
    return response.data;
};

/**
 * Delete user account
 * @param {string} password - User password for confirmation
 * @returns {Promise} - API response
 */
const deleteAccount = async (password) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response.data;
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    getSettings,
    updateSettings,
    deleteAccount,
};

export default authService;
