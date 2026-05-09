import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    CalendarDays,
    CheckCircle2,
    Clock,
    Calendar,
    Settings,
    LogOut,
    X,
    CheckSquare,
    Shield,
    Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Sidebar Component
 * 
 * Main navigation sidebar that provides access to all application pages.
 * Supports both desktop (fixed sidebar) and mobile (slide-out drawer) layouts.
 * Admin-specific navigation items are conditionally rendered based on user role.
 * 
 * @param {boolean} isOpen - Controls mobile sidebar visibility
 * @param {function} onClose - Callback to close mobile sidebar
 */
const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    // Standard navigation items available to all authenticated users
    const mainNavigationItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/today', icon: CheckSquare, label: "Today's Tasks" },
        { path: '/weekly-tracker', icon: CalendarDays, label: 'Weekly Tracker' },
        { path: '/upcoming', icon: Clock, label: 'Upcoming' },
        { path: '/completed', icon: CheckCircle2, label: 'Completed' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    // Admin-only navigation items
    const adminNavigationItems = [
        { path: '/admin', icon: Shield, label: 'Admin Panel' },
        { path: '/admin/users', icon: Users, label: 'User Management' },
    ];

    // Determines the appropriate CSS class based on navigation state
    const getNavLinkClass = ({ isActive }) => 
        isActive ? 'sidebar-link-active' : 'sidebar-link';

    // Renders a single navigation link item
    const renderNavLink = (item) => (
        <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={getNavLinkClass}
        >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
        </NavLink>
    );

    // Get user initials for avatar display
    const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
    const displayName = user?.name || 'User';
    const displayEmail = user?.email || 'user@example.com';

    // Reusable sidebar content to avoid duplication between desktop and mobile
    const sidebarContent = (
        <div className="h-full flex flex-col">
            {/* Application Logo and Brand */}
            <div className="p-6 border-b border-primary-light/30 dark:border-[#30363D] dark:bg-[#0D2818]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-text-primary dark:text-[#C9D1D9]">TaskFlow</span>
                    </div>
                    {/* Close button for mobile sidebar */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-primary-light/30 dark:hover:bg-[#30363D] rounded-lg transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5 text-text-secondary dark:text-[#8B949E]" />
                    </button>
                </div>
            </div>

            {/* Main Navigation Menu */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
                {mainNavigationItems.map(renderNavLink)}

                {/* Admin Section - Only visible to users with admin role */}
                {user?.role === 'admin' && (
                    <>
                        <div className="pt-4 pb-2">
                            <div className="h-px bg-primary-light/30 dark:bg-[#30363D]"></div>
                        </div>
                        <p className="px-4 py-2 text-xs font-semibold text-text-muted dark:text-[#8B949E] uppercase tracking-wider">
                            Admin
                        </p>
                        {adminNavigationItems.map(renderNavLink)}
                    </>
                )}
            </nav>

            {/* User Profile and Logout Section */}
            <div className="p-4 border-t border-primary-light/30 dark:border-[#30363D] dark:bg-[#0D2818]">
                {/* User Information Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-light/20 dark:bg-[#30363D]">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                        {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-[#C9D1D9] truncate">
                            {displayName}
                        </p>
                        <p className="text-xs text-text-muted dark:text-[#8B949E] truncate">
                            {displayEmail}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary dark:text-[#8B949E] hover:bg-priority-high/10 dark:hover:bg-[#f85149]/10 hover:text-priority-high dark:hover:text-[#f85149] transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar - Fixed position on large screens */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-background-sidebar dark:bg-[#0D2818] border-r border-primary-light/30 dark:border-[#30363D]">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar - Slide-in drawer on smaller screens */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-64 bg-background-sidebar dark:bg-[#0D2818] border-r border-primary-light/30 dark:border-[#30363D] z-50 lg:hidden"
                    >
                        {sidebarContent}
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
