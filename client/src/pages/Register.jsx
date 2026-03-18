import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Register Page Component
 * 
 * Provides user registration functionality with name, email, and password.
 * Includes form validation, password confirmation, and navigation to dashboard.
 */
const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();
    
    // UI state
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    
    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Email validation regex pattern
    const EMAIL_REGEX = /\S+@\S+\.\S+/;
    
    // Password minimum length
    const MIN_PASSWORD_LENGTH = 6;
    const MAX_NAME_LENGTH = 50;

    // Validate all form fields
    const validateForm = () => {
        const newErrors = {};

        // Validate name
        if (!formData.name) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length > MAX_NAME_LENGTH) {
            newErrors.name = `Name cannot exceed ${MAX_NAME_LENGTH} characters`;
        }

        // Validate email
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!EMAIL_REGEX.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
            newErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
        }

        // Validate password confirmation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Extract user data (exclude confirmPassword)
        const { confirmPassword, ...userData } = formData;
        const result = await register(userData);

        if (result.success) {
            navigate('/dashboard');
        }
    };

    // Handle input field changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field if it exists
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            {/* Mobile Logo - Only visible on small screens */}
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

            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Create an account</h1>
                <p className="text-text-secondary">Start organizing your tasks today</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                    <label htmlFor="name" className="label">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            className={`input pl-10 ${formErrors.name ? 'input-error' : ''}`}
                            autoComplete="name"
                            maxLength={MAX_NAME_LENGTH}
                        />
                    </div>
                    {formErrors.name && (
                        <p className="text-priority-high text-sm mt-1">{formErrors.name}</p>
                    )}
                </div>

                {/* Email Input */}
                <div>
                    <label htmlFor="email" className="label">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            className={`input pl-10 ${formErrors.email ? 'input-error' : ''}`}
                            autoComplete="email"
                        />
                    </div>
                    {formErrors.email && (
                        <p className="text-priority-high text-sm mt-1">{formErrors.email}</p>
                    )}
                </div>

                {/* Password Input */}
                <div>
                    <label htmlFor="password" className="label">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a password"
                            className={`input pl-10 pr-10 ${formErrors.password ? 'input-error' : ''}`}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        >
                            {isPasswordVisible ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {formErrors.password && (
                        <p className="text-priority-high text-sm mt-1">{formErrors.password}</p>
                    )}
                </div>

                {/* Confirm Password Input */}
                <div>
                    <label htmlFor="confirmPassword" className="label">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            className={`input pl-10 ${formErrors.confirmPassword ? 'input-error' : ''}`}
                            autoComplete="new-password"
                        />
                    </div>
                    {formErrors.confirmPassword && (
                        <p className="text-priority-high text-sm mt-1">{formErrors.confirmPassword}</p>
                    )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        className="checkbox-custom mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-text-secondary">
                        I agree to the{' '}
                        <Link to="/terms" className="text-primary-dark hover:text-primary-hover">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-primary-dark hover:text-primary-hover">
                            Privacy Policy
                        </Link>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="spinner" />
                            Creating account...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Create Account
                        </span>
                    )}
                </button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-6 text-text-secondary">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="text-primary-dark hover:text-primary-hover font-medium transition-colors"
                >
                    Sign in
                </Link>
            </p>
        </motion.div>
    );
};

export default Register;
