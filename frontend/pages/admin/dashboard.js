import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform
} from 'framer-motion';
import {
    BuildingOfficeIcon,
    UsersIcon,
    CreditCardIcon,
    CpuChipIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowUpRightIcon,
    CurrencyRupeeIcon,
    CommandLineIcon,
    ServerIcon,
    ArrowPathIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import axios from '../../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    BarElement,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const StatCard = ({ title, value, change, trend, loading, icon: Icon }) => (
    <motion.div
        variants={fadeIn}
        whileHover={{ y: -5, scale: 1.01 }}
        className="relative group h-full"
    >
        <Card className="relative h-full p-6 bg-white/[0.03] backdrop-blur-3xl border-white/[0.05] border-t-white/[0.1] shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 group-hover:border-primary/30 group-hover:bg-white/[0.05]">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <span>{change}</span>
                    <ArrowUpRightIcon className={`h-3 w-3 ${trend === 'down' ? 'rotate-90' : ''}`} />
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{title}</h3>
                <div className="text-2xl md:text-3xl font-black text-white tracking-tighter tabular-nums">
                    {loading ? <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg mt-2" /> : value}
                </div>
            </div>

            {/* Subtle Gradient Decor */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        </Card>
    </motion.div>
);

const QuickLinkCard = ({ title, description, icon: Icon, href }) => (
    <Link href={href} className="group relative block h-full">
        <motion.div
            whileHover={{ y: -8, scale: 1.01 }}
            className="h-full"
        >
            <Card className="p-8 h-full bg-white/[0.03] backdrop-blur-3xl border-white/[0.05] border-t-white/[0.1] shadow-2xl shadow-black/40 hover:border-primary/40 transition-all duration-500 rounded-[2rem] flex flex-col justify-between overflow-hidden">
                <div className="relative z-10">
                    <div className="p-4 w-fit rounded-2xl bg-white/5 border border-white/10 mb-8 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/50 text-primary">
                        <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter mb-3 uppercase group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed uppercase tracking-tight line-clamp-2">{description}</p>
                </div>

                <div className="mt-8 flex items-center text-[11px] font-black text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                    Manage <ArrowUpRightIcon className="h-3 w-3 ml-2" />
                </div>

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] -rotate-12 pointer-events-none group-hover:rotate-0 transition-all duration-1000 text-white">
                    <Icon className="h-32 w-32" />
                </div>
            </Card>
        </motion.div>
    </Link>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeClients: 0,
        totalUsers: 0,
        systemLoad: 'Normal',
        revenueHistory: [4500, 5200, 4800, 6100, 5900, 7200],
        clientsByEnvironment: []
    });
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, revenueRes, clientsRes] = await Promise.all([
                    axios.get('/api/admin/analytics/dashboard-stats'),
                    axios.get('/api/admin/analytics/revenue'),
                    axios.get('/api/admin/analytics/clients')
                ]);

                // Extract monthly totals for chart
                const monthlyRevenue = revenueRes.data.data.monthly_breakdown.map(m => m.total);
                const revenueLabels = revenueRes.data.data.monthly_breakdown.map(m => {
                    const [year, month] = m.month.split('-');
                    const date = new Date(year, month - 1);
                    return date.toLocaleString('default', { month: 'short' });
                });

                setStats({
                    ...statsRes.data.data,
                    revenueHistory: monthlyRevenue.length > 0 ? monthlyRevenue : [0, 0, 0, 0, 0, 0],
                    revenueLabels: revenueLabels.length > 0 ? revenueLabels : ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                    clientsByEnvironment: clientsRes.data.data.by_environment || []
                });
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const revenueChartData = {
        labels: stats.revenueLabels || ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [
            {
                label: 'Monthly Revenue',
                data: stats.revenueHistory || [0, 0, 0, 0, 0, 0],
                borderColor: '#FF7A00',
                backgroundColor: 'rgba(255, 122, 0, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 3,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0D1117',
                titleColor: '#fff',
                bodyColor: '#FF7A00',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 11, weight: '900' },
                bodyFont: { size: 14, weight: '900' },
                displayColors: false
            }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        }
    };

    const statCards = [
        {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            change: '+12.5%',
            trend: 'up',
            icon: CurrencyRupeeIcon
        },
        {
            title: 'Active Clients',
            value: stats.activeClients.toString(),
            change: '+2',
            trend: 'up',
            icon: BuildingOfficeIcon
        },
        {
            title: 'Total Users',
            value: stats.totalUsers.toString(),
            change: '+24',
            trend: 'up',
            icon: UsersIcon
        },
        {
            title: 'System Performance',
            value: stats.systemLoad,
            change: 'NOMINAL',
            trend: 'flat',
            icon: ServerIcon
        },
    ];

    const modules = [
        {
            title: 'Client Management',
            description: 'Monitor client instances, manage subscriptions, and deploy global updates.',
            icon: BuildingOfficeIcon,
            href: '/admin/clients'
        },
        {
            title: 'Plans & Subscriptions',
            description: 'Configure subscription tiers, dynamic pricing models, and billing cycles.',
            icon: CreditCardIcon,
            href: '/admin/plans'
        },
        {
            title: 'Platform Analytics',
            description: 'Real-time telemetry, API throughput metrics, and growth trajectories.',
            icon: ChartBarIcon,
            href: '/admin/analytics'
        },
        {
            title: 'System Settings',
            description: 'Environment variables, secure SMTP clusters, and security protocols.',
            icon: Cog6ToothIcon,
            href: '/admin/settings'
        },
    ];

    return (
        <Layout>
            <div ref={containerRef} className="relative min-h-screen bg-[#0D1117] text-white selection:bg-primary/30 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent"></div>
                    <div className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] bg-primary/[0.03] blur-[150px] rounded-full animate-pulse-slow"></div>
                </div>

                <div className="relative z-10 container-custom py-12 space-y-16">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm">
                                    <CommandLineIcon className="h-6 w-6 text-black" />
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-emerald-500/80 uppercase tracking-[0.4em] font-mono">System Status: Online</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white/90 tracking-tighter uppercase leading-none">
                                Super Admin Dashboard
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.05] border-t-white/[0.1] rounded-2xl px-6 py-4 backdrop-blur-md shadow-xl shadow-black/20">
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2">Last Sync</p>
                                <p className="text-sm font-black text-white font-mono uppercase tracking-tighter">
                                    {new Date().toLocaleTimeString([], { hour12: false })} UTC
                                </p>
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2" />
                            <motion.button
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.5 }}
                                onClick={() => window.location.reload()}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/10 transition-colors"
                            >
                                <ArrowPathIcon className="h-5 w-5 text-gray-500" />
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        variants={{
                            animate: { transition: { staggerChildren: 0.1 } }
                        }}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {statCards.map((stat, idx) => (
                            <StatCard key={idx} {...stat} loading={loading} />
                        ))}
                    </motion.div>

                    {/* Analytics Core */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-2 relative group"
                        >
                            <Card className="p-8 bg-white/[0.03] backdrop-blur-3xl border-white/[0.05] border-t-white/[0.1] shadow-2xl shadow-black/40 rounded-[2rem] h-[450px] flex flex-col transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Portfolio Growth</h3>
                                        <p className="text-2xl font-black text-white tracking-tighter uppercase">Revenue Overview</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['24H', '7D', '30D', 'ALL'].map(t => (
                                            <button key={t} className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-white/5 hover:bg-primary hover:text-black transition-all border border-white/10 text-gray-400">
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 mt-4">
                                    <Line data={revenueChartData} options={{
                                        ...chartOptions,
                                        scales: {
                                            x: {
                                                display: true,
                                                grid: { display: false },
                                                ticks: { color: '#4B5563', font: { size: 11, weight: 'bold' } }
                                            },
                                            y: {
                                                display: true,
                                                grid: { color: 'rgba(255,255,255,0.03)' },
                                                ticks: { color: '#4B5563', font: { size: 11, weight: 'bold' } }
                                            }
                                        }
                                    }} />
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <Card className="p-8 bg-white/[0.03] backdrop-blur-3xl border-white/[0.05] border-t-white/[0.1] shadow-2xl shadow-black/40 rounded-[2rem] h-full flex flex-col transition-all duration-300 hover:bg-white/[0.05]">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Environment Distribution</h3>
                                <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
                                    <Doughnut
                                        data={{
                                            labels: stats.clientsByEnvironment.map(e => e.environment || 'Other'),
                                            datasets: [{
                                                data: stats.clientsByEnvironment.map(e => e.count),
                                                backgroundColor: ['#FF7A00', '#6366F1', '#10B981', '#F59E0B'],
                                                borderWidth: 0,
                                                hoverOffset: 10
                                            }]
                                        }}
                                        options={{
                                            ...chartOptions,
                                            cutout: '75%',
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <p className="text-5xl font-black text-white tracking-tighter">
                                            {stats.clientsByEnvironment.reduce((acc, curr) => acc + curr.count, 0)}
                                        </p>
                                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Active Instances</p>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-4">
                                    {stats.clientsByEnvironment.map((l, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2.5 w-2.5 rounded-full ${['bg-primary', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'][i % 4]}`} />
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{l.environment}</span>
                                            </div>
                                            <span className="text-sm font-black text-white font-mono">{l.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Terminal / Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                        {modules.map((module, idx) => (
                            <QuickLinkCard key={idx} {...module} />
                        ))}
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center opacity-20 pointer-events-none">
                    <div className="flex items-center gap-6">
                        <ShieldCheckIcon className="h-6 w-6 text-primary" />
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.5em]">Classified Syndicate Access Level 10</span>
                        <div className="h-1 w-32 bg-white/5 rounded-full" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .shadow-glow { box-shadow: 0 0 50px -10px rgba(255, 122, 0, 0.4); }
                .shadow-glow-sm { box-shadow: 0 0 20px -5px rgba(255, 122, 0, 0.3); }
                .container-custom { max-width: 1400px; margin: 0 auto; px: 2rem; }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.05; transform: scale(1); }
                    50% { opacity: 0.1; transform: scale(1.1); }
                }
                .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
            `}</style>
        </Layout>
    );
}
