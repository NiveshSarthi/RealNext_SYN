import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI, analyticsAPI, internalLeadsAPI } from '../../utils/api';
import {
    UserGroupIcon, BuildingOffice2Icon, CurrencyRupeeIcon, ChartBarIcon,
    RocketLaunchIcon, HomeModernIcon, ArrowPathIcon, ArrowTrendingUpIcon,
    CheckBadgeIcon, ClockIcon, ExclamationCircleIcon, BoltIcon,
    PresentationChartBarIcon, UsersIcon, EnvelopeIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// ─── Palette & helpers ───────────────────────────────────────────────────────
const P = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const relTime = (d) => {
    if (!d) return '—';
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return fmtDate(d);
};

const STATUS_COLOR = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    past_due: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO = {
    clients: [
        { id: '1', name: 'Apex Realty', email: 'admin@apexrealty.com', created_at: new Date(Date.now() - 90 * 86400000), subscription: { status: 'active', plan_name: 'Pro' } },
        { id: '2', name: 'Greenview Homes', email: 'info@greenview.in', created_at: new Date(Date.now() - 45 * 86400000), subscription: { status: 'trial', plan_name: 'Starter' } },
        { id: '3', name: 'SkyLand Properties', email: 'hello@skyland.com', created_at: new Date(Date.now() - 120 * 86400000), subscription: { status: 'active', plan_name: 'Enterprise' } },
        { id: '4', name: 'Nest & Build', email: 'contact@nestbuild.in', created_at: new Date(Date.now() - 30 * 86400000), subscription: { status: 'active', plan_name: 'Pro' } },
        { id: '5', name: 'Metro Spaces', email: 'metro@spaces.in', created_at: new Date(Date.now() - 200 * 86400000), subscription: { status: 'cancelled', plan_name: 'Starter' } },
    ],
    subscriptions: [
        { id: 's1', status: 'active' }, { id: 's2', status: 'active' }, { id: 's3', status: 'trial' },
        { id: 's4', status: 'expired' }, { id: 's5', status: 'active' },
    ],
    plans: [
        { id: 'p1', name: 'Starter', price: 999 }, { id: 'p2', name: 'Pro', price: 2499 }, { id: 'p3', name: 'Enterprise', price: 4999 }
    ],
    platformLeads: 1420,
    platformLeadsThisMonth: 184,
    platformMessages: 28400,
    platformCampaigns: 56,
    platformProperties: 218,
    trend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        clients: i % 5 === 0 ? 1 : 0,
        leads: Math.floor(Math.random() * 15 + 3)
    })),
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const KPI = ({ title, value, sub, Icon, iconColor = 'text-primary' }) => (
    <div className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors group">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg bg-[#0E1117] border border-white/5 ${iconColor} group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
);

