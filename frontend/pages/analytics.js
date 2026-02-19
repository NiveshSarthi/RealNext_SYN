import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../utils/api';
import {
    ChartBarIcon, ChatBubbleLeftRightIcon, UserGroupIcon, CurrencyRupeeIcon,
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, EnvelopeIcon, ArrowPathIcon,
    HomeModernIcon, LockClosedIcon, SparklesIcon, RocketLaunchIcon,
    ClockIcon, FunnelIcon, BoltIcon, CheckCircleIcon, XCircleIcon,
    PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend,
    FunnelChart, Funnel, LabelList
} from 'recharts';

// ─── Demo data for graceful fallback ──────────────────────────────────────────
const DEMO = {
    period_days: 30,
    leads: {
        total: 284, new_in_period: 47, growth_pct: 17,
        by_stage: [
            { _id: 'Screening', count: 110 }, { _id: 'Sourcing', count: 86 },
            { _id: 'Walk-in', count: 55 }, { _id: 'Closure', count: 33 }
        ],
        by_source: [
            { _id: 'Facebook Ads', count: 120 }, { _id: 'Google Ads', count: 62 },
            { _id: 'Referral', count: 44 }, { _id: 'Walk-in', count: 30 },
            { _id: 'WhatsApp', count: 18 }, { _id: 'Website', count: 10 }
        ],
        by_status: [
            { _id: 'Hot', count: 48 }, { _id: 'Warm', count: 75 }, { _id: 'Cold', count: 60 },
            { _id: 'Qualified', count: 32 }, { _id: 'Not Responding', count: 40 },
            { _id: 'Uncontacted', count: 29 }
        ],
        trend: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
            count: Math.floor(Math.random() * 8 + 1)
        }))
    },
    campaigns: {
        total: 12, active: 3, completed: 7, draft: 2,
        by_type: [
            { _id: 'broadcast', count: 7 }, { _id: 'drip', count: 3 }, { _id: 'triggered', count: 2 }
        ],
        messages: { sent: 5840, delivered: 5620, read: 3980, failed: 220, replied: 610 }
    },
    workflows: { active: 4 },
    inventory: {
        total: 38, active: 24, sold: 9, draft: 5, synced_to_wa: 18,
        avg_price: 7500000, total_value: 285000000,
        by_category: [
            { _id: 'Apartment', count: 20, avgPrice: 6500000 },
            { _id: 'Villa', count: 8, avgPrice: 14000000 },
            { _id: 'Plot', count: 6, avgPrice: 3500000 },
            { _id: 'Commercial', count: 4, avgPrice: 22000000 },
        ]
    },
    recent_activity: [
        { leadName: 'Rahul Sharma', type: 'status_change', content: 'Status changed from Warm to Hot', timestamp: new Date(Date.now() - 300000) },
        { leadName: 'Priya Singh', type: 'stage_change', content: 'Moved to Walk-in stage', timestamp: new Date(Date.now() - 900000) },
        { leadName: 'Amit Gupta', type: 'note', content: 'Interested in 3BHK in Whitefield', timestamp: new Date(Date.now() - 1800000) },
        { leadName: 'Neha Agarwal', type: 'status_change', content: 'Status changed to Qualified', timestamp: new Date(Date.now() - 3600000) },
        { leadName: 'Vivek Rao', type: 'assignment', content: 'Assigned to sales team', timestamp: new Date(Date.now() - 7200000) },
    ]
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
const STAGE_COLOR = { Screening: '#3B82F6', Sourcing: '#F97316', 'Walk-in': '#10B981', Closure: '#8B5CF6' };
const STATUS_COLOR = { Hot: '#EF4444', Warm: '#F97316', Cold: '#3B82F6', Qualified: '#10B981', Lost: '#6B7280', 'Not Responding': '#8B5CF6' };

const fmtPrice = (n) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
};

const relTime = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-card border border-border/50 rounded-xl p-6 shadow-soft ${className}`}>
        <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const StatCard = ({ title, value, sub, icon: Icon, trend, color = 'text-primary', badge }) => (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-soft hover:border-primary/30 transition-all group">
        <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-lg bg-[#0E1117] border border-white/5 ${color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-5 w-5" />
            </div>
            {trend === 'up' && <span className="flex items-center gap-0.5 text-xs text-green-400"><ArrowTrendingUpIcon className="h-3.5 w-3.5" />{badge}</span>}
            {trend === 'down' && <span className="flex items-center gap-0.5 text-xs text-red-400"><ArrowTrendingDownIcon className="h-3.5 w-3.5" />{badge}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold text-foreground mt-0.5">{value}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
);

const ProgressBar = ({ label, value, max, color, suffix = '' }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{value.toLocaleString()}{suffix} <span className="text-muted-foreground/60">({pct}%)</span></span>
            </div>
            <div className="h-1.5 w-full bg-[#0E1117] rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000 rounded-full`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const LockedSection = ({ title, feature }) => (
    <div className="bg-card border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 opacity-60">
        <LockClosedIcon className="h-10 w-10 text-muted-foreground" />
        <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Upgrade your plan to unlock <span className="text-primary">{feature}</span></p>
        </div>
        <a href="/settings/billing" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
            Upgrade Plan →
        </a>
    </div>
);

