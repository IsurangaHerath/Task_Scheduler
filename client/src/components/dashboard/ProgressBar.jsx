import { motion } from 'framer-motion';

const ProgressBar = ({ completed, total, showPercentage = true }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="w-full">
            <div className="progress-bar">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="progress-bar-fill"
                />
            </div>
            {showPercentage && (
                <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-text-primary">{percentage}%</span>
                    <span className="text-sm text-text-muted ml-1">complete</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
