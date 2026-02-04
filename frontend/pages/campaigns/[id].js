import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI, templatesAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    PencilIcon,
    ChartBarIcon,
    PlayIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

export default function CampaignDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user && id) {
            fetchCampaign();
        }
    }, [user, authLoading, id]);

    const fetchCampaign = async () => {
        try {
            const response = await campaignsAPI.getCampaign(id);
            const campaignData = response.data.data;
            setCampaign(campaignData);

            // Fetch template if exists
            if (campaignData.templateId || campaignData.template_id) {
                const templateId = campaignData.templateId || campaignData.template_id;
                try {
                    const templatesRes = await templatesAPI.getTemplates();
                    const foundTemplate = templatesRes.data.data.find(t => t.id === templateId);
                    setTemplate(foundTemplate);
                } catch (err) {
                    console.error('Failed to fetch template:', err);
                }
            }
        } catch (error) {
            console.error('Failed to fetch campaign:', error);
            toast.error('Failed to load campaign');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!confirm(`Are you sure you want to send the campaign "${campaign.name}"?`)) {
            return;
        }

        setSending(true);
        try {
            await campaignsAPI.sendCampaign(id);
            toast.success('Campaign sent successfully!');
            fetchCampaign();
        } catch (error) {
            console.error('Failed to send campaign:', error);
            toast.error(error.response?.data?.message || 'Failed to send campaign');
        } finally {
            setSending(false);
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
                    <p className="mt-2 text-gray-600">The campaign you are looking for does not exist or has been deleted.</p>
                    <Link href="/campaigns" className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-500">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Campaigns
                    </Link>
                </div>
            </Layout>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'running': return 'bg-blue-100 text-blue-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'scheduled': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <div className="flex space-x-3">
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                <PlayIcon className="h-4 w-4 mr-2" />
                                {sending ? 'Sending...' : 'Send Campaign'}
                            </button>
                        )}
                        <button
                            onClick={() => router.push(`/campaigns/${id}/edit`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                        </button>
                        <button
                            onClick={() => router.push(`/campaigns/${id}/analytics`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ChartBarIcon className="h-4 w-4 mr-2" />
                            Analytics
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                                <p className="mt-2 text-gray-600">{campaign.description || 'No description'}</p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(campaign.status)}`}>
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <UsersIcon className="h-6 w-6 text-blue-500" />
                                    <span className="ml-2 text-sm font-medium text-gray-500">Recipients</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold text-gray-900">{campaign.total_recipients || 0}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />
                                    <span className="ml-2 text-sm font-medium text-gray-500">Sent</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold text-gray-900">{campaign.sentCount || campaign.sent_count || 0}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <CalendarIcon className="h-6 w-6 text-purple-500" />
                                    <span className="ml-2 text-sm font-medium text-gray-500">Scheduled At</span>
                                </div>
                                <div className="mt-2 text-lg font-bold text-gray-900">
                                    {campaign.scheduledAt || campaign.scheduled_at
                                        ? new Date(campaign.scheduledAt || campaign.scheduled_at).toLocaleDateString()
                                        : 'Not Scheduled'}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <ChartBarIcon className="h-6 w-6 text-orange-500" />
                                    <span className="ml-2 text-sm font-medium text-gray-500">Response Rate</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold text-gray-900">0%</div>
                            </div>
                        </div>

                        {/* Template Info */}
                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h3>
                            {template ? (
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase mt-1">
                                                {template.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                        {template.content?.body || (typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500 mb-2">No template selected for this campaign</p>
                                    <Link href={`/campaigns/${id}/edit`} className="text-blue-600 hover:text-blue-500 font-medium">
                                        Select Template
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
