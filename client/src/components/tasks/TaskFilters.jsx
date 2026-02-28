import { motion } from 'framer-motion';

const TaskFilters = ({ filterPriority, setFilterPriority }) => {
    const priorities = [
        { value: 'all', label: 'All Priorities' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
        >
            <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => (
                    <button
                        key={priority.value}
                        onClick={() => setFilterPriority(priority.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterPriority === priority.value
                                ? 'bg-primary-dark text-white'
                                : 'bg-primary-light/30 text-text-primary hover:bg-primary-light/50'
                            }`}
                    >
                        {priority.label}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default TaskFilters;
