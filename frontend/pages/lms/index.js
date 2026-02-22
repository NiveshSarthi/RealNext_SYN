import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { metaAdsAPI, leadsAPI, internalLeadsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function LMS() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 1. Fetch Facebook Pages (for active campaigns count)
    const { data: pages = [] } = useQuery({
        queryKey: ['facebook-pages'],
        queryFn: async () => {
            const res = await metaAdsAPI.getPages();
            const extractedData = res.data?.data || res.data || [];
            return Array.isArray(extractedData) ? extractedData : [];
        },
        enabled: !!user,
    });

    // 2. Fetch Lead Stats
    const { data: statsData } = useQuery({
        queryKey: ['lead-stats-overview'],
        queryFn: async () => {
            const res = await leadsAPI.getStats();
            return res.data?.data || {};
        },
        enabled: !!user,
    });

    // 3. Fetch Recent Activity (latest 5 leads)
    const { data: recentLeads } = useQuery({
        queryKey: ['recent-leads'],
        queryFn: async () => {
            const res = await internalLeadsAPI.getLeads({ limit: 5, sort: '-created_at' });
            return res.data?.data || [];
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading]);

    if (authLoading) {
        return (
            <Layout>
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    // Calculations based on API data
    const totalLeads = statsData?.details?.total_leads || 0;
    const activeCampaigns = pages.length;
    const conversionRate = statsData?.details?.conversion_rate?.toFixed(1) || 0;
    const todayIntake = statsData?.details?.today_count || 0;

    // Pipeline mapping
    const getStageCount = (stageName) => {
        const stageObj = statsData?.by_stage?.find(s => s.stage === stageName);
        return stageObj ? stageObj.count : 0;
    };

    // Source mapping (Top 4 for chart)
    const sources = statsData?.by_source?.sort((a, b) => b.count - a.count).slice(0, 4) || [];
    const maxSourceCount = Math.max(...sources.map(s => s.count), 1); // Avoid div by 0

    return (
        <Layout>
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display animate-fade-in">
                {/* Header */}
                <header className="h-16 border-b border-border-dark bg-background-dark/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white tracking-tight">Sales Overview</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-card-dark rounded-lg px-3 py-1.5 border border-border-dark hidden sm:flex">
                            <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2">calendar_today</span>
                            <span className="text-sm font-medium text-slate-200">Live Data</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                    <div className="w-full mx-auto flex flex-col gap-6">
                        {/* KPI Summary Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* KPI 1 */}
                            <div className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-[#f49d25]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-slate-400">Total Leads</p>
                                    <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full">All Time</span>
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">{totalLeads.toLocaleString()}</h3>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 translate-y-2 group-hover:translate-y-1 transition-transform">
                                    <svg className="w-full h-full stroke-[#f49d25] fill-none stroke-2" preserveAspectRatio="none" viewBox="0 0 100 25">
                                        <path d="M0 20 C 10 20, 15 5, 25 10 C 35 15, 45 20, 55 10 C 65 0, 75 15, 85 10 C 95 5, 100 15, 100 15" vectorEffect="non-scaling-stroke"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* KPI 2 */}
                            <div className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-[#f49d25]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-slate-400">Active Integrations</p>
                                    <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-0.5 rounded-full">Live</span>
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">{activeCampaigns}</h3>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 translate-y-2 group-hover:translate-y-1 transition-transform">
                                    <svg className="w-full h-full stroke-blue-500 fill-none stroke-2" preserveAspectRatio="none" viewBox="0 0 100 25">
                                        <path d="M0 15 C 20 15, 30 15, 40 10 C 50 5, 60 5, 70 15 C 80 25, 90 20, 100 15" vectorEffect="non-scaling-stroke"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* KPI 3 */}
                            <div className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-[#f49d25]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-slate-400">Hot/Closure Rate</p>
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">{conversionRate}%</h3>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 translate-y-2 group-hover:translate-y-1 transition-transform">
                                    <svg className="w-full h-full stroke-emerald-500 fill-none stroke-2" preserveAspectRatio="none" viewBox="0 0 100 25">
                                        <path d="M0 25 L 20 20 L 40 15 L 60 20 L 80 10 L 100 5" vectorEffect="non-scaling-stroke"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* KPI 4 */}
                            <div className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-[#f49d25]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-slate-400">Today's Intake</p>
                                    <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">New</span>
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">{todayIntake}</h3>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 translate-y-2 group-hover:translate-y-1 transition-transform">
                                    <svg className="w-full h-full stroke-purple-500 fill-none stroke-2" preserveAspectRatio="none" viewBox="0 0 100 25">
                                        <path d="M0 25 L 20 20 L 40 20 L 60 10 L 80 5 L 100 0" vectorEffect="non-scaling-stroke"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Main Panel */}
                            <div className="lg:col-span-9 flex flex-col gap-6">
                                {/* Lead Pipeline */}
                                <div className="bg-card-dark border border-border-dark rounded-xl p-6">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="text-white font-semibold text-lg">Lead Pipeline (Active Stages)</h3>
                                        <button onClick={() => router.push('/lms/leads')} className="text-[#f49d25] text-sm font-medium hover:underline">View Leads</button>
                                    </div>
                                    <div className="relative pt-6 pb-2 overflow-x-auto scrollbar-hide">
                                        <div className="min-w-[500px]">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-background-dark rounded-full overflow-hidden mt-2">
                                                <div className="h-full bg-gradient-to-r from-[#f49d25]/60 to-[#f49d25] w-[70%] rounded-full"></div>
                                            </div>
                                            <div className="flex justify-between relative px-2">
                                                {['Screening', 'Follow-up', 'Site Visit', 'Negotiation', 'Closure'].map((stage, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => router.push(`/lms/leads?stage=${stage}`)}>
                                                        <div className={`w-4 h-4 rounded-full ${idx < 3 ? 'bg-[#f49d25] border-[#2e2419] shadow-[0_0_0_2px_#f49d25]' : 'bg-background-dark border-slate-600'} border-4 relative z-10 -mt-3`}></div>
                                                        <div className="text-center">
                                                            <p className={`text-xs font-semibold uppercase tracking-wider ${idx < 3 ? 'text-white' : 'text-slate-500'}`}>{stage}</p>
                                                            <p className={`text-sm font-bold mt-0.5 ${idx < 3 ? 'text-slate-400' : 'text-slate-600'}`}>{getStageCount(stage)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Bar Chart */}
                                    <div className="bg-card-dark border border-border-dark rounded-xl p-6 flex flex-col h-80">
                                        <h3 className="text-white font-semibold text-lg mb-6">Lead Source Distribution</h3>
                                        <div className="flex-1 flex items-end justify-between gap-4 px-2">
                                            {sources.map((src, i) => {
                                                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-[#f49d25]', 'bg-purple-500'];
                                                const height = `${(src.count / maxSourceCount) * 85}%`;
                                                return (
                                                    <div key={i} className="flex flex-col items-center gap-2 w-full group">
                                                        <div className="w-full bg-background-dark rounded-t-sm relative h-40">
                                                            <div className={`absolute bottom-0 left-0 right-0 ${colors[i % 4]} rounded-t-sm transition-colors group-hover:opacity-80`} style={{ height }}></div>
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium truncate max-w-full" title={src.source || 'Unknown'}>{src.source || 'Unknown'}</span>
                                                    </div>
                                                );
                                            })}
                                            {sources.length === 0 && (
                                                <div className="w-full text-center text-slate-500 text-sm pb-8">No source data available</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Abstract Line Chart */}
                                    <div className="bg-card-dark border border-border-dark rounded-xl p-6 flex flex-col h-80 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4 z-10">
                                            <h3 className="text-white font-semibold text-lg">Inbound Momentum</h3>
                                            <div className="flex gap-2">
                                                <span className="w-3 h-3 rounded-full bg-[#f49d25] mt-1.5"></span>
                                                <span className="text-xs text-slate-400">Trend</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative mt-4">
                                            <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-600 pointer-events-none">
                                                <div className="border-b border-white/5 w-full h-0"></div>
                                                <div className="border-b border-white/5 w-full h-0"></div>
                                                <div className="border-b border-white/5 w-full h-0"></div>
                                            </div>
                                            <div className="absolute inset-0 flex items-end justify-between px-2 pt-4">
                                                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                                    <path d="M0 80 Q 50 100, 100 60 T 200 70 T 300 30 T 400 50 T 500 10" fill="none" stroke="#f49d25" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                                                    <path d="M0 80 Q 50 100, 100 60 T 200 70 T 300 30 T 400 50 T 500 10 V 150 H 0 Z" fill="url(#gradientStitch)" opacity="0.2" stroke="none" vectorEffect="non-scaling-stroke"></path>
                                                    <defs>
                                                        <linearGradient id="gradientStitch" x1="0%" x2="0%" y1="0%" y2="100%">
                                                            <stop offset="0%" style={{ stopColor: '#f49d25', stopOpacity: 1 }}></stop>
                                                            <stop offset="100%" style={{ stopColor: '#f49d25', stopOpacity: 0 }}></stop>
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="w-full flex justify-between text-xs text-slate-500 pt-2 absolute bottom-[-24px]">
                                                    <span>T-6</span><span>T-5</span><span>T-4</span><span>T-3</span><span>T-2</span><span>T-1</span><span>Now</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel (Actions & Activity) */}
                            <div className="lg:col-span-3 flex flex-col gap-6">
                                {/* Quick Actions */}
                                <div className="bg-card-dark border border-border-dark rounded-xl p-5">
                                    <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => router.push('/lms/leads?new=true')} className="flex items-center justify-center gap-2 w-full bg-[#f49d25] hover:bg-orange-500 text-background-dark font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-900/20">
                                            <span className="material-symbols-outlined text-[20px]">add</span>
                                            Add New Lead
                                        </button>
                                        <button onClick={() => router.push('/lms/manager')} className="flex items-center justify-center gap-2 w-full bg-[#493922] hover:bg-[#5a462b] text-white text-sm font-medium py-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-600">
                                            <span className="material-symbols-outlined text-[18px]">sync</span>
                                            Integrations Setup
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity Feed */}
                                <div className="bg-card-dark border border-border-dark rounded-xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
                                    <div className="p-5 border-b border-border-dark flex justify-between items-center">
                                        <h3 className="text-white font-semibold text-lg">Recent Flow</h3>
                                        <button onClick={() => router.push('/lms/leads')} className="text-xs text-[#f49d25] font-medium hover:underline">View All</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                                        <ul className="flex flex-col">
                                            {recentLeads?.length > 0 ? recentLeads.map((lead) => {
                                                const timeAgo = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true });
                                                // Rotate icons/colors for visual variety in the dashboard
                                                const icons = [
                                                    { bg: 'bg-blue-500/20', text: 'text-blue-500', icon: 'person_add' },
                                                    { bg: 'bg-emerald-500/20', text: 'text-emerald-500', icon: 'campaign' },
                                                    { bg: 'bg-[#f49d25]/20', text: 'text-[#f49d25]', icon: 'mail' },
                                                ];
                                                const style = icons[lead.name.length % icons.length];

                                                return (
                                                    <li key={lead._id || lead.id} onClick={() => router.push(`/lms/leads?id=${lead._id || lead.id}`)} className="flex gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                                        <div className={`mt-1 h-8 w-8 rounded-full ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                                                            <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-sm text-slate-200">New lead <span className="font-semibold text-white truncate max-w-[150px] inline-block align-bottom">{lead.name || 'Unknown'}</span></p>
                                                            <p className="text-xs text-slate-500">{timeAgo} • {lead.source || 'Manual'}</p>
                                                        </div>
                                                    </li>
                                                );
                                            }) : (
                                                <li className="p-4 text-center text-sm text-slate-500">No recent activity</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Layout>
    );
}

