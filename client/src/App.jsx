import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout components
import Layout from './components/common/Layout';
import AuthLayout from './components/common/AuthLayout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Main pages
import Dashboard from './pages/Dashboard';
import TodayTasks from './pages/TodayTasks';
import UpcomingTasks from './pages/UpcomingTasks';
import CompletedTasks from './pages/CompletedTasks';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import WeeklyTracker from './pages/WeeklyTracker';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSessions from './pages/AdminSessions';

/**
 * Protected Route Wrapper
 * 
 * Ensures only authenticated users can access the wrapped route.
 * Shows loading spinner while authentication status is being checked.
 * Redirects to login page if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-main">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

/**
 * Public Route Wrapper
 * 
 * Ensures unauthenticated users can access the wrapped route.
 * Shows loading spinner while authentication status is being checked.
 * Redirects to dashboard if user is already authenticated.
 * Used for auth pages like Login, Register, etc.
 */
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-main">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * Admin Route Wrapper
 * 
 * Ensures only users with admin role can access the wrapped route.
 * Shows loading spinner while authentication status is being checked.
 * Redirects to login if not authenticated, or to dashboard if not admin.
 */
const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-main">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * Main Application Component
 * 
 * Defines the routing structure for the entire application.
 * Routes are organized by access level: public, protected, and admin.
 */
function App() {
    return (
        <Routes>
            {/* Public Routes - Accessible without authentication */}
            {/* These routes use AuthLayout (centered, minimal design) */}
            <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected Routes - Requires authentication */}
            {/* These routes use Layout (sidebar + header) */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/today" element={<TodayTasks />} />
                <Route path="/upcoming" element={<UpcomingTasks />} />
                <Route path="/completed" element={<CompletedTasks />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/weekly-tracker" element={<WeeklyTracker />} />
            </Route>

            {/* Admin Routes - Requires admin role */}
            <Route element={<AdminRoute><Layout /></AdminRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/sessions" element={<AdminSessions />} />
            </Route>

            {/* Default and Catch-all Routes */}
            {/* Redirect root path and unknown routes to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
