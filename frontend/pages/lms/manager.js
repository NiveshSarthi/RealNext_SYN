import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import FacebookConnectionManager from "../../components/leads/FacebookConnectionManager";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/Select";
import { Zap, Plus, Link as LinkIcon, AlertCircle, Sparkles, Filter, Settings2, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { leadsAPI } from "../../utils/api";

export default function LeadManagerPage() {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [sources, setSources] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await leadsAPI.getStats();
                if (response.data.success) {
                    setStats(response.data.data.metrics);
                }
            } catch (error) {
                console.error("Failed to fetch leads stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleCreateSource = () => {
        toast.success("Integration created! (Mock)");
        setAddModalOpen(false);
        setSources([...sources, { id: Date.now(), name: "New Source", type: "custom", active: true }]);
    };

    const calculateGrowth = (today, yesterday) => {
        if (!yesterday || yesterday === 0) return today > 0 ? "+100%" : "0%";
        const diff = ((today - yesterday) / yesterday) * 100;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    const statCards = [
        {
            label: 'Today Total',
            value: stats?.today_total ?? '0',
            sub: `${calculateGrowth(stats?.today_total, stats?.yesterday_total)} from yesterday`,
            icon: Zap,
            color: 'text-yellow-400'
        },
        {
            label: 'Active Channels',
            value: stats?.active_channels_count?.toString().padStart(2, '0') ?? '01',
            sub: stats?.active_channels_list?.join(', ') ?? 'Manual',
            icon: Share2,
            color: 'text-blue-400'
        },
        {
            label: 'Conversion Rate',
            value: `${stats?.conversion_rate ?? '0'}%`,
            sub: 'Closed Leads ratio',
            icon: Sparkles,
            color: 'text-purple-400'
        },
        {
            label: 'Processing Lag',
            value: stats?.processing_lag ?? '< 1s',
            sub: 'Real-time sync active',
            icon: Zap,
            color: 'text-emerald-400'
        },
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-[#0E1117] text-white p-6 md:p-10 space-y-10 max-w-[1400px] mx-auto pb-20">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Marketing Hub</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0E1117] bg-gray-800 flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
                            Lead Integrations
                            <Sparkles className="w-8 h-8 text-yellow-400/80 animate-pulse" />
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl">
                            Consolidate and automate your lead capture from all social and web channels in real-time.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <Button
                            variant="outline"
                            className="bg-transparent border-gray-800 hover:bg-white/5 h-12 px-6"
                        >
                            <Settings2 className="w-4 h-4 mr-2" /> Settings
                        </Button>
                        <Button
                            onClick={() => setAddModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/20 h-12 px-8 font-bold rounded-xl active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5 mr-1" /> New Integration
                        </Button>
                    </motion.div>
                </div>

                {/* Stats Summary - Optional purely visual for RealNexT feel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.3 }}
                        >
                            <Card className="bg-[#161B22]/40 backdrop-blur-md border-[#1F2937] border shadow-lg group hover:border-indigo-500/30 transition-all">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gray-800/50 ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-xl font-black text-white">
                                            {loadingStats ? (
                                                <div className="h-6 w-12 bg-gray-800 animate-pulse rounded mt-1" />
                                            ) : stat.value}
                                        </p>
                                        <p className="text-[9px] text-gray-600 font-medium mt-0.5 truncate max-w-[150px]">{stat.sub}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Facebook Integration Component */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <FacebookConnectionManager />
                </motion.div>

                {/* Other Integrations Header */}
                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                            <Filter className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Other Custom Sources</h2>
                    </div>
                </div>

                {/* Sources List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sources.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-800 bg-transparent py-16 text-center col-span-full group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => setAddModalOpen(true)}>
                            <div className="w-16 h-16 bg-[#161B22] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                <LinkIcon className="w-8 h-8 text-gray-600 group-hover:text-indigo-400" />
                            </div>
                            <p className="text-gray-400 font-bold text-lg">Connect Custom Webhooks</p>
                            <p className="text-gray-600 text-sm mt-1 max-w-xs mx-auto">Use our secure endpoints to push leads from any website or CRM.</p>
                        </Card>
                    ) : (
                        sources.map(s => (
                            <Card key={s.id} className="bg-[#161B22]/50 border-[#1F2937] hover:border-indigo-500/30 transition-all overflow-hidden group">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold">{s.name}</CardTitle>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">{s.type}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                                        <span>Last entry: Just now</span>
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-white/5">Details</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                    <DialogContent className="bg-[#161B22] border-[#1F2937] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">New Integration Source</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Source Name</Label>
                                <Input
                                    placeholder="e.g. Landing Page 2024"
                                    className="bg-[#0E1117] border-gray-800 focus:ring-indigo-500 h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Source Type</Label>
                                <Select onValueChange={() => { }}>
                                    <SelectTrigger className="bg-[#0E1117] border-gray-800 h-12">
                                        <SelectValue placeholder="Select integration method" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#161B22] border-gray-800 text-white">
                                        <SelectItem value="webhook">Webhook (Direct API)</SelectItem>
                                        <SelectItem value="zapier">Zapier Automation</SelectItem>
                                        <SelectItem value="pabbly">Pabbly Connect</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateSource} className="bg-indigo-600 px-8">Confirm Setup</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </Layout>
    );
}
