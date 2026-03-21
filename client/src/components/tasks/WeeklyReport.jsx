import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import {
    Download,
    FileImage,
    FileText,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import weeklyService from '../../services/weeklyService';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COLORS = {
    completed: '#6BCB77',
    missed: '#FF6B6B',
    pending: '#A8E6CF',
    primary: '#6BCB77',
    secondary: '#40916C',
    gradient: ['#6BCB77', '#A8E6CF', '#FFD93D', '#FF6B6B']
};

function getWeekStartDate(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function formatDateRange(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

function formatShortDate(startDate) {
    const start = new Date(startDate);
    const options = { month: 'short', day: 'numeric' };
    return start.toLocaleDateString('en-US', options);
}

// Chart animation components
const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

function StatCard({ icon: Icon, label, value, subValue, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-xl shadow-card p-4 hover:shadow-hover transition-shadow duration-300"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-bold text-text-primary">{value}</p>
                    {subValue && <p className="text-xs text-text-secondary">{subValue}</p>}
                </div>
            </div>
        </motion.div>
    );
}

function WeeklyReport() {
    const reportRef = useRef(null);
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState({ completed: 0, missed: 0, total: 0, completionRate: 0 });
    const [weekStart, setWeekStart] = useState(getWeekStartDate());
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [tasksResponse, progressResponse] = await Promise.all([
                weeklyService.getTasksWithCompletions(weekStart),
                weeklyService.getWeeklyProgress(weekStart)
            ]);
            setTasks(tasksResponse.data);
            setProgress(progressResponse.data);
        } catch (err) {
            console.error('Error fetching weekly report data:', err);
        } finally {
            setLoading(false);
        }
    }, [weekStart]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate daily completion data for charts
    const getDailyData = () => {
        const dailyData = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            let completed = 0;
            let total = 0;
            
            tasks.forEach(task => {
                if (task.completions && task.completions[i]) {
                    total++;
                    if (task.completions[i].completed) {
                        completed++;
                    }
                }
            });
            
            dailyData.push({
                day: DAYS_OF_WEEK[i],
                fullDay: FULL_DAY_NAMES[i],
                date: dateStr,
                completed,
                missed: total - completed,
                total: total || 0,
                pending: tasks.length > 0 ? tasks.length - total : 0
            });
        }
        
        return dailyData;
    };

    // Calculate cumulative progress data for line chart
    const getProgressData = () => {
        const dailyData = getDailyData();
        let cumulativeCompleted = 0;
        const totalPossible = tasks.length * 7 || 1;
        
        return dailyData.map(day => {
            cumulativeCompleted += day.completed;
            return {
                ...day,
                cumulativeCompleted,
                progressRate: Math.round((cumulativeCompleted / totalPossible) * 100) || 0
            };
        });
    };

    // Pie chart data
    const getPieData = () => {
        const totalPossible = tasks.length * 7;
        const completed = progress.completed;
        const notCompleted = totalPossible - completed;
        
        return [
            { name: 'Completed', value: completed, color: COLORS.completed },
            { name: 'Not Completed', value: notCompleted, color: COLORS.missed }
        ];
    };

    // Navigate weeks
    const goToPreviousWeek = () => {
        const current = new Date(weekStart);
        current.setDate(current.getDate() - 7);
        setWeekStart(current.toISOString().split('T')[0]);
    };

    const goToNextWeek = () => {
        const current = new Date(weekStart);
        current.setDate(current.getDate() + 7);
        setWeekStart(current.toISOString().split('T')[0]);
    };

    const goToCurrentWeek = () => {
        setWeekStart(getWeekStartDate());
    };

    // Export functions
    const exportAsImage = async () => {
        if (!reportRef.current) return;
        
        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#F5FBF7',
                logging: false
            });
            
            const link = document.createElement('a');
            link.download = `weekly-report-${weekStart}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error exporting as image:', err);
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportAsPDF = async () => {
        if (!reportRef.current) return;
        
        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#F5FBF7',
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
            pdf.save(`weekly-report-${weekStart}.pdf`);
        } catch (err) {
            console.error('Error exporting as PDF:', err);
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const dailyData = getDailyData();
    const progressData = getProgressData();
    const pieData = getPieData();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-light border-t-primary-dark rounded-full animate-spin"></div>
                    <p className="text-sm text-text-muted">Loading report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with controls */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-card p-6"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-dark" />
                            Weekly Task Report
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            Visual overview of your weekly task performance
                        </p>
                    </div>
                    
                    {/* Export Dropdown */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {exporting ? 'Exporting...' : 'Export Report'}
                        </motion.button>
                        
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
                                >
                                    <button
                                        onClick={exportAsImage}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                                    >
                                        <FileImage className="w-4 h-4 text-primary-dark" />
                                        Download as PNG
                                    </button>
                                    <button
                                        onClick={exportAsPDF}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-red-500" />
                                        Download as PDF
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Week Navigator */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-text-secondary transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <button
                            onClick={goToCurrentWeek}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-light/30 text-text-primary hover:bg-primary-light/50 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3 inline mr-1" />
                            This Week
                        </button>
                        
                        <button
                            onClick={goToNextWeek}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-text-secondary transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-light/20 rounded-lg">
                        <Calendar className="w-4 h-4 text-primary-dark" />
                        <span className="text-sm font-medium text-text-primary">
                            {formatDateRange(weekStart)}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Report Content */}
            <div ref={reportRef} className="space-y-6 bg-background-main p-2">
                {/* Stats Summary */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <StatCard
                        icon={CheckCircle}
                        label="Total Tasks"
                        value={tasks.length}
                        subValue={`${tasks.length * 7} total slots`}
                        color="bg-primary-dark"
                        delay={0}
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Completed"
                        value={progress.completed}
                        subValue={`${progress.completionRate}% completion`}
                        color="bg-status-success"
                        delay={0.1}
                    />
                    <StatCard
                        icon={XCircle}
                        label="Missed"
                        value={progress.missed}
                        subValue="Not completed"
                        color="bg-status-error"
                        delay={0.2}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Completion Rate"
                        value={`${progress.completionRate}%`}
                        subValue={progress.completionRate >= 70 ? 'Great job!' : 'Keep going!'}
                        color="bg-secondary"
                        delay={0.3}
                    />
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart - Daily Completions */}
                    <motion.div
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-white rounded-xl shadow-card p-5"
                    >
                        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary-dark rounded-full"></div>
                            Tasks Completed Per Day
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" vertical={false} />
                                    <XAxis 
                                        dataKey="day" 
                                        tick={{ fill: '#40916C', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        allowDecimals={false}
                                        tick={{ fill: '#40916C', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            fontSize: '12px'
                                        }}
                                        labelStyle={{ color: '#1B4332', fontWeight: 600 }}
                                    />
                                    <Bar 
                                        dataKey="completed" 
                                        name="Completed"
                                        fill={COLORS.completed} 
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1000}
                                        animationBegin={200}
                                    />
                                    <Bar 
                                        dataKey="missed" 
                                        name="Missed"
                                        fill={COLORS.missed} 
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1000}
                                        animationBegin={400}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Pie Chart - Completion Status */}
                    <motion.div
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-white rounded-xl shadow-card p-5"
                    >
                        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-status-success rounded-full"></div>
                            Completion Status Distribution
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        animationDuration={1000}
                                        animationBegin={200}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Line Chart - Progress Over Week */}
                    <motion.div
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-white rounded-xl shadow-card p-5 lg:col-span-2"
                    >
                        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                            Progress Over the Week
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6BCB77" />
                                            <stop offset="100%" stopColor="#40916C" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" vertical={false} />
                                    <XAxis 
                                        dataKey="day" 
                                        tick={{ fill: '#40916C', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        allowDecimals={false}
                                        tick={{ fill: '#40916C', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            fontSize: '12px'
                                        }}
                                        labelStyle={{ color: '#1B4332', fontWeight: 600 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cumulativeCompleted"
                                        name="Total Completed"
                                        stroke="url(#lineGradient)"
                                        strokeWidth={3}
                                        dot={{ fill: '#6BCB77', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#6BCB77' }}
                                        animationDuration={1500}
                                        animationBegin={200}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Daily Breakdown Table */}
                <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white rounded-xl shadow-card p-5"
                >
                    <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-light rounded-full"></div>
                        Daily Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Day</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-text-muted uppercase tracking-wide">Date</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-status-success uppercase tracking-wide">Completed</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-status-error uppercase tracking-wide">Missed</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-text-muted uppercase tracking-wide">Total</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-secondary uppercase tracking-wide">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map((day, index) => {
                                    const dayRate = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
                                    return (
                                        <motion.tr 
                                            key={day.day}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-gray-50 hover:bg-gray-50/50"
                                        >
                                            <td className="px-3 py-3 text-sm font-medium text-text-primary">{day.fullDay}</td>
                                            <td className="px-3 py-3 text-sm text-text-muted text-center">{formatShortDate(day.date)}</td>
                                            <td className="px-3 py-3 text-sm text-status-success text-center font-medium">{day.completed}</td>
                                            <td className="px-3 py-3 text-sm text-status-error text-center font-medium">{day.missed}</td>
                                            <td className="px-3 py-3 text-sm text-text-secondary text-center">{day.total || '-'}</td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    dayRate >= 70 ? 'bg-green-100 text-green-700' :
                                                    dayRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    dayRate > 0 ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {dayRate || 0}%
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-4 text-xs text-text-muted"
                >
                    <p>Generated on {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </motion.div>
            </div>
        </div>
    );
}

export default WeeklyReport;
