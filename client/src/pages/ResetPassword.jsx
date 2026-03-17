import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [invalidToken, setInvalidToken] = useState(false);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setInvalidToken(true);
        }
    }, [token]);

    const validateForm = () => {
        const newErrors = {};

        if (!password) {
            newErrors.password = 'Password is required';
        } else {
            // Password requirements: min 8 chars, at least one number, at least one uppercase
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                newErrors.password = 'Password must be at least 8 characters with at least one uppercase letter and one number';
            }
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            const result = await authService.resetPassword({
                token,
                password,
                confirmPassword
            });

            if (result.success) {
                setSuccess(true);
            } else {
                setErrors({ general: result.message || 'Failed to reset password' });
            }
        } catch (err) {
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'password') {
            setPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // If token is invalid, show error
    if (invalidToken) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
            >
                {/* Mobile logo */}
                <div className="lg:hidden text-center mb-8">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-text-primary">TaskFlow</span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-priority-high" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Reset Link</h1>
                    <p className="text-text-secondary">
                        This password reset link is invalid or has expired.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/forgot-password')}
                    className="btn-primary w-full"
                >
                    <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Request New Reset Link
                    </span>
                </button>

                <p className="text-center mt-6 text-text-secondary">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-primary-dark hover:text-primary-hover font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </p>
            </motion.div>
        );
    }

    // If password was reset successfully, show success message
    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
            >
                {/* Mobile logo */}
                <div className="lg:hidden text-center mb-8">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-text-primary">TaskFlow</span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-status-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Password Reset Complete</h1>
                    <p className="text-text-secondary">
                        Your password has been reset successfully.
                    </p>
                </div>

                {/* Success notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800">
                        You can now log in with your new password.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="btn-primary w-full"
                >
                    <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Login
                    </span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-text-primary">TaskFlow</span>
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Reset Password</h1>
                <p className="text-text-secondary">
                    Enter a new password for your account
                </p>
            </div>

            {/* General error message */}
            {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-600">{errors.general}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password field */}
                <div>
                    <label htmlFor="password" className="label">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={password}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-priority-high text-sm mt-1">{errors.password}</p>
                    )}
                </div>

                {/* Confirm Password field */}
                <div>
                    <label htmlFor="confirmPassword" className="label">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-priority-high text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Password requirements hint */}
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-text-muted mb-2">Password requirements:</p>
                    <ul className="text-xs text-text-muted space-y-1">
                        <li className={password.length >= 8 ? 'text-status-success' : ''}>
                            ✓ At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(password) ? 'text-status-success' : ''}>
                            ✓ At least one uppercase letter
                        </li>
                        <li className={/\d/.test(password) ? 'text-status-success' : ''}>
                            ✓ At least one number
                        </li>
                    </ul>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="spinner" />
                            Resetting...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Lock className="w-5 h-5" />
                            Reset Password
                        </span>
                    )}
                </button>
            </form>

            {/* Back to Login link */}
            <p className="text-center mt-6 text-text-secondary">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-primary-dark hover:text-primary-hover font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </p>
        </motion.div>
    );
};

export default ResetPassword;
