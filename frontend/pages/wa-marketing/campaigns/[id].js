import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { campaignsAPI, templatesAPI } from '../../../utils/api';
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
    CalendarIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-soft hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400 truncate">{title}</p>
                <div className="flex items-baseline mt-2">
                    <p className="text-2xl font-bold text-white font-display">{value}</p>
                </div>
            </div>
            <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);

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
        if (!confirm(`Are you sure you want to send the campaign "${campaign?.name || 'this campaign'}"?`)) {
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
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'running': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'scheduled': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getStatusIcon = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'completed': return CheckCircleIcon;
            case 'running': return PlayIcon;
            case 'failed': return XCircleIcon;
            case 'scheduled': return CalendarIcon;
            default: return ClockIcon;
        }
    };

    const StatusIcon = getStatusIcon(campaign.status);

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in content-container">
                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <div className="flex space-x-3">
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                variant="primary"
                                className="h-9 shadow-glow-sm"
                            >
                                <PlayIcon className="h-4 w-4 mr-2" />
                                {sending ? 'Sending...' : 'Send Campaign'}
                            </Button>
                        )}
                        <Button
                            onClick={() => router.push(`/campaigns/${id}/edit`)}
                            variant="outline"
                            className="h-9"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            onClick={() => router.push(`/campaigns/${id}/analytics`)}
                            variant="outline"
                            className="h-9"
                        >
                            <ChartBarIcon className="h-4 w-4 mr-2" />
                            Analytics
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
                    <div className="px-6 py-10">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight font-display">{campaign.name || 'Untitled Campaign'}</h1>
                                <p className="mt-2 text-gray-400">{campaign.description || 'No description provided'}</p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${getStatusColor(campaign.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                {(campaign.status || 'draft').toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Recipients"
                                value={campaign.total_contacts || campaign.total_recipients || 0}
                                icon={UsersIcon}
                                color="blue-500"
                            />
                            <StatCard
                                title="Sent"
                                value={campaign.stats?.sent || campaign.sentCount || campaign.sent_count || 0}
                                icon={ChatBubbleLeftRightIcon}
                                color="green-500"
                            />
                            <StatCard
                                title="Scheduled At"
                                value={campaign.scheduledAt || campaign.scheduled_at
                                    ? new Date(campaign.scheduledAt || campaign.scheduled_at).toLocaleDateString()
                                    : 'Not Scheduled'}
                                icon={CalendarIcon}
                                color="purple-500"
                            />
                            <StatCard
                                title="Response Rate"
                                value="0%"
                                icon={ChartBarIcon}
                                color="orange-500"
                            />
                        </div>

                        {/* Template Info */}
                        <div className="mt-12 border-t border-border/50 pt-10">
                            <h3 className="text-lg font-semibold text-white mb-6">Message Content</h3>
                            {template ? (
                                <div className="bg-[#0E1117] rounded-xl p-8 border border-border/50 shadow-inner">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">{template.name}</h4>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
                                                {template.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                                        {template.content?.body || (typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#0E1117]/50 rounded-xl p-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 group transition-all hover:border-primary/20">
                                    <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                                        <PaperAirplaneIcon className="h-10 w-10 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                                    </div>
                                    <p className="text-gray-400 mb-6 font-medium text-center max-w-xs">No template selected for this campaign. Select one to see content preview.</p>
                                    <Button
                                        onClick={() => router.push(`/campaigns/${id}/edit`)}
                                        variant="outline"
                                        className="shadow-soft hover:border-primary/50"
                                    >
                                        Select Template
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
