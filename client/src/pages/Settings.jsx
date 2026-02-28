import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Lock,
    Bell,
    Moon,
    Sun,
    Trash2,
    Save,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { user, updateProfile, changePassword, updateSettings, deleteAccount, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Profile form state
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Settings state
    const [settings, setSettings] = useState({
        notifications: {
            email: user?.settings?.notifications?.email ?? true,
            browser: user?.settings?.notifications?.browser ?? true
        },
        reminderTime: user?.settings?.reminderTime || 15
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [activeTab, setActiveTab] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun }
    ];

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        await updateProfile(profileData);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return;
        }

        const result = await changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });

        if (result.success) {
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        await updateSettings(settings);
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return;

        const result = await deleteAccount(deletePassword);
        if (!result.success) {
            setDeletePassword('');
            setShowDeleteConfirm(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-4xl mx-auto"
        >
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-primary-light/20 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-primary-dark text-white'
                                : 'text-text-secondary hover:bg-primary-light/30'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h2>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="label">
                                <User className="w-4 h-4 inline mr-1" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                className="input"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="label">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                className="input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="card">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="currentPassword" className="label">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    >
                                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="label">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        id="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordData.newPassword && passwordData.confirmPassword &&
                                    passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className="text-priority-high text-sm mt-1">Passwords do not match</p>
                                    )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Update Password
                            </button>
                        </form>
                    </div>

                    {/* Danger Zone */}
                    <div className="card border-priority-high/30">
                        <h2 className="text-lg font-semibold text-priority-high mb-4">Danger Zone</h2>
                        <p className="text-text-secondary mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn-danger flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-text-primary font-medium">
                                    Please enter your password to confirm deletion:
                                </p>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="input"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={!deletePassword || loading}
                                        className="btn-danger"
                                    >
                                        Confirm Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeletePassword('');
                                        }}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Notification Preferences</h2>
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text-primary">Email Notifications</p>
                                <p className="text-sm text-text-muted">Receive task reminders via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.email}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        notifications: { ...settings.notifications, email: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-dark"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text-primary">Browser Notifications</p>
                                <p className="text-sm text-text-muted">Receive push notifications in browser</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.browser}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        notifications: { ...settings.notifications, browser: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-dark"></div>
                            </label>
                        </div>

                        <div>
                            <label htmlFor="reminderTime" className="label">Reminder Time (minutes before task)</label>
                            <select
                                id="reminderTime"
                                value={settings.reminderTime}
                                onChange={(e) => setSettings({ ...settings, reminderTime: parseInt(e.target.value) })}
                                className="input"
                            >
                                <option value={5}>5 minutes</option>
                                <option value={10}>10 minutes</option>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>1 hour</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text-primary">Dark Mode</p>
                                <p className="text-sm text-text-muted">Toggle dark/light theme</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-dark' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div
                                onClick={() => theme !== 'light' && toggleTheme()}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${theme === 'light' ? 'border-primary-dark bg-primary-light/20' : 'border-gray-200'
                                    }`}
                            >
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                                </div>
                                <p className="text-center mt-2 font-medium text-text-primary">Light</p>
                            </div>

                            <div
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${theme === 'dark' ? 'border-primary-dark bg-primary-light/20' : 'border-gray-200'
                                    }`}
                            >
                                <div className="bg-gray-800 rounded-lg p-4 shadow-sm">
                                    <div className="h-4 w-20 bg-gray-600 rounded mb-2"></div>
                                    <div className="h-3 w-32 bg-gray-700 rounded"></div>
                                </div>
                                <p className="text-center mt-2 font-medium text-text-primary">Dark</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Settings;
