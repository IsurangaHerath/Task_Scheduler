import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Menu,
    Search,
    Bell,
    Sun,
    Moon,
    User,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTasks } from '../../context/TaskContext';

const Header = ({ onMenuClick }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { todayTasks } = useTasks();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        const titles = {
            '/dashboard': 'Dashboard',
            '/today': "Today's Tasks",
            '/upcoming': 'Upcoming Tasks',
            '/completed': 'Completed Tasks',
            '/calendar': 'Calendar',
            '/settings': 'Settings'
        };
        return titles[path] || 'Dashboard';
    };

    // Get pending notifications (tasks due soon)
    const notifications = todayTasks
        .filter(task => task.status === 'pending')
        .slice(0, 5);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 bg-background-main/80 backdrop-blur-md border-b border-primary-light/20">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5 text-text-secondary" />
                    </button>

                    <div>
                        <h1 className="text-xl font-semibold text-text-primary">
                            {getPageTitle()}
                        </h1>
                        <p className="text-sm text-text-muted hidden sm:block">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search (hidden on mobile) */}
                    <div className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-background-card border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5 text-text-secondary" />
                        ) : (
                            <Moon className="w-5 h-5 text-text-secondary" />
                        )}
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 hover:bg-primary-light/30 rounded-lg transition-colors relative"
                        >
                            <Bell className="w-5 h-5 text-text-secondary" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-priority-high rounded-full" />
                            )}
                        </button>

                        {/* Notifications dropdown */}
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-80 bg-background-card rounded-xl shadow-hover border border-primary-light/20 overflow-hidden"
                            >
                                <div className="p-4 border-b border-primary-light/20">
                                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((task) => (
                                            <div
                                                key={task._id}
                                                className="p-4 border-b border-primary-light/10 hover:bg-primary-light/10 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 mt-2 rounded-full ${task.priority === 'high' ? 'bg-priority-high' :
                                                            task.priority === 'medium' ? 'bg-priority-medium' :
                                                                'bg-priority-low'
                                                        }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-text-muted">
                                                            Due at {task.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-text-muted mx-auto mb-2" />
                                            <p className="text-text-muted">No pending tasks for today</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 hover:bg-primary-light/30 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-text-primary">
                                {user?.name?.split(' ')[0] || 'User'}
                            </span>
                        </button>

                        {/* User dropdown */}
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-56 bg-background-card rounded-xl shadow-hover border border-primary-light/20 overflow-hidden"
                            >
                                <div className="p-4 border-b border-primary-light/20">
                                    <p className="font-medium text-text-primary">{user?.name}</p>
                                    <p className="text-sm text-text-muted truncate">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-primary-light/30 hover:text-text-primary transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Profile</span>
                                    </a>
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-primary-light/30 hover:text-text-primary transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </a>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-priority-high hover:bg-priority-high/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
