import { useState } from 'react';
import WeeklyTaskTracker from '../components/tasks/WeeklyTaskTracker';
import WeeklyReport from '../components/tasks/WeeklyReport';
import { BarChart3, ListTodo } from 'lucide-react';

function WeeklyTracker() {
    const [activeTab, setActiveTab] = useState('tracker');
    
    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-card p-2 inline-flex">
                <button
                    onClick={() => setActiveTab('tracker')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'tracker'
                            ? 'bg-primary-dark text-white'
                            : 'text-text-secondary hover:bg-gray-100'
                    }`}
                >
                    <ListTodo className="w-4 h-4" />
                    Task Tracker
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'report'
                            ? 'bg-primary-dark text-white'
                            : 'text-text-secondary hover:bg-gray-100'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Weekly Report
                </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'tracker' ? <WeeklyTaskTracker /> : <WeeklyReport />}
        </div>
    );
}

export default WeeklyTracker;
