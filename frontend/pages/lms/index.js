import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { metaAdsAPI, internalLeadsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    Zap,
    FileText,
    Target,
    TrendingUp,
    Activity,
    Facebook,
    Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function LMS() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Fetch Facebook Pages (for forms count)
    const { data: pagesData } = useQuery({
        queryKey: ['facebook-pages'],
        queryFn: async () => {
            const res = await metaAdsAPI.getPages();
            return res.data;
        },
        enabled: !!user,
    });

    // Fetch Internal Leads
    const { data: leadsData } = useQuery({
        queryKey: ['internal-leads-stats'],
        queryFn: async () => {
            const res = await internalLeadsAPI.getLeads({ limit: 1000 });
            return res.data;
        },
        enabled: !!user,
    });

    // Calculate statistics
    const totalForms = pagesData?.pages?.reduce((acc, page) => {
        return acc + (page.leadForms?.length || 0);
    }, 0) || 0;

    const totalPages = pagesData?.pages?.length || 0;
    const totalLeads = leadsData?.total || leadsData?.data?.length || 0;
    const metaLeads = leadsData?.data?.filter(lead => lead.source === 'Facebook Ads')?.length || 0;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading]);

    if (authLoading) {
        return (
            <Layout>
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </Layout>
        );
    }

    const stats = [
        {
            title: 'Total Lead Forms',
            value: totalForms,
            description: `Across ${totalPages} connected page${totalPages !== 1 ? 's' : ''}`,
            icon: FileText,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            title: 'Total Leads',
            value: totalLeads,
            description: `${metaLeads} from Meta Ads`,
            icon: Users,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
        },
        {
            title: 'Connected Pages',
            value: totalPages,
            description: 'Facebook pages synced',
            icon: Facebook,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
    ];

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in container-custom py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Lead Management System</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push('/lms/leads')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            My Leads
                        </Button>
                        <Button
                            onClick={() => router.push('/lms/manager')}
                            variant="outline"
                            className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Integrations
                        </Button>
                    </div>
                </div>

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <Card
                            key={index}
                            className={`group hover:border-indigo-500/50 transition-all bg-[#161B22] border-[#1F2937] ${stat.borderColor} hover:shadow-lg hover:shadow-indigo-500/10`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex items-center gap-1 text-green-400 text-xs">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Live</span>
                                    </div>
                                </div>
                                <CardTitle className="mt-4 text-white text-sm font-medium text-gray-400">
                                    {stat.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-4xl font-bold text-white">
                                        {stat.value.toLocaleString()}
                                    </div>
                                    <CardDescription className="text-gray-500 text-xs">
                                        {stat.description}
                                    </CardDescription>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card className="bg-[#161B22] border-[#1F2937]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage your lead generation and integrations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                onClick={() => router.push('/lms/manager')}
                                className="bg-[#0D1117] hover:bg-gray-800 text-white border border-gray-700 h-auto py-4 flex-col items-start gap-2"
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Zap className="w-5 h-5 text-indigo-400" />
                                    <span className="font-semibold">Connect Facebook</span>
                                </div>
                                <span className="text-xs text-gray-400 text-left">
                                    Sync lead forms from your pages
                                </span>
                            </Button>
                            <Button
                                onClick={() => router.push('/lms/leads')}
                                className="bg-[#0D1117] hover:bg-gray-800 text-white border border-gray-700 h-auto py-4 flex-col items-start gap-2"
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Users className="w-5 h-5 text-green-400" />
                                    <span className="font-semibold">View All Leads</span>
                                </div>
                                <span className="text-xs text-gray-400 text-left">
                                    Manage and track your prospects
                                </span>
                            </Button>
                            <Button
                                onClick={() => router.push('/lms/manager')}
                                className="bg-[#0D1117] hover:bg-gray-800 text-white border border-gray-700 h-auto py-4 flex-col items-start gap-2"
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Target className="w-5 h-5 text-purple-400" />
                                    <span className="font-semibold">Setup Webhooks</span>
                                </div>
                                <span className="text-xs text-gray-400 text-left">
                                    Enable real-time lead sync
                                </span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Banner */}
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Real-time Lead Notifications</h3>
                                <p className="text-gray-400 text-sm">
                                    All leads from your connected integrations are automatically synced to your "My Leads" page.
                                    Configure webhooks for instant notifications when new leads arrive.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
