import React, { useState } from "react";
import Layout from "../../components/Layout";
import FacebookConnectionManager from "../../components/leads/FacebookConnectionManager";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/Select";
import { Zap, Plus, Link as LinkIcon, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function LeadManagerPage() {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [sources, setSources] = useState([]); // Mocking sources for now as API might not exist

    const handleCreateSource = () => {
        toast.success("Integration created! (Mock)");
        setAddModalOpen(false);
        setSources([...sources, { id: Date.now(), name: "New Source", type: "custom", active: true }]);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#0E1117] text-white p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl shadow-2xl"
                >
                    <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                                    Lead Integrations
                                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                                </h1>
                                <p className="text-indigo-100 text-lg mt-1">Connect your marketing channels directly</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setAddModalOpen(true)}
                            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl h-12 px-6 font-semibold"
                        >
                            <Plus className="w-5 h-5 mr-2" /> New Integration
                        </Button>
                    </div>
                </motion.div>

                {/* Facebook Integration Component */}
                <FacebookConnectionManager />

                {/* Info Card */}
                <Card className="bg-[#161B22] border-[#1F2937] border">
                    <CardContent className="pt-6 pb-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2 text-lg">Real-time Lead Sync</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Leads received through these integrations are automatically added to your "My Leads" list.
                                We support Webhooks, Facebook Lead Ads, and Zapier.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sources List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sources.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-700 bg-transparent p-12 text-center col-span-full">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LinkIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-medium">No custom integrations yet</p>
                        </Card>
                    ) : (
                        sources.map(s => (
                            <Card key={s.id} className="bg-[#161B22] border-[#1F2937]">
                                <CardHeader>
                                    <CardTitle>{s.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-400 text-sm">{s.type}</p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Integration</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Source Name</Label>
                                <Input placeholder="e.g. Website Form" className="bg-[#0E1117] border-gray-700" />
                            </div>
                            <div>
                                <Label>Source Type</Label>
                                <Select onValueChange={() => { }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="webhook">Webhook</SelectItem>
                                        <SelectItem value="zapier">Zapier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateSource} className="bg-indigo-600">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </Layout>
    );
}
