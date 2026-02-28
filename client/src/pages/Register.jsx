import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Name cannot exceed 50 characters';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const { confirmPassword, ...userData } = formData;
        const result = await register(userData);

        if (result.success) {
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

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
                <h1 className="text-2xl font-bold text-text-primary mb-2">Create an account</h1>
                <p className="text-text-secondary">Start organizing your tasks today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field */}
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
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                        />
                    </div>
                    {errors.name && (
                        <p className="text-priority-high text-sm mt-1">{errors.name}</p>
                    )}
                </div>

                {/* Email field */}
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
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-priority-high text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                {/* Password field */}
                <div>
                    <label htmlFor="password" className="label">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
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
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                        />
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-priority-high text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Terms */}
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

                {/* Submit button */}
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

            {/* Login link */}
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