const ChartCard = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-card border border-border/50 rounded-xl p-6 shadow-soft ${className}`}>
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const StatusBadge = ({ status }) => (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border capitalize ${STATUS_COLOR[status] || 'bg-muted text-muted-foreground border-muted'}`}>
        {status}
    </span>
);

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#161B22] border border-white/10 p-3 rounded-lg shadow-xl text-xs">
            <p className="text-muted-foreground mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [dashData, setDashData] = useState(null);
    const [isDemo, setIsDemo] = useState(false);
    const [search, setSearch] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [clientsRes, subsRes, plansRes] = await Promise.allSettled([
                adminAPI.getClients({ limit: 100 }),
                adminAPI.getSubscriptions({ limit: 100 }),
                adminAPI.getPlans(),
            ]);

            const c = clientsRes.status === 'fulfilled' ? (clientsRes.value.data?.data || clientsRes.value.data || []) : [];
            const s = subsRes.status === 'fulfilled' ? (subsRes.value.data?.data || subsRes.value.data || []) : [];
            const p = plansRes.status === 'fulfilled' ? (plansRes.value.data?.data || plansRes.value.data || []) : [];

            if (c.length === 0 && s.length === 0) {
                setIsDemo(true);
                setClients(DEMO.clients);
                setSubscriptions(DEMO.subscriptions);
                setPlans(DEMO.plans);
                setDashData(DEMO);
            } else {
                setIsDemo(false);
                setClients(Array.isArray(c) ? c : []);
                setSubscriptions(Array.isArray(s) ? s : []);
                setPlans(Array.isArray(p) ? p : []);
                setDashData(null);
            }
        } catch {
            setIsDemo(true);
            setClients(DEMO.clients);
            setSubscriptions(DEMO.subscriptions);
            setPlans(DEMO.plans);
            setDashData(DEMO);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // Derived stats
    const totalClients = clients.length;
    const activeClients = clients.filter(c => ['active', 'trial'].includes(c.subscription?.status)).length;
    const trialClients = clients.filter(c => c.subscription?.status === 'trial').length;
    const cancelledClients = clients.filter(c => c.subscription?.status === 'cancelled' || c.subscription?.status === 'expired').length;

    // Subscription status distribution
    const subStatusMap = subscriptions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});
    const subStatusData = Object.entries(subStatusMap).map(([k, v]) => ({ name: k, value: v }));

    // Plan distribution
    const planMap = clients.reduce((acc, c) => {
        const plan = c.subscription?.plan_name || c.plan?.name || 'Unknown';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {});
    const planData = Object.entries(planMap).map(([k, v]) => ({ name: k, value: v }));

    // MRR estimate (based on plan prices)
    const planPriceMap = plans.reduce((acc, p) => { acc[p.name] = p.price || 0; return acc; }, {});
    const mrr = clients.reduce((acc, c) => {
        if (['active', 'trial'].includes(c.subscription?.status)) {
            const planName = c.subscription?.plan_name || c.plan?.name || '';
            acc += planPriceMap[planName] || 0;
        }
        return acc;
    }, 0);

    // New clients this month
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const newClientsThisMonth = clients.filter(c => new Date(c.created_at) >= thisMonth).length;

    // Client signup trend (last 30 days)
    const trendData = isDemo ? DEMO.trend : (() => {
        const dayMap = {};
        clients.forEach(c => {
            const d = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dayMap[d] = (dayMap[d] || 0) + 1;
        });
        return Array.from({ length: 30 }, (_, i) => {
            const date = new Date(Date.now() - (29 - i) * 86400000);
            const key = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return { date: key, clients: dayMap[key] || 0, leads: Math.floor(Math.random() * 12 + 2) };
        });
    })();

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <Layout>
                <div className="animate-pulse space-y-4 py-8">
                    <div className="h-8 w-48 bg-card rounded" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-card border border-border/30 rounded-xl" />)}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                            <PresentationChartBarIcon className="h-6 w-6 text-primary" />
                            System Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Platform-wide performance and tenant overview
                            {isDemo && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">DEMO DATA</span>}
                        </p>
                    </div>
                    <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg border border-border transition-colors">
                        <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KPI title="Total Clients" value={totalClients} sub={`+${newClientsThisMonth} this month`} Icon={BuildingOffice2Icon} iconColor="text-primary" />
                    <KPI title="Active / Trial" value={`${activeClients - trialClients} / ${trialClients}`} sub={`${cancelledClients} churned`} Icon={CheckBadgeIcon} iconColor="text-green-400" />
                    <KPI title="Est. MRR" value={mrr > 0 ? `₹${mrr.toLocaleString('en-IN')}` : '—'} sub="Active subscriptions" Icon={CurrencyRupeeIcon} iconColor="text-yellow-400" />
                    <KPI title="Total Leads (Platform)" value={(isDemo ? DEMO.platformLeads : '—').toLocaleString()} sub={isDemo ? `+${DEMO.platformLeadsThisMonth} this month` : 'Per-client only'} Icon={UserGroupIcon} iconColor="text-blue-400" />
                </div>

                {/* Signup trend + Subscription breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCard title="Client Signups (30 days)" subtitle="New tenants over time" className="lg:col-span-2">
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="lgClients" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} interval={4} />
                                    <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(249,115,22,0.2)', strokeWidth: 1 }} />
                                    <Area name="New Clients" type="monotone" dataKey="clients" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#lgClients)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard title="Subscription Status" subtitle="Active vs trial vs churned">
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={subStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={75} paddingAngle={3}>
                                        {subStatusData.map((_, i) => <Cell key={i} fill={P[i % P.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend formatter={(val) => <span className="text-xs text-muted-foreground capitalize">{val}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* Plan distribution + MRR by plan */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Clients by Plan" subtitle="Distribution across plans">
                        {planData.length > 0 ? (
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={planData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#4B5563" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="value" name="Clients" radius={[4, 4, 0, 0]}>
                                            {planData.map((_, i) => <Cell key={i} fill={P[i % P.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-sm text-muted-foreground py-10 text-center">No plan data</p>}
                    </ChartCard>

                    <ChartCard title="Platform Metrics" subtitle="Estimated aggregate activity">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Platform Leads', val: isDemo ? DEMO.platformLeads.toLocaleString() : '—', Icon: UserGroupIcon, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                { label: 'Messages Sent', val: isDemo ? DEMO.platformMessages.toLocaleString() : '—', Icon: EnvelopeIcon, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                                { label: 'Campaigns Run', val: isDemo ? DEMO.platformCampaigns : '—', Icon: RocketLaunchIcon, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                                { label: 'Properties Listed', val: isDemo ? DEMO.platformProperties : '—', Icon: HomeModernIcon, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                            ].map(({ label, val, Icon, color }) => (
                                <div key={label} className={`border rounded-xl p-3 flex items-center gap-3 ${color}`}>
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className="text-base font-bold text-foreground">{val}</p>
                                        <p className="text-[10px] text-muted-foreground">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>

                {/* Client Table */}
                <div className="bg-card border border-border/50 rounded-xl shadow-soft overflow-hidden">
                    <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">All Clients</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{totalClients} registered tenants</p>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search clients..."
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-48 transition-colors"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-muted-foreground font-medium uppercase tracking-wider border-b border-border/50">
                                    {['Client', 'Email', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredClients.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center text-muted-foreground py-10 text-sm">No clients found</td></tr>
                                ) : filteredClients.map((client) => (
                                    <tr key={client.id || client._id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                                                    {(client.name || '?').substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-foreground">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{client.email}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                                {client.subscription?.plan_name || client.plan?.name || 'No Plan'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={client.subscription?.status || 'unknown'} />
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{fmtDate(client.created_at)}</td>
                                        <td className="px-5 py-3.5">
                                            <a href={`/admin/clients/${client.id || client._id}`}
                                                className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                                View →
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
