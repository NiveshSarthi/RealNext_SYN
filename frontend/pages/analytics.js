import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analyticsAPI } from '../utils/api';
import {
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    CurrencyRupeeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    EnvelopeIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7'); // 7, 30, 90 days
    const [dashboardData, setDashboardData] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [contactData, setContactData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            // Parallelize data fetching
            const [dashboardRes, trendsRes, contactsRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                analyticsAPI.getConversationAnalytics({ period }),
                analyticsAPI.getContactAnalytics()
            ]);

            setDashboardData(dashboardRes.data.data);
            setTrendData(trendsRes.data.data.trends || []);
            setContactData(contactsRes.data.data);

        } catch (err) {
            console.error("Analytics fetch error:", err);
            // Don't show full error in production, usually
            setError('Failed to load analytics data.');
            // Fallback/Mock data for demonstration if backend fails (Optional, removing for "real" impl)
            // But for safety during demo/dev if DB is empty:

        } finally {
            setLoading(false);
        }
    };

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#161B22] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-gray-400 text-xs mb-1">{new Date(label).toLocaleDateString()}</p>
                    <p className="text-primary font-bold text-sm">
                        {payload[0].value} Conversations
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading && !dashboardData) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    // Colors for charts
    const COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in content-container pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics dashboard</h1>
                        <p className="mt-1 text-sm text-gray-400">Real-time insights into your automation and business performance.</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex bg-[#161B22] rounded-lg p-1 border border-white/5">
                        {['7', '30', '90'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                                    ? 'bg-primary text-black shadow-glow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {p === '90' ? '3 Months' : `${p} Days`}
                            </button>
                        ))}
                        <button
                            onClick={fetchAnalytics}
                            className="ml-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md"
                            title="Refresh Data"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                {dashboardData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Leads"
                            value={dashboardData.leadStats.totalLeads}
                            subValue={`+${dashboardData.leadStats.new_leads} New`}
                            icon={UserGroupIcon}
                            trend="up"
                        />
                        <StatCard
                            title="Campaigns Sent"
                            value={dashboardData.campaignStats.totalCampaigns}
                            subValue={`${dashboardData.campaignStats.avg_response_rate}% Response Rate`}
                            icon={EnvelopeIcon}
                            trend="neutral"
                        />
                        <StatCard
                            title="Revenue (Est.)"
                            value={`₹${dashboardData.revenueStats.totalRevenue.toLocaleString()}`}
                            subValue={`${dashboardData.revenueStats.deals} Deals Closed`}
                            icon={CurrencyRupeeIcon}
                            trend="up"
                            isCurrency
                        />
                        <StatCard
                            title="Conversion Rate"
                            value={`${dashboardData.leadStats.conversion_rate}%`}
                            subValue="Lead to Close"
                            icon={ChartBarIcon}
                            trend={dashboardData.leadStats.conversion_rate > 10 ? "up" : "neutral"}
                        />
                    </div>
                )}

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversation Trends (Area Chart) */}
                    <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-soft">
                        <h3 className="text-lg font-semibold text-white mb-6">Conversation volume</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#6B7280"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#F97316"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart (Lead Engagement/Status) */}
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-soft flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-2">Lead engagement</h3>
                        <div className="flex-1 min-h-[250px] relative">
                            {contactData?.engagementBreakdown ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={contactData.engagementBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="engagement_level"
                                        >
                                            {contactData.engagementBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => <span className="text-gray-400 text-xs ml-2">{value}</span>}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data available</div>
                            )}

                            {/* Central Text Overlay (Optional) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{dashboardData?.leadStats?.totalLeads}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">TOTAL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Recent Activity & Lead Funnel (Simplified as stats for now) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-soft">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent activity</h3>
                        <div className="space-y-4">
                            {dashboardData?.recentActivity?.length > 0 ? (
                                dashboardData.recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                        <div className="mt-1 min-w-[32px]">
                                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{activity.title}</p>
                                            <div className="flex items-center mt-1 space-x-2">
                                                <ClockIcon className="h-3 w-3 text-gray-500" />
                                                <p className="text-xs text-gray-500">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400 capitalize">
                                                    {activity.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No recent activity.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid (Lead Breakdown) */}
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-soft">
                        <h3 className="text-lg font-semibold text-white mb-4">Lead status breakdown</h3>
                        <div className="space-y-4">
                            <LeadStatRow label="New Leads" count={dashboardData?.leadStats?.new_leads} total={dashboardData?.leadStats?.totalLeads} color="bg-blue-500" />
                            <LeadStatRow label="Contacted" count={dashboardData?.leadStats?.contacted_leads} total={dashboardData?.leadStats?.totalLeads} color="bg-yellow-500" />
                            <LeadStatRow label="Qualified" count={dashboardData?.leadStats?.qualified_leads} total={dashboardData?.leadStats?.totalLeads} color="bg-orange-500" />
                            <LeadStatRow label="Closed / Won" count={dashboardData?.leadStats?.closed_leads} total={dashboardData?.leadStats?.totalLeads} color="bg-green-500" />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Sub-components for cleaner code
function StatCard({ title, value, subValue, icon: Icon, trend, isCurrency }) {
    const isUp = trend === 'up';
    const isNeutral = trend === 'neutral';

    return (
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-soft hover:border-primary/30 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-lg bg-[#0E1117] border border-white/5 text-primary group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6" />
                </div>
                {/* Trend indicator (mock logic for now) */}
                {isUp && <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />}
                {!isUp && !isNeutral && <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                    {subValue}
                </p>
            </div>
        </div>
    );
}

function LeadStatRow({ label, count, total, color }) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-300">{label}</span>
                <span className="text-white font-medium">{count} <span className="text-gray-600 text-xs">({percentage}%)</span></span>
            </div>
            <div className="h-2 w-full bg-[#0E1117] rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full ${color} opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
