import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { leadsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import {
    MagnifyingGlassIcon,
    PlusCircleIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    ArrowPathIcon,
    AdjustmentsHorizontalIcon,
    ChevronDownIcon,
    PhoneIcon,
    EllipsisVerticalIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    ArrowRightIcon,
    ClockIcon,
    AcademicCapIcon,
    CheckIcon,
    PlusIcon,
    ShieldCheckIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const LeadCard = ({ lead, onClick, isSelected, onSelect, stages }) => {
    const stageColor = stages.find(s => s.name === lead.stage)?.color || '#F49D25';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={onClick}
            className={`relative group cursor-pointer p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden shrink-0 ${isSelected
                ? 'bg-primary/5 border-primary/30 shadow-glow-sm'
                : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 shadow-2xl'
                }`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="relative z-10 flex items-center gap-8">
                <div
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary border-primary' : 'border-white/10 bg-white/[0.02] group-hover:border-primary/50'
                        }`}
                >
                    {isSelected && <CheckIcon className="h-4 w-4 text-black font-black" />}
                </div>

                <div className="relative">
                    <div className="h-16 w-16 rounded-[1.4rem] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 flex items-center justify-center shadow-inner group-hover:border-primary/30 transition-colors">
                        <span className="text-xl font-black text-white">{lead.name.charAt(0)}</span>
                    </div>
                    <div
                        className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-[#0D1117] shadow-glow-sm"
                        style={{ backgroundColor: stageColor }}
                    ></div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-white tracking-tighter group-hover:text-primary transition-colors">{lead.name}</h3>
                        {lead.ai_score > 80 && (
                            <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-primary">verified</span>
                                <span className="text-[8px] font-black text-primary uppercase text-left">Elite</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors text-left">
                            <PhoneIcon className="h-3 w-3" />
                            {lead.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-left">
                            <span className="material-symbols-outlined text-[14px] text-primary">language</span>
                            <span className="opacity-60">{lead.source || 'Direct Telemetry'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12 text-right">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Valuation</p>
                        <p className="text-sm font-black text-white tracking-tighter">
                            {lead.budget_max ? `₹${(lead.budget_max / 100000).toFixed(1)}L` : '---'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Interest</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="h-1 w-8 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${lead.ai_score || 50}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{lead.status}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Status</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full shadow-glow-sm ${lead.status === 'Lost' ? 'bg-red-500' :
                                lead.status === 'Warm' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">{lead.stage}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                            <ClockIcon className="h-4 w-4" />
                        </button>
                        <button className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-all">
                            <ArrowRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function LeadCenter() {
    const router = useRouter();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [stages, setStages] = useState([]);
    const { user } = useAuth();
    const [mountTime, setMountTime] = useState(null);

    useEffect(() => {
        setMountTime(new Date());
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeStage, setActiveStage] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showManageGroups, setShowManageGroups] = useState(true);
    const [showMoveDropdown, setShowMoveDropdown] = useState(false);

    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#f49d25');

    const fetchStages = useCallback(async () => {
        try {
            const response = await leadsAPI.getStageMetadata();
            setStages(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching stages:', err);
        }
    }, []);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: searchQuery,
                stage: activeStage === 'all' ? '' : activeStage,
                status: selectedStatus === 'All' ? '' : selectedStatus,
                limit: 100
            };

            const response = await leadsAPI.getLeads(params);
            setLeads(response.data?.data || []);
            setError(null);
            fetchStages();
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError('Failed to load leads data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, activeStage, selectedStatus, fetchStages]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchLeads]);

    // Listen for Voice Command Intent: CREATE_GROUP
    useEffect(() => {
        if (router.query.action === 'createGroup') {
            setShowManageGroups(true); // Open sidebar if closed
            setShowCreateGroup(true); // Reveal the creation input
            if (router.query.prefillName) {
                setNewGroupName(router.query.prefillName);
            }
        }
    }, [router.query]);

    const handleBulkMove = async (targetStage) => {
        if (selectedLeads.length === 0) return;
        try {
            setLoading(true);
            await leadsAPI.bulkMove(selectedLeads, targetStage);
            setSelectedLeads([]);
            fetchLeads();
        } catch (err) {
            console.error('Error moving leads:', err);
            alert('Failed to move leads.');
        } finally {
            setLoading(false);
        }
    };

    const toggleLeadSelection = (id) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleCreateStage = async (e) => {
        e.preventDefault();
        if (!newGroupName) return;
        try {
            setLoading(true);
            await leadsAPI.createStage({ name: newGroupName, color: newGroupColor });
            setNewGroupName('');
            setShowCreateGroup(false);
            fetchStages();
            fetchLeads();
        } catch (err) {
            console.error('Error creating stage:', err);
            alert('Failed to create stage.');
        } finally {
            setLoading(false);
        }
    };

    const stageStatusMapping = {
        'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Qualified'],
        'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost', 'Visit expected', 'Schedule', 'Done'],
        'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost', 'Token expected', 'Re-Walkin'],
        'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
    };

    return (
        <Layout>
            <Head>
                <title>LeadSync - Advanced Lead Center</title>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="relative min-h-screen bg-[#0D1117] text-white selection:bg-primary/30 overflow-x-hidden">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col h-screen overflow-hidden">
                    <header className="h-20 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl px-8 flex items-center justify-between shrink-0 z-30">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1 text-left">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.3em] font-mono">Lead Intelligence Online</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none text-left">
                                Lead <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">Center</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden lg:flex items-center gap-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-6 py-3 backdrop-blur-md shadow-xl text-right">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5 text-right">Last Pipeline Sync</p>
                                <p className="text-xs font-black text-white font-mono uppercase tracking-tighter text-right">
                                    {mountTime ? format(mountTime, 'HH:mm:ss') : '--:--:--'} UTC
                                </p>
                                <div className="h-6 w-px bg-white/10 mx-1" />
                                <motion.button
                                    whileHover={{ rotate: 180 }}
                                    transition={{ duration: 0.5 }}
                                    onClick={() => window.location.reload()}
                                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/10 transition-colors"
                                >
                                    <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                                </motion.button>
                            </div>

                            <div className="flex items-center bg-white/[0.03] border border-white/[0.05] rounded-xl p-1">
                                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-lg">Pipeline</button>
                                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Analytics</button>
                            </div>
                        </div>
                    </header>

                    <div className="bg-white/[0.01] border-b border-white/[0.05] px-8 py-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm shrink-0">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 py-1">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setActiveStage('all'); setSelectedStatus('All'); }}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${activeStage === 'all'
                                    ? 'bg-primary/10 text-primary border-primary/20 shadow-glow-sm'
                                    : 'bg-white/[0.03] text-gray-500 border-white/[0.05] hover:border-white/20 hover:text-white'}`}
                            >
                                All Leads <span className="ml-1 opacity-60">({leads.length})</span>
                            </motion.button>

                            <div className="h-6 w-px bg-white/10 mx-2" />

                            {stages.map((stage) => (
                                <motion.button
                                    key={stage.name}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setActiveStage(stage.name); setSelectedStatus('All'); }}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap border group ${activeStage === stage.name
                                        ? 'bg-white/[0.08] text-white border-white/20 shadow-xl'
                                        : 'bg-white/[0.03] text-gray-500 border-white/[0.05] hover:border-white/20 hover:text-white'}`}
                                >
                                    <span className={`w-2 h-2 rounded-full shadow-lg ${stage.name === 'Screening' ? 'bg-indigo-500 shadow-indigo-500/50' : stage.name === 'Sourcing' ? 'bg-purple-500 shadow-purple-500/50' : stage.name === 'Walk-in' ? 'bg-pink-500 shadow-pink-500/50' : stage.name === 'Closure' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-primary shadow-primary/50'}`}></span>
                                    {stage.name} <span className="opacity-40 group-hover:opacity-60 transition-colors font-normal">({stage.count})</span>
                                </motion.button>
                            ))}

                            <button
                                onClick={() => { setShowManageGroups(true); setShowCreateGroup(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all ml-2"
                            >
                                <PlusCircleIcon className="h-4 w-4" />
                                <span>New Stage</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowManageGroups(!showManageGroups)}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all ml-6 ${showManageGroups
                                ? 'bg-primary text-black border-primary'
                                : 'bg-white/[0.03] border-white/[0.05] text-gray-400 hover:border-white/20'}`}
                        >
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            Management
                        </button>
                    </div>

                    <div className="px-8 py-4 bg-white/[0.01] flex items-center gap-6 border-b border-white/[0.05] shrink-0">
                        <div className="flex-1 relative group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full bg-white/[0.03] border-white/[0.05] rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-primary/20 transition-all text-white outline-none placeholder:text-gray-600 shadow-xl"
                                placeholder={`Search intelligence in ${activeStage === 'all' ? 'Universal Pipeline' : activeStage}...`}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="bg-white/[0.03] border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 pl-9 pr-6 py-3 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="All">Status: All</option>
                                    {(activeStage === 'all'
                                        ? Array.from(new Set(Object.values(stageStatusMapping).flat()))
                                        : stageStatusMapping[activeStage] || []
                                    ).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <ArrowsUpDownIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                <select className="bg-white/[0.03] border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 pl-9 pr-6 py-3 outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer">
                                    <option>Sorting: Recently Active</option>
                                    <option>Budget: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <main className="flex-1 overflow-hidden flex relative">
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            <div className="max-w-6xl mx-auto flex flex-col gap-3 pb-24">
                                {loading && leads.length === 0 ? (
                                    <div className="flex items-center justify-center py-32">
                                        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : error ? (
                                    <div className="p-12 text-center text-red-400 opacity-60 font-black uppercase tracking-widest">{error}</div>
                                ) : leads.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-gray-600 bg-white/[0.01] rounded-[3rem] border border-white/[0.05] border-dashed">
                                        <AcademicCapIcon className="h-10 w-10 mb-4 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Intelligence Detected</p>
                                    </div>
                                ) : (
                                    leads.map((lead) => (
                                        <LeadCard
                                            key={lead._id || lead.id}
                                            lead={lead}
                                            onClick={() => router.push(`/lms/leads/${lead._id || lead.id}`)}
                                            isSelected={selectedLeads.includes(lead._id || lead.id)}
                                            onSelect={() => toggleLeadSelection(lead._id || lead.id)}
                                            stages={stages}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {showManageGroups && (
                                <motion.div
                                    initial={{ x: 320 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: 320 }}
                                    className="w-96 bg-white/[0.01] border-l border-white/[0.05] backdrop-blur-3xl flex flex-col shrink-0 z-40"
                                >
                                    <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                                        <div className="flex flex-col text-left">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Architecture</p>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manage Groups</h3>
                                        </div>
                                        <button
                                            onClick={() => setShowManageGroups(false)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] text-gray-400 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined uppercase text-[20px]">close</span>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pipeline Structure</p>
                                                <button
                                                    onClick={() => setShowCreateGroup(!showCreateGroup)}
                                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-orange-400 transition-colors"
                                                >
                                                    {showCreateGroup ? '[ Cancel ]' : '[ + New Stage ]'}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {showCreateGroup && (
                                                    <motion.form
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        onSubmit={handleCreateStage}
                                                        className="p-5 bg-white/[0.03] rounded-2xl border border-primary/20 space-y-4"
                                                    >
                                                        <div className="space-y-1.5 text-left">
                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Stage Designation</label>
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={newGroupName}
                                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                                placeholder="e.g. Qualified Lead"
                                                                className="w-full bg-white/[0.05] border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary/50 transition-all"
                                                            />
                                                        </div>
                                                        <button
                                                            type="submit"
                                                            disabled={!newGroupName || loading}
                                                            className="w-full py-3 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 disabled:opacity-50 transition-all shadow-glow-sm"
                                                        >
                                                            Authorize New Stage
                                                        </button>
                                                    </motion.form>
                                                )}
                                            </AnimatePresence>

                                            <div className="space-y-3">
                                                {stages.map((stage) => (
                                                    <div key={stage.name} className="group/item flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] hover:border-white/20 transition-all hover:bg-white/[0.04]">
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${stage.name === 'Screening' ? 'bg-indigo-500 shadow-indigo-500/50' : stage.name === 'Sourcing' ? 'bg-purple-500 shadow-purple-500/50' : stage.name === 'Walk-in' ? 'bg-pink-500 shadow-pink-500/50' : stage.name === 'Closure' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-primary shadow-primary/50'}`}></div>
                                                            <span className="text-xs font-black text-gray-300 uppercase tracking-tighter">{stage.name} <span className="text-gray-600 font-normal ml-1 font-mono tracking-normal">({stage.count})</span></span>
                                                        </div>
                                                        <button onClick={() => { setActiveStage(stage.name); setShowManageGroups(false); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                                            <ArrowRightIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {selectedLeads.length > 0 && (
                                <motion.div
                                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                                    exit={{ y: 100, x: '-50%', opacity: 0 }}
                                    className="fixed bottom-12 left-1/2 z-50 min-w-[500px]"
                                >
                                    <div className="bg-[#0D1117]/80 backdrop-blur-3xl rounded-[2rem] px-8 py-4 border border-white/[0.1] flex items-center gap-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-sm">
                                                <span className="text-sm font-black">{selectedLeads.length}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Selection Mode</span>
                                                <span className="text-xs font-black text-white uppercase tracking-tighter">Manage {selectedLeads.length} selected leads</span>
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-white/[0.05]"></div>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div
                                                className="relative"
                                                onMouseEnter={() => setShowMoveDropdown(true)}
                                                onMouseLeave={() => setShowMoveDropdown(false)}
                                            >
                                                <button className="flex items-center gap-3 px-6 py-2.5 bg-white/[0.03] border border-white/[0.1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                                    <ArrowPathIcon className="h-4 w-4 text-primary" />
                                                    Move to Stage
                                                    <ChevronDownIcon className={`h-3 w-3 text-gray-500 transition-transform duration-300 ${showMoveDropdown ? 'rotate-180' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {showMoveDropdown && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute bottom-full left-0 min-w-[200px] z-50 pb-2"
                                                        >
                                                            <div className="bg-[#0D1117] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl">
                                                                {stages.filter(s => s.name !== activeStage).map(s => (
                                                                    <button
                                                                        key={s.name}
                                                                        onClick={() => {
                                                                            handleBulkMove(s.name);
                                                                            setShowMoveDropdown(false);
                                                                        }}
                                                                        className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-b border-white/[0.05] last:border-0"
                                                                    >
                                                                        To {s.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLeads([])}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.1] text-gray-500 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            animate={{
                                right: showManageGroups ? 480 : 48,
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-12 z-40"
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <button
                                onClick={() => router.push('/lms/leads/new')}
                                className="group relative flex items-center gap-5 bg-gradient-to-br from-primary to-orange-600 p-1.5 pr-10 rounded-[2.5rem] transition-all shadow-[0_20px_50px_rgba(244,157,37,0.2)] hover:shadow-[0_30px_70px_rgba(244,157,37,0.4)] overflow-hidden"
                            >
                                <div className="h-14 w-14 rounded-[2.2rem] bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-black/60 transition-all duration-500 border border-white/10">
                                    <PlusCircleIcon className="h-7 w-7" />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.25em] leading-none mb-1">Action</span>
                                    <span className="text-xs font-black text-black uppercase tracking-widest">Create New Lead</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </motion.div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}
