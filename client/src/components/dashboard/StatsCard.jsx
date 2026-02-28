import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="card-hover"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-text-muted mb-1">{title}</p>
                    <p className="text-3xl font-bold text-text-primary">{value}</p>
                    {trend && (
                        <p className="text-sm text-status-success mt-1 flex items-center gap-1">
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;
