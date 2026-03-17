import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const validateEmail = () => {
        if (!email) {
            setError('Email is required');
            return false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail()) return;

        setLoading(true);
        setError('');

        try {
            const result = await authService.forgotPassword(email);
            if (result.success) {
                setEmailSent(true);
            } else {
                setError(result.message || 'Failed to send reset email');
            }
        } catch (err) {
            // Handle error - don't reveal whether email exists
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) {
            setError('');
        }
    };

    // If email was sent successfully, show success message
    if (emailSent) {
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
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
                    <p className="text-text-secondary">
                        We've sent password reset instructions to<br />
                        <span className="font-medium text-text-primary">{email}</span>
                    </p>
                </div>

                {/* Security notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> If you don't see the email, check your spam folder. 
                        The reset link will expire in 15 minutes.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Back to Login
                        </span>
                    </button>
                </div>
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
                <h1 className="text-2xl font-bold text-text-primary mb-2">Forgot Password?</h1>
                <p className="text-text-secondary">
                    No worries, we'll send you reset instructions
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                            value={email}
                            onChange={handleChange}
                            placeholder="Enter your registered email"
                            className={`input pl-10 ${error ? 'input-error' : ''}`}
                        />
                    </div>
                    {error && (
                        <p className="text-priority-high text-sm mt-1">{error}</p>
                    )}
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
                            Sending...
                        </span>
                    ) : (
                        'Reset Password'
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

export default ForgotPassword;
