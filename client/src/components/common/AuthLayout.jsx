import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="min-h-screen flex bg-background-main">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-light to-primary-dark p-12 flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-primary-dark"
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

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-text-primary leading-tight">
                        Organize your day,<br />
                        Achieve your goals
                    </h1>
                    <p className="text-lg text-text-secondary">
                        A smart task scheduler that helps you stay productive and never miss important deadlines.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-3xl font-bold text-text-primary">100%</div>
                            <div className="text-text-secondary">Free to use</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-3xl font-bold text-text-primary">∞</div>
                            <div className="text-text-secondary">Tasks</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-3xl font-bold text-text-primary">🔔</div>
                            <div className="text-text-secondary">Reminders</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-3xl font-bold text-text-primary">📊</div>
                            <div className="text-text-secondary">Analytics</div>
                        </div>
                    </div>
                </div>

                <div className="text-text-secondary text-sm">
                    © 2024 TaskFlow. All rights reserved.
                </div>
            </div>

            {/* Right side - Auth form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
