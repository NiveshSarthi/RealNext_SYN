import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { metaAdsAPI } from '../../utils/api';
import {
    ArrowLeftIcon,
    CurrencyRupeeIcon,
    CursorArrowRaysIcon,
    UserPlusIcon,
    ChartBarIcon
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
    Legend
} from 'recharts';

export default function CampaignDetails() {
    const { user } = useAuth();
    const router = useRouter();
    const { id } = router.query;
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            fetchCampaignDetails();
        }
    }, [user, id]);

    const fetchCampaignDetails = async () => {
        try {
            const res = await metaAdsAPI.getCampaignPerformance(id);
            setCampaign(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch details:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                </div>
            </Layout>
        );
    }

    if (!campaign) {
        return (
            <Layout>
                <div className="p-8 text-center text-gray-400">Campaign not found</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in content-container pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold font-display text-white">{campaign.name}</h1>
                            <div className="flex items-center mt-1 space-x-3">
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${campaign.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {campaign.status}
                                </span>
                                <span className="text-sm text-gray-500">{campaign.objective}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <CurrencyRupeeIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Total Spend</p>
                                <p className="text-2xl font-bold text-white font-display">₹{campaign.spend.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <CursorArrowRaysIcon className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Clicks</p>
                                <p className="text-2xl font-bold text-white font-display">{campaign.clicks}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <UserPlusIcon className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Leads</p>
                                <p className="text-2xl font-bold text-white font-display">{campaign.leads}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <ChartBarIcon className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Cost Per Lead</p>
                                <p className="text-2xl font-bold text-white font-display">
                                    ₹{campaign.leads > 0 ? (campaign.spend / campaign.leads).toFixed(0) : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Trend */}
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6 shadow-soft">
                        <h3 className="text-lg font-bold text-white font-display mb-6">Performance Trend (Last 7 Days)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={campaign.dailyBreakdown}>
                                    <defs>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#E5E7EB' }}
                                    />
                                    <Area type="monotone" dataKey="spend" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Demographics */}
                    <div className="bg-[#161B22] border border-white/5 rounded-xl p-6 shadow-soft">
                        <h3 className="text-lg font-bold text-white font-display mb-6">Audience Demographics</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={campaign.demographics.age} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#6B7280" hide />
                                    <YAxis dataKey="range" type="category" stroke="#6B7280" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    />
                                    <Bar dataKey="percentage" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
