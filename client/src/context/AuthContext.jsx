import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token is still valid
                    const response = await authService.getCurrentUser();
                    setUser(response.data.user);
                    setToken(storedToken);
                } catch (err) {
                    // Token is invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Register new user
    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.register(userData);

            if (response.success) {
                const { user: newUser, token: newToken } = response.data;

                localStorage.setItem('token', newToken);
                localStorage.setItem('user', JSON.stringify(newUser));

                setUser(newUser);
                setToken(newToken);

                toast.success('Registration successful! Welcome aboard! 🎉');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Login user
    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.login(credentials);

            if (response.success) {
                const { user: loggedInUser, token: newToken } = response.data;

                localStorage.setItem('token', newToken);
                localStorage.setItem('user', JSON.stringify(loggedInUser));

                setUser(loggedInUser);
                setToken(newToken);

                toast.success('Welcome back! 👋');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Logout user
    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            // Continue with logout even if API call fails
            console.error('Logout API error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
            toast.success('Logged out successfully');
        }
    };

    // Update profile
    const updateProfile = async (profileData) => {
        try {
            setLoading(true);
            const response = await authService.updateProfile(profileData);

            if (response.success) {
                const updatedUser = response.data.user;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                toast.success('Profile updated successfully');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update profile';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Change password
    const changePassword = async (passwordData) => {
        try {
            setLoading(true);
            const response = await authService.changePassword(passwordData);

            if (response.success) {
                const { token: newToken } = response.data;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                toast.success('Password changed successfully');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to change password';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Update settings
    const updateSettings = async (settings) => {
        try {
            const response = await authService.updateSettings(settings);

            if (response.success) {
                const updatedUser = { ...user, settings: response.data.settings };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                toast.success('Settings updated');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update settings';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Delete account
    const deleteAccount = async (password) => {
        try {
            setLoading(true);
            const response = await authService.deleteAccount(password);

            if (response.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setToken(null);
                toast.success('Account deleted successfully');
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete account';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    // Clear error
    const clearError = () => setError(null);

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token && !!user,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        updateSettings,
        deleteAccount,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
