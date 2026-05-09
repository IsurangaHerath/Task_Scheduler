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

/**
 * Header Component
 * 
 * Top navigation bar containing page title, search functionality,
 * theme toggle, notifications dropdown, and user menu.
 * Sticky positioning keeps it visible during scroll.
 * 
 * @param {function} onMenuClick - Callback to open mobile sidebar
 */
const Header = ({ onMenuClick }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { todayTasks } = useTasks();
    
    // UI state management
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Refs for detecting outside clicks to close dropdowns
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    // Route-to-title mapping for dynamic page titles
    const pageTitleMap = {
        '/dashboard': 'Dashboard',
        '/today': "Today's Tasks",
        '/upcoming': 'Upcoming Tasks',
        '/completed': 'Completed Tasks',
        '/calendar': 'Calendar',
        '/settings': 'Settings'
    };

    // Get current page title based on route path
    const getPageTitle = () => pageTitleMap[location.pathname] || 'Dashboard';

    // Get current date formatted for display
    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter pending tasks for notification display
    const pendingNotifications = todayTasks
        .filter(task => task.status === 'pending')
        .slice(0, 5);

    // Determine priority color class for task indicators
    const getPriorityColorClass = (priority) => {
        const priorityColors = {
            high: 'bg-priority-high',
            medium: 'bg-priority-medium',
            low: 'bg-priority-low'
        };
        return priorityColors[priority] || priorityColors.low;
    };

    // Get user initial for avatar display
    const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
    const userFirstName = user?.name?.split(' ')[0] || 'User';
    const displayName = user?.name || 'User';
    const displayEmail = user?.email || '';

    // Handle click outside to close dropdown menus
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render a single notification item
    const renderNotificationItem = (task) => (
        <div
            key={task._id}
            className="p-4 border-b border-primary-light/10 dark:border-[#30363D] hover:bg-primary-light/10 dark:hover:bg-[#30363D] transition-colors"
        >
            <div className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${getPriorityColorClass(task.priority)}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary dark:text-[#C9D1D9] truncate">
                        {task.title}
                    </p>
                    <p className="text-xs text-text-muted dark:text-[#8B949E]">
                        Due at {task.time}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <header className="sticky top-0 z-30 bg-background-main/80 dark:bg-[#0D1117]/80 backdrop-blur-md border-b border-primary-light/20 dark:border-[#30363D]">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                {/* Left Section - Menu Toggle and Page Title */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-primary-light/30 dark:hover:bg-[#30363D] rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5 text-text-secondary dark:text-[#8B949E]" />
                    </button>

                    {/* Page Title and Date */}
                    <div>
                        <h1 className="text-xl font-semibold text-text-primary dark:text-[#C9D1D9]">
                            {getPageTitle()}
                        </h1>
                        <p className="text-sm text-text-muted dark:text-[#8B949E] hidden sm:block">
                            {getFormattedDate()}
                        </p>
                    </div>
                </div>

                {/* Right Section - Search, Actions, and User Menu */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search Input - Hidden on mobile */}
                    <div className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-[#8B949E]" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-background-card dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-lg text-sm text-text-primary dark:text-[#C9D1D9] placeholder:text-text-muted dark:placeholder:text-[#8B949E] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-primary-light/30 dark:hover:bg-[#30363D] rounded-lg transition-colors"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5 text-text-secondary dark:text-[#8B949E]" />
                        ) : (
                            <Moon className="w-5 h-5 text-text-secondary dark:text-[#8B949E]" />
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-2 hover:bg-primary-light/30 dark:hover:bg-[#30363D] rounded-lg transition-colors relative"
                            aria-label="View notifications"
                        >
                            <Bell className="w-5 h-5 text-text-secondary dark:text-[#8B949E]" />
                            {pendingNotifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-priority-high rounded-full" />
                            )}
                        </button>

                        {/* Notifications Panel */}
                        {isNotificationsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-80 bg-background-card dark:bg-[#161B22] rounded-xl shadow-hover border border-primary-light/20 dark:border-[#30363D] overflow-hidden"
                            >
                                <div className="p-4 border-b border-primary-light/20 dark:border-[#30363D]">
                                    <h3 className="font-semibold text-text-primary dark:text-[#C9D1D9]">Notifications</h3>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {pendingNotifications.length > 0 ? (
                                        pendingNotifications.map(renderNotificationItem)
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-text-muted dark:text-[#8B949E] mx-auto mb-2" />
                                            <p className="text-text-muted dark:text-[#8B949E]">No pending tasks for today</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* User Menu Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 p-1.5 hover:bg-primary-light/30 dark:hover:bg-[#30363D] rounded-lg transition-colors"
                            aria-label="Open user menu"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {userInitial}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-text-primary dark:text-[#C9D1D9]">
                                {userFirstName}
                            </span>
                        </button>

                        {/* User Dropdown Panel */}
                        {isUserMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-56 bg-background-card dark:bg-[#161B22] rounded-xl shadow-hover border border-primary-light/20 dark:border-[#30363D] overflow-hidden"
                            >
                                {/* User Info Header */}
                                <div className="p-4 border-b border-primary-light/20 dark:border-[#30363D]">
                                    <p className="font-medium text-text-primary dark:text-[#C9D1D9]">{displayName}</p>
                                    <p className="text-sm text-text-muted dark:text-[#8B949E] truncate">{displayEmail}</p>
                                </div>
                                
                                {/* Menu Actions */}
                                <div className="p-2">
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-[#8B949E] hover:bg-primary-light/30 dark:hover:bg-[#30363D] hover:text-text-primary dark:hover:text-[#C9D1D9] transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Profile</span>
                                    </a>
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-[#8B949E] hover:bg-primary-light/30 dark:hover:bg-[#30363D] hover:text-text-primary dark:hover:text-[#C9D1D9] transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </a>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-priority-high dark:text-[#f85149] hover:bg-priority-high/10 dark:hover:bg-[#f85149]/10 transition-colors"
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
