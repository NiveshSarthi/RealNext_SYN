import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import { campaignsAPI, analyticsAPI } from '../../../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    ChartBarIcon,
    CursorArrowRaysIcon,
    EnvelopeIcon,
    EnvelopeOpenIcon,
    NoSymbolIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function CampaignAnalytics() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user && id) {
            fetchData();
        }
    }, [user, authLoading, id]);

    const fetchData = async () => {
        try {
            const [campaignRes] = await Promise.all([
                campaignsAPI.getCampaign(id),
                // Add more analytics calls here if endpoints exist
            ]);
            setCampaign(campaignRes.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    if (!campaign) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Campaign Not Found</h2>
                    <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:text-blue-500">
                        Go Back
                    </button>
                </div>
            </Layout>
        );
    }

    const stats = [
        { name: 'Sent', value: campaign.sent_count || 0, icon: EnvelopeIcon, color: 'text-blue-600' },
        { name: 'Delivered', value: campaign.delivered_count || 0, icon: EnvelopeOpenIcon, color: 'text-green-600' },
        { name: 'Read', value: campaign.read_count || 0, icon: CursorArrowRaysIcon, color: 'text-purple-600' },
        { name: 'Failed', value: campaign.failed_count || 0, icon: NoSymbolIcon, color: 'text-red-600' },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{campaign.name} Analytics</h1>
                            <p className="text-sm text-gray-500">Performance report for this campaign</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <item.icon className={`h-6 w-6 ${item.color}`} />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                            <dd className="text-lg font-bold text-gray-900">{item.value}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white p-6 shadow rounded-lg h-80 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                        <ChartBarIcon className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Delivery Timeline coming soon</p>
                    </div>
                    <div className="bg-white p-6 shadow rounded-lg h-80 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                        <CursorArrowRaysIcon className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Engagement Metrics coming soon</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
