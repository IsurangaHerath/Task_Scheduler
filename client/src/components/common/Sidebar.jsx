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
    CheckSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/today', icon: CheckSquare, label: "Today's Tasks" },
        { path: '/upcoming', icon: Clock, label: 'Upcoming' },
        { path: '/completed', icon: CheckCircle2, label: 'Completed' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const sidebarContent = (
        <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-primary-light/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-text-primary">TaskFlow</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-primary-light/30 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            isActive ? 'sidebar-link-active' : 'sidebar-link'
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-primary-light/30">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-light/20">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-priority-high/10 hover:text-priority-high transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-background-sidebar border-r border-primary-light/30">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-64 bg-background-sidebar border-r border-primary-light/30 z-50 lg:hidden"
                    >
                        {sidebarContent}
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
