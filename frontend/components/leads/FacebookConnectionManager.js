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
    Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '../ui/Switch';

export default function FacebookConnectionManager() {
    const [userToken, setUserToken] = useState('');
    const queryClient = useQueryClient();

    // Fetch Connected Pages
    const { data: pages = [], isLoading, error } = useQuery({
        queryKey: ['facebook-pages'],
        queryFn: async () => {
            try {
                const res = await metaAdsAPI.getPages();
                console.log('API Response:', res);
                console.log('res.data:', res.data);
                const data = res.data?.data || res.data?.pages || [];
                console.log('Extracted data:', data);
                console.log('Is array?', Array.isArray(data));
                return Array.isArray(data) ? data : [];
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

    // Debug: Log pages value at render time
    console.log('=== RENDER DEBUG ===');
    console.log('pages:', pages);
    console.log('typeof pages:', typeof pages);
    console.log('Array.isArray(pages):', Array.isArray(pages));
    console.log('pages.length:', pages?.length);
    console.log('===================');

    return (
        <div className="space-y-6">
            <Card className="bg-[#161B22] border-[#1F2937] text-white shadow-xl">
                <CardHeader className="pb-4 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                <Facebook className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-white">Facebook Lead Sync</CardTitle>
                                <CardDescription className="text-gray-400">Automate lead capture from Facebook/Instagram Forms</CardDescription>
                            </div>
                        </div>
                        {pages.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-gray-700 bg-transparent hover:bg-white/5 text-gray-300"
                                    onClick={() => syncFormsMutation.mutate()}
                                    disabled={syncFormsMutation.isPending}
                                >
                                    <RefreshCw className={`w-4 h-4 ${syncFormsMutation.isPending ? 'animate-spin' : ''}`} />
                                    Sync Forms
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => fetchLeadsMutation.mutate()}
                                    disabled={fetchLeadsMutation.isPending}
                                >
                                    <Download className={`w-4 h-4 ${fetchLeadsMutation.isPending ? 'animate-spin' : ''}`} />
                                    Fetch Leads
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    {/* Setup Section */}
                    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-200 flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Connect Your Facebook Account
                        </h4>
                        <div className="flex gap-3 flex-col md:flex-row">
                            <input
                                type="password"
                                placeholder="Paste User Access Token (with pages_show_list, leads_retrieval)"
                                value={userToken}
                                onChange={(e) => setUserToken(e.target.value)}
                                className="flex-1 px-4 py-3 bg-[#161B22] border border-gray-700 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white placeholder:text-gray-500"
                            />
                            <Button
                                onClick={handleConnectAccount}
                                disabled={connectAccountMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 h-auto py-3 px-6 rounded-xl shadow-lg"
                            >
                                {connectAccountMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : 'Connect Pages'}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            Connecting will fetch all pages where you have admin access.
                        </p>
                    </div>

                    {/* Connected Pages */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Connected Pages ({pages.length})</h4>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading pages...</div>
                        ) : pages.length === 0 ? (
                            <div className="text-center py-10 bg-[#0D1117] rounded-2xl border-2 border-dashed border-gray-800">
                                <Facebook className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No Facebook pages connected yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.isArray(pages) && pages.map((page) => (
                                    <div key={page.id} className="border border-gray-800 bg-[#0D1117] rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 font-bold">
                                                    {page.page_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white">{page.page_name}</h3>
                                                    <p className="text-[10px] text-gray-500">ID: {page.page_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Status Indicator */}
                                                <div className={`w-2 h-2 rounded-full ${page.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            </div>
                                        </div>

                                        {/* Toggle Switch Section */}
                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Power className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-xs text-gray-300 font-medium">Auto-import leads</span>
                                                </div>
                                                <Switch
                                                    checked={page.is_lead_sync_enabled !== false}
                                                    onCheckedChange={(checked) => {
                                                        toggleSyncMutation.mutate({
                                                            pageId: page.id,
                                                            is_enabled: checked
                                                        });
                                                    }}
                                                    disabled={toggleSyncMutation.isPending}
                                                />
                                            </div>
                                            {page.is_lead_sync_enabled === false && (
                                                <p className="text-[10px] text-yellow-500 mt-2 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Leads from this page will not be imported
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <FileText className="w-3 h-3 text-blue-400" />
                                                <span className="font-bold text-gray-300">{page.leadForms?.length || 0}</span> Forms
                                            </div>
                                            {page.last_sync_at && (
                                                <div className="flex items-center gap-1">
                                                    <RefreshCw className="w-3 h-3" />
                                                    Synced {formatDistanceToNow(new Date(page.last_sync_at), { addSuffix: true })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