const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#161B22] border border-white/10 p-3 rounded-lg shadow-xl text-xs">
            <p className="text-muted-foreground mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="font-semibold" style={{ color: p.color || '#F97316' }}>{prefix}{p.value?.toLocaleString()}{suffix}</p>
            ))}
        </div>
    );
};

const ActivityIcon = ({ type }) => {
    const icons = {
        status_change: { icon: BoltIcon, color: 'text-orange-400 bg-orange-400/10' },
        stage_change: { icon: FunnelIcon, color: 'text-blue-400 bg-blue-400/10' },
        note: { icon: ChatBubbleLeftRightIcon, color: 'text-green-400 bg-green-400/10' },
        assignment: { icon: UserGroupIcon, color: 'text-purple-400 bg-purple-400/10' },
        creation: { icon: SparklesIcon, color: 'text-yellow-400 bg-yellow-400/10' },
    };
    const { icon: Icon, color } = icons[type] || icons.note;
    return <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="h-3.5 w-3.5" /></div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isDemo, setIsDemo] = useState(false);

    // Feature flags from subscription
    const features = useMemo(() => {
        const f = user?.subscription?.features || user?.client?.features || {};
        return {
            campaigns: f.campaigns !== false,
            drip: f.drip_sequences !== false,
            inventory: f.catalog !== false,
            lms: f.lms !== false,
        };
    }, [user]);

    useEffect(() => { fetchAnalytics(); }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await analyticsAPI.getDashboard({ period });
            const d = res.data?.data || res.data;
            setData(d);
            setIsDemo(false);
        } catch (err) {
            console.warn('Analytics API unavailable, showing demo data');
            setData(DEMO);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <Layout>
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Array(6).fill(0).map((_, i) => <div key={i} className="h-28 bg-card border border-border/30 rounded-xl" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {Array(3).fill(0).map((_, i) => <div key={i} className="h-72 bg-card border border-border/30 rounded-xl" />)}
                    </div>
                </div>
            </Layout>
        );
    }

    const d = data || DEMO;
    const leads = d.leads || {};
    const camps = d.campaigns || {};
    const inv = d.inventory || {};
    const msgs = camps.messages || {};

    // Delivery rate
    const deliveryRate = msgs.sent > 0 ? Math.round((msgs.delivered / msgs.sent) * 100) : 0;
    const readRate = msgs.delivered > 0 ? Math.round((msgs.read / msgs.delivered) * 100) : 0;

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-12">

                {/* ─── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                            <PresentationChartBarIcon className="h-6 w-6 text-primary" />
                            Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Performance insights across your entire business
                            {isDemo && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">DEMO DATA</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-[#161B22] rounded-lg p-0.5 border border-white/5">
                            {[['7', '7d'], ['30', '30d'], ['90', '90d']].map(([val, label]) => (
                                <button key={val} onClick={() => setPeriod(val)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === val ? 'bg-primary text-black shadow-glow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchAnalytics} title="Refresh" className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors">
                            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* ─── Top KPI Cards ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard title="Total Leads" value={leads.total?.toLocaleString() || '0'} sub={`+${leads.new_in_period || 0} this period`} icon={UserGroupIcon} trend="up" badge={`${leads.growth_pct || 0}%`} />
                    <StatCard title="Messages Sent" value={(msgs.sent || 0).toLocaleString()} sub={`${deliveryRate}% delivery rate`} icon={EnvelopeIcon} trend="up" badge={`${deliveryRate}%`} color="text-blue-400" />
                    <StatCard title="Active Campaigns" value={camps.active || 0} sub={`${camps.total || 0} total`} icon={RocketLaunchIcon} color="text-purple-400" />
                    <StatCard title="Drip Sequences" value={d.workflows?.active || 0} sub="Running sequences" icon={BoltIcon} color="text-yellow-400" />
                    <StatCard title="Properties Listed" value={inv.total || 0} sub={`${inv.active || 0} active`} icon={HomeModernIcon} trend="up" badge={`${inv.sold || 0} sold`} color="text-green-400" />
                    <StatCard title="Avg Property Price" value={fmtPrice(inv.avg_price)} sub={`Portfolio: ${fmtPrice(inv.total_value)}`} icon={CurrencyRupeeIcon} color="text-orange-400" />
                </div>

                {/* ─── Lead Trend + Stage Funnel ───────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCard title="Lead Acquisition Trend" subtitle={`Daily leads · last ${period} days`} className="lg:col-span-2">
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={leads.trend || []}>
                                    <defs>
                                        <linearGradient id="lgLead" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false}
                                        tickFormatter={s => { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                                    <YAxis stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltip suffix=" Leads" />} cursor={{ stroke: 'rgba(249,115,22,0.2)', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#lgLead)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard title="Pipeline by Stage" subtitle="Total leads in each stage">
                        <div className="space-y-3 mt-2">
                            {(leads.by_stage || []).map(({ _id, count }) => (
                                <ProgressBar key={_id} label={_id}
                                    value={count} max={leads.total || 1}
                                    color={`bg-[${STAGE_COLOR[_id] || '#F97316'}]`}
                                    suffix="" />
                            ))}
                            {/* Fallback colored bars */}
                            {(leads.by_stage || []).map(({ _id, count }, i) => null)}
                        </div>
                        {/* Render bars with inline style color since dynamic Tailwind classes won't JIT */}
                        <div className="space-y-3 mt-2">
                            {(leads.by_stage || []).map(({ _id, count }, i) => {
                                const pct = leads.total > 0 ? Math.min(100, Math.round((count / leads.total) * 100)) : 0;
                                return (
                                    <div key={_id}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground">{_id}</span>
                                            <span className="text-foreground font-medium">{count} <span className="text-muted-foreground/50">({pct}%)</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#0E1117] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ChartCard>
                </div>

                {/* ─── Lead Sources + Status Distribution ──────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Lead Sources" subtitle="Where your leads come from">
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leads.by_source || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="_id" stroke="#4B5563" fontSize={11} tickLine={false} width={90} />
                                    <Tooltip content={<ChartTooltip suffix=" leads" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {(leads.by_source || []).map((_, i) => (
                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard title="Lead Status Mix" subtitle="Current status distribution">
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leads.by_status || []}
                                        dataKey="count"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                    >
                                        {(leads.by_status || []).map((entry, i) => (
                                            <Cell key={i} fill={STATUS_COLOR[entry._id] || PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={32}
                                        formatter={(val) => <span className="text-muted-foreground text-xs">{val}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* ─── Campaigns (feature-gated) ────────────────────────────── */}
                {features.campaigns ? (
                    <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4" /> WhatsApp Campaigns
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Message funnel */}
                            <ChartCard title="Message Delivery Funnel" subtitle="Across all campaigns" className="lg:col-span-2">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                    {[
                                        { label: 'Sent', val: msgs.sent, icon: EnvelopeIcon, color: 'from-blue-500/20 to-transparent', border: 'border-blue-500/30', text: 'text-blue-400' },
                                        { label: 'Delivered', val: msgs.delivered, icon: CheckCircleIcon, color: 'from-green-500/20 to-transparent', border: 'border-green-500/30', text: 'text-green-400' },
                                        { label: 'Read', val: msgs.read, icon: ChatBubbleLeftRightIcon, color: 'from-purple-500/20 to-transparent', border: 'border-purple-500/30', text: 'text-purple-400' },
                                        { label: 'Replied', val: msgs.replied, icon: BoltIcon, color: 'from-orange-500/20 to-transparent', border: 'border-orange-500/30', text: 'text-orange-400' },
                                    ].map(({ label, val, icon: Icon, color, border, text }) => (
                                        <div key={label} className={`bg-gradient-to-b ${color} border ${border} rounded-xl p-4 text-center`}>
                                            <Icon className={`h-5 w-5 mx-auto mb-2 ${text}`} />
                                            <p className="text-xl font-bold text-foreground">{(val || 0).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 space-y-2.5">
                                    <ProgressBar label="Delivery Rate" value={msgs.delivered || 0} max={msgs.sent || 1} color="bg-green-500" suffix="" />
                                    <ProgressBar label="Open Rate" value={msgs.read || 0} max={msgs.delivered || 1} color="bg-purple-500" suffix="" />
                                    <ProgressBar label="Reply Rate" value={msgs.replied || 0} max={msgs.read || 1} color="bg-orange-500" suffix="" />
                                </div>
                            </ChartCard>

                            <ChartCard title="Campaign Types" subtitle={`${camps.total || 0} total campaigns`}>
                                <div className="h-44">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={camps.by_type || []} dataKey="count" nameKey="_id" cx="50%" cy="50%"
                                                outerRadius={65} paddingAngle={4}>
                                                {(camps.by_type || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                            <Legend formatter={(val) => <span className="text-xs text-muted-foreground capitalize">{val}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-border/30 pt-3">
                                    {[
                                        { label: 'Active', val: camps.active, color: 'text-green-400' },
                                        { label: 'Done', val: camps.completed, color: 'text-blue-400' },
                                        { label: 'Draft', val: camps.draft, color: 'text-muted-foreground' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label}>
                                            <p className={`text-lg font-bold ${color}`}>{val || 0}</p>
                                            <p className="text-[10px] text-muted-foreground">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                ) : (
                    <LockedSection title="Campaign Analytics" feature="WhatsApp Campaigns" />
                )}

                {/* ─── Inventory Analytics ─────────────────────────────────── */}
                {features.inventory ? (
                    <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <HomeModernIcon className="h-4 w-4" /> Property Inventory
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Inventory summary */}
                            <div className="grid grid-cols-2 gap-3 content-start">
                                {[
                                    { label: 'Total Listed', val: inv.total, color: 'border-blue-500/30 text-blue-400' },
                                    { label: 'Active', val: inv.active, color: 'border-green-500/30 text-green-400' },
                                    { label: 'Sold', val: inv.sold, color: 'border-orange-500/30 text-orange-400' },
                                    { label: 'WA Synced', val: inv.synced_to_wa, color: 'border-purple-500/30 text-purple-400' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className={`bg-card border ${color.split(' ')[0]} rounded-xl p-4 text-center`}>
                                        <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{val || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* By category */}
                            <ChartCard title="Properties by Category" subtitle="Count and average price">
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={inv.by_category || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="_id" stroke="#4B5563" fontSize={11} tickLine={false} />
                                            <YAxis stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip content={<ChartTooltip suffix=" properties" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {(inv.by_category || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Price overview */}
                            <ChartCard title="Portfolio Valuation" subtitle="Price breakdown by category">
                                <div className="space-y-3 mt-2">
                                    {(inv.by_category || []).map(({ _id, count, avgPrice }, i) => (
                                        <div key={_id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                                                <span className="text-sm text-foreground">{_id}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-foreground">{fmtPrice(avgPrice)}</p>
                                                <p className="text-[10px] text-muted-foreground">avg · {count} units</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-border/30 flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Portfolio Total</span>
                                    <span className="text-base font-bold text-primary">{fmtPrice(inv.total_value)}</span>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                ) : (
                    <LockedSection title="Inventory Analytics" feature="Property Catalog" />
                )}

                {/* ─── Drip / Automation (feature-gated) ───────────────────── */}
                {features.drip ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ChartCard title="Automation Summary" subtitle="Drip sequences & workflows" className="md:col-span-1">
                            <div className="flex flex-col items-center justify-center h-36 gap-2">
                                <p className="text-5xl font-bold text-primary">{d.workflows?.active || 0}</p>
                                <p className="text-sm text-muted-foreground">Active sequences running</p>
                                <a href="/drip-sequences" className="text-xs text-primary hover:underline mt-2">Manage sequences →</a>
                            </div>
                        </ChartCard>
                        <div className="md:col-span-2 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20 rounded-xl p-6 flex items-center gap-6">
                            <BoltIcon className="h-12 w-12 text-primary flex-shrink-0 opacity-60" />
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Drip Automation Active</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {d.workflows?.active || 0} automated sequences are nurturing your leads. Set up follow-up messages, delays, and conditional branches to convert more leads.
                                </p>
                                <a href="/drip-sequences" className="inline-block mt-3 text-xs bg-primary text-black px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
                                    View Drip Sequences
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <LockedSection title="Automation Analytics" feature="Drip Sequences" />
                )}

                {/* ─── Recent Activity ─────────────────────────────────────── */}
                <ChartCard title="Recent Activity" subtitle="Latest lead interactions">
                    <div className="divide-y divide-border/30">
                        {(d.recent_activity || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
                        ) : (
                            (d.recent_activity || []).map((act, i) => (
                                <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                                    <ActivityIcon type={act.type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground font-medium truncate">{act.leadName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.content}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                        <ClockIcon className="h-3 w-3" />
                                        {relTime(act.timestamp)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ChartCard>

            </div>
        </Layout>
    );
}
