import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { metaAdsAPI } from '../../utils/api';
import {
    Facebook,
    RefreshCw,
    AlertCircle,
    FileText,
    Trash2,
    Users,
    Download,
    Power,
    CheckCircle2,
    ArrowRight,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '../ui/Switch';
import { motion, AnimatePresence } from 'framer-motion';

export default function FacebookConnectionManager() {
    const [userToken, setUserToken] = useState('');
    const queryClient = useQueryClient();

    // Fetch Connected Pages
    const { data: pages = [], isLoading, error } = useQuery({
        queryKey: ['facebook-pages'],
        queryFn: async () => {
            try {
                const res = await metaAdsAPI.getPages();
                // Ensure we handle both { data: [...] } and { success: true, data: [...] }
                const extractedData = res.data?.data || res.data || [];
                return Array.isArray(extractedData) ? extractedData : [];
            } catch (err) {
                console.error('Error fetching pages:', err);
                return [];
            }
        },
    });

    // Connect Account Mutation
    const connectAccountMutation = useMutation({
        mutationFn: async ({ user_token }) => {
            const res = await metaAdsAPI.connectAccount({ user_token });
            return res.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries(['facebook-pages']);
            toast.success(data.message || 'Pages connected successfully');
            setUserToken('');
        },
        onError: (error) => {
            const msg = error.response?.data?.error || error.message;
            toast.error(`Connection Failed: ${msg}`);
        }
    });

    // Sync Forms Mutation
    const syncFormsMutation = useMutation({
        mutationFn: async () => {
            const res = await metaAdsAPI.syncForms();
            return res.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries(['facebook-pages']);
            toast.success(data.new_forms > 0 ? `Found ${data.new_forms} new form(s)` : 'All forms are up to date');
        },
        onError: (error) => {
            toast.error(`Sync failed: ${error.message}`);
        }
    });

    // Fetch Leads Mutation
    const fetchLeadsMutation = useMutation({
        mutationFn: async () => {
            const res = await metaAdsAPI.fetchLeads();
            return res.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries(['leads']);
            toast.success(`${data.newLeadsCreated} new lead(s) imported. (${data.duplicatesSkipped} duplicates skipped)`);
        },
        onError: (error) => {
            toast.error(`Fetch leads failed: ${error.message}`);
        }
    });

    // Toggle Page Sync Mutation
    const toggleSyncMutation = useMutation({
        mutationFn: async ({ pageId, is_enabled }) => {
            const res = await metaAdsAPI.togglePageSync(pageId, { is_enabled });
            return res.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries(['facebook-pages']);
            toast.success(data.message || 'Sync settings updated');
        },
        onError: (error) => {
            toast.error(`Failed to update sync: ${error.message}`);
        }
    });

    const handleConnectAccount = () => {
        if (!userToken) {
            toast.error('Please enter User Access Token');
            return;
        }
        connectAccountMutation.mutate({ user_token: userToken });
    };

    return (
        <div className="space-y-8">
            <Card className="bg-[#161B22]/60 backdrop-blur-xl border-[#1F2937] text-white shadow-2xl overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                <CardHeader className="pb-6 border-b border-gray-800/50 bg-[#161B22]/40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 border border-blue-400/20">
                                <Facebook className="w-7 h-7" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-white tracking-tight">Facebook Lead Sync</CardTitle>
                                <CardDescription className="text-gray-400 mt-0.5">Automate real-time lead capture from your Social channels</CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 gap-2 border-gray-700 bg-[#0D1117] hover:bg-gray-800 text-gray-300 transition-all active:scale-95"
                                onClick={() => syncFormsMutation.mutate()}
                                disabled={syncFormsMutation.isPending || pages.length === 0}
                            >
                                <RefreshCw className={`w-4 h-4 ${syncFormsMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync Forms
                            </Button>
                            <Button
                                size="sm"
                                className="h-10 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border-0 transition-all active:scale-95"
                                onClick={() => fetchLeadsMutation.mutate()}
                                disabled={fetchLeadsMutation.isPending || pages.length === 0}
                            >
                                <Download className={`w-4 h-4 ${fetchLeadsMutation.isPending ? 'animate-spin' : ''}`} />
                                Fetch Leads
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8 p-8">
                    {/* Setup Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0D1117]/80 border border-gray-800 rounded-2xl p-6 shadow-inner"
                    >
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    Configure Connection
                                </h4>
                                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                    Get Token <ArrowRight className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="flex gap-3 flex-col lg:flex-row">
                                <div className="relative flex-1">
                                    <input
                                        type="password"
                                        placeholder="Paste User Access Token (pages_show_list, leads_retrieval)"
                                        value={userToken}
                                        onChange={(e) => setUserToken(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-[#161B22] border border-gray-700 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder:text-gray-500 shadow-sm"
                                    />
                                </div>
                                <Button
                                    onClick={handleConnectAccount}
                                    disabled={connectAccountMutation.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-500 h-auto py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-900/20 font-semibold transition-all active:scale-95"
                                >
                                    {connectAccountMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Connect Pages</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 px-1 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 text-gray-600" />
                                Your token will be used to fetch pages and setup real-time webhooks.
                            </p>
                        </div>
                    </motion.div>

                    {/* Connected Pages Section */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Connected Pages ({pages.length})</h4>
                            {pages.length > 0 && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    ACTIVE AUTO-SYNC
                                </span>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-20 bg-[#0D1117]/40 rounded-3xl border border-gray-800/50"
                                >
                                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-gray-500 font-medium">Retrieving connected pages...</p>
                                </motion.div>
                            ) : pages.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="text-center py-16 bg-[#0D1117]/40 rounded-3xl border-2 border-dashed border-gray-800/50 flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center text-gray-600 mb-6">
                                        <Facebook className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-gray-400 text-lg font-medium">No Facebook pages connected yet</p>
                                    <p className="text-gray-600 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                                        Paste your access token above to begin syncing leads from your Facebook & Instagram pages.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                >
                                    {pages.map((page, idx) => (
                                        <motion.div
                                            key={page.id || page._id || idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative border border-gray-800 bg-[#0D1117] rounded-2xl p-5 hover:border-indigo-500/40 hover:bg-[#161B22]/40 transition-all duration-300 shadow-lg hover:shadow-indigo-900/5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-900/40 to-blue-900/40 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:scale-110 transition-transform">
                                                        {page.page_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">{page.page_name}</h3>
                                                        <p className="text-[10px] font-mono text-gray-500 tracking-wider mt-0.5">ID: {page.page_id}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${page.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {page.status || 'ACTIVE'}
                                                </div>
                                            </div>

                                            {/* Settings Action */}
                                            <div className="mt-6 pt-5 border-t border-gray-800/50 flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${page.is_lead_sync_enabled !== false ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>
                                                            <Power className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-300 font-semibold">Auto-import Leads</span>
                                                            <p className="text-[9px] text-gray-500">New leads from forms will sync instantly</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={page.is_lead_sync_enabled !== false}
                                                        onCheckedChange={(checked) => {
                                                            toggleSyncMutation.mutate({
                                                                pageId: page.id || page._id,
                                                                is_enabled: checked
                                                            });
                                                        }}
                                                        disabled={toggleSyncMutation.isPending}
                                                    />
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-gray-400 group/link cursor-help">
                                                            <FileText className="w-3.5 h-3.5 text-blue-500/70" />
                                                            <span className="text-[11px] font-bold text-gray-200">{page.leadForms?.length || 0}</span>
                                                            <span className="text-[10px] font-medium text-gray-500">Forms</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-500">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                                                            <span className="text-[11px] font-bold text-gray-200">{page.metadata?.total_leads || 0}</span>
                                                            <span className="text-[10px] font-medium text-gray-500">Total</span>
                                                        </div>
                                                    </div>

                                                    {page.last_sync_at && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                                                            <RefreshCw className="w-3 h-3 transition-transform group-hover:rotate-180 duration-500" />
                                                            {formatDistanceToNow(new Date(page.last_sync_at), { addSuffix: true })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            {/* Help Card */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="bg-gradient-to-r from-[#161B22] to-[#0D1117] border-[#1F2937] border shadow-xl">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                <AlertCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">Sync Security & Best Practices</h4>
                                <p className="text-xs text-gray-500 mt-1 max-w-lg">
                                    We use the official Meta Graph API. Ensure your token has <code className="text-blue-400 bg-blue-400/5 px-1 rounded">pages_manage_ads</code> for full automation.
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white group">
                            Guide <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
    );
}
