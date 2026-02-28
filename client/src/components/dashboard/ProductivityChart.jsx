import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const ProductivityChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-text-muted">
                No data available
            </div>
        );
    }

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6BCB77" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6BCB77" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A8E6CF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#A8E6CF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                    <XAxis
                        dataKey="day"
                        tick={{ fill: '#40916C', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#40916C', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(168, 230, 207, 0.3)'
                        }}
                        labelStyle={{ color: '#1B4332', fontWeight: 600 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Tasks"
                        stroke="#A8E6CF"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                    />
                    <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#6BCB77"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProductivityChart;
