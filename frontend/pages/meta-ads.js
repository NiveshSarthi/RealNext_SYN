import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { metaAdsAPI } from '../utils/api';
import {
    MegaphoneIcon,
    CurrencyRupeeIcon,
    CursorArrowRaysIcon,
    UserPlusIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function MetaAds() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user) {
            fetchCampaigns();
        }
    }, [user, authLoading]);

    const fetchCampaigns = async () => {
        try {
            const res = await metaAdsAPI.getCampaigns();
            const data = res.data;
            setCampaigns(Array.isArray(data) ? data : (data.data || []));
            setLoading(false);
        } catch (error) {
            console.error(error);
            // Mock data fallback
            setCampaigns([
                { id: 'cam_1', name: 'Luxury Villas Promo', status: 'ACTIVE', spend: 4500, clicks: 120, leads: 15 },
                { id: 'cam_2', name: 'Budget Homes', status: 'PAUSED', spend: 1200, clicks: 45, leads: 2 },
            ]);
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                </div>
            </Layout>
        );
    }

    const totalActive = campaigns.filter(c => c.status === 'ACTIVE').length;
    const totalSpend = campaigns.reduce((acc, curr) => acc + curr.spend, 0);

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in content-container pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Meta Ads Manager</h1>
                        <p className="mt-1 text-sm text-gray-400">Manage your Facebook & Instagram campaigns.</p>
                    </div>
                    <button
                        onClick={() => router.push('/meta-ads/new')}
                        className="btn btn-primary bg-primary text-black font-bold px-5 py-2.5 rounded-lg flex items-center hover:bg-orange-600 transition-all shadow-glow-sm"
                    >
                        <MegaphoneIcon className="h-5 w-5 mr-2" />
                        Create Campaign
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Summary Cards */}
                    <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-6 hover:border-primary/30 transition-all duration-300">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                <MegaphoneIcon className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dt className="text-sm font-medium text-gray-400 truncate">Total Active</dt>
                                <dd className="text-2xl font-bold text-white font-display mt-1">{totalActive} Campaigns</dd>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-6 hover:border-primary/30 transition-all duration-300">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                                <CurrencyRupeeIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dt className="text-sm font-medium text-gray-400 truncate">Total Spend</dt>
                                <dd className="text-2xl font-bold text-white font-display mt-1">₹{totalSpend.toLocaleString()}</dd>
                            </div>
                        </div>
                    </div>
                    {/* Added placeholders for visual balance */}
                    <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-6 hover:border-primary/30 transition-all duration-300 opacity-60">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                                <CursorArrowRaysIcon className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dt className="text-sm font-medium text-gray-400 truncate">Total Clicks</dt>
                                <dd className="text-2xl font-bold text-white font-display mt-1">753</dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-6 hover:border-primary/30 transition-all duration-300 opacity-60">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                                <ChartBarIcon className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dt className="text-sm font-medium text-gray-400 truncate">Avg CPC</dt>
                                <dd className="text-2xl font-bold text-white font-display mt-1">₹12.5</dd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#161B22] border border-white/5 rounded-xl shadow-soft overflow-hidden">
                    <ul className="divide-y divide-white/5">
                        {campaigns.map((campaign) => (
                            <li key={campaign.id} className="hover:bg-white/5 transition-colors duration-150">
                                <div className="px-6 py-5 sm:px-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className={`h-2.5 w-2.5 rounded-full mr-3 ${campaign.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                campaign.status === 'PAUSED' ? 'bg-yellow-500' : 'bg-gray-500'
                                                }`}></div>
                                            <p className="text-lg font-bold text-white font-display truncate">{campaign.name}</p>
                                        </div>
                                        <div className="flex-shrink-0 flex">
                                            <p className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded border ${campaign.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                campaign.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {campaign.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between items-center bg-black/20 rounded-lg p-3">
                                        <div className="sm:flex sm:space-x-8">
                                            <p className="flex items-center text-sm text-gray-400">
                                                <CurrencyRupeeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                                                Spend: <span className="text-white font-medium ml-1">₹{campaign.spend.toLocaleString()}</span>
                                            </p>
                                            <p className="flex items-center text-sm text-gray-400 mt-2 sm:mt-0">
                                                <CursorArrowRaysIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                                                Clicks: <span className="text-white font-medium ml-1">{campaign.clicks}</span>
                                            </p>
                                            <p className="flex items-center text-sm text-gray-400 mt-2 sm:mt-0">
                                                <UserPlusIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                                                Leads: <span className="text-white font-medium ml-1">{campaign.leads}</span>
                                            </p>
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <button
                                                onClick={() => router.push(`/meta-ads/${campaign.id}`)}
                                                className="text-xs font-bold text-primary hover:text-white transition-colors bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary shadow-glow-sm"
                                            >
                                                View Insights &rarr;
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
