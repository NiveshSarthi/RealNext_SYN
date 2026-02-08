import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";
import { leadsAPI, internalLeadsAPI } from "../../utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { Label } from "../../components/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/Select";
import {
    User, Phone, Mail, MapPin, Calendar, MessageSquare, Star, Check, Lock, Eye, FileText, TrendingUp, Sparkles, UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const statusColors = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    assigned: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    interested: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    qualified: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    won: "bg-green-500/10 text-green-500 border-green-500/20",
    lost: "bg-red-500/10 text-red-500 border-red-500/20"
};

const formatDateSafe = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

export default function LeadsPage() {
    const { user, loading: authLoading } = useAuth();
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedLead, setSelectedLead] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [updateData, setUpdateData] = useState({});
    const queryClient = useQueryClient();

    // Fetch External WA Leads
    const { data: externalLeads = [], isLoading: isLoadingExternal } = useQuery({
        queryKey: ['external-leads', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const res = await leadsAPI.getLeads({ limit: 100 });
            return (res.data.contacts || res.data || []).map(lead => ({
                ...lead,
                _source: 'whatsapp'
            }));
        },
        enabled: !!user,
    });

    // Fetch Internal Meta/Manual Leads
    const { data: internalLeads = [], isLoading: isLoadingInternal } = useQuery({
        queryKey: ['internal-leads', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const res = await internalLeadsAPI.getLeads({ limit: 100 });
            return (res.data.data || []).map(lead => ({
                ...lead,
                _source: lead.source || 'manual'
            }));
        },
        enabled: !!user,
    });

    // Merge both lead sources
    const leads = [...externalLeads, ...internalLeads];
    const isLoading = isLoadingExternal || isLoadingInternal;

    // Filter Logic
    const filteredLeads = filterStatus === 'all'
        ? leads
        : leads.filter(l => l.status === filterStatus);

    // Mock Stats
    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        won: leads.filter(l => l.status === 'won').length,
    };

    // Update Status Mutation
    const updateMutation = useMutation({
        mutationFn: (data) => leadsAPI.updateLead(selectedLead.id || selectedLead._id, data),
        onSuccess: () => {
            toast.success("Lead updated successfully");
            setDetailsOpen(false);
            queryClient.invalidateQueries(['leads']);
        },
        onError: () => toast.error("Failed to update lead")
    });

    const handleUpdateStatus = () => {
        updateMutation.mutate(updateData);
    };

    if (authLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <Layout>
            <div className="min-h-screen bg-[#0E1117] text-white p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">

                {/* Header Section */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative p-8 md:p-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30">
                                <UserPlus className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                                    My Leads
                                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                                </h1>
                                <p className="text-indigo-100 text-lg mt-1">Manage and track your assigned leads</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Leads', value: stats.total, icon: FileText, color: 'text-slate-200', bg: 'bg-slate-500/20' },
                        { label: 'New', value: stats.new, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                        { label: 'Contacted', value: stats.contacted, icon: Phone, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                        { label: 'Qualified', value: stats.qualified, icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/20' },
                        { label: 'Won', value: stats.won, icon: Check, color: 'text-green-400', bg: 'bg-green-500/20' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-[#161B22] border-[#1F2937] hover:border-indigo-500/50 transition-all">
                            <CardContent className="p-6">
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="bg-[#161B22] border-[#1F2937] p-2">
                    <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                        <TabsList className="bg-[#0E1117] w-full grid grid-cols-3 md:grid-cols-6 h-auto p-1">
                            {['all', 'new', 'contacted', 'qualified', 'won', 'lost'].map(status => (
                                <TabsTrigger key={status} value={status} className="capitalize data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                    {status}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </Card>

                {/* Leads List */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading prospects...</p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <Card className="bg-[#161B22] border-[#1F2937] p-16 text-center">
                        <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-lg font-bold text-white mb-1">No leads found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </Card>
                ) : (
                    <div className="grid gap-4 max-w-7xl mx-auto">
                        {filteredLeads.map((lead, index) => (
                            <motion.div
                                key={lead.id || lead._id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="bg-[#161B22] border-[#1F2937] hover:border-indigo-500/50 transition-all group overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-lg font-bold">
                                                    {lead.name?.charAt(0) || lead.first_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="text-lg font-bold text-white">{lead.name || lead.first_name || 'Unnamed Lead'}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={statusColors[lead.status] || statusColors.new}>
                                                                {lead.status || 'new'}
                                                            </Badge>
                                                            {/* Source Badge */}
                                                            {lead._source && (
                                                                <Badge className={
                                                                    lead._source === 'Facebook Ads' || lead._source === 'manual'
                                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                }>
                                                                    {lead._source === 'Facebook Ads' ? '📘 Meta' :
                                                                        lead._source === 'manual' ? '✍️ Manual' :
                                                                            '💬 WhatsApp'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDateSafe(lead.created_at || lead.created_date)}
                                                        </span>
                                                        {lead.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {lead.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Original status badge removed as it's now part of the new structure */}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-3 p-3 bg-[#0E1117] border border-gray-800 rounded-lg">
                                                <Phone className="w-4 h-4 text-indigo-400" />
                                                <span className="text-sm font-mono text-gray-300">{lead.phone}</span>
                                            </div>
                                            {lead.email && (
                                                <div className="flex items-center gap-3 p-3 bg-[#0E1117] border border-gray-800 rounded-lg">
                                                    <Mail className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm text-gray-300 truncate">{lead.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                                            <Button
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                onClick={() => {
                                                    setSelectedLead(lead);
                                                    setUpdateData({
                                                        status: lead.status || 'new',
                                                        notes: lead.notes || (lead.custom_fields && lead.custom_fields.notes) || ''
                                                    });
                                                    setDetailsOpen(true);
                                                }}
                                            >
                                                Update Status
                                            </Button>
                                            <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-gray-300 flex-1" asChild>
                                                <a href={`tel:${lead.phone}`}>
                                                    <Phone className="w-4 h-4 mr-2" /> Call
                                                </a>
                                            </Button>
                                            <Button variant="outline" className="border-green-900/50 hover:bg-green-900/20 text-green-500 flex-1" asChild>
                                                <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                    <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Lead: {selectedLead?.name || selectedLead?.first_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={updateData.status}
                                    onValueChange={(val) => setUpdateData({ ...updateData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="qualified">Qualified</SelectItem>
                                        <SelectItem value="won">Won</SelectItem>
                                        <SelectItem value="lost">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    value={updateData.notes}
                                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                                    placeholder="Add notes..."
                                    className="bg-[#0E1117] border-gray-700"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateStatus} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
