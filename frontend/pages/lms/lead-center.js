import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { leadsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function LeadCenter() {
    const router = useRouter();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [stages, setStages] = useState([]);
    const { user } = useAuth();

    // Filter & Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStage, setActiveStage] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showManageGroups, setShowManageGroups] = useState(true);

    // Create Group States
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
            fetchStages(); // Refresh stage counts
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
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchLeads]);

    const handleBulkMove = async (targetStage) => {
        if (selectedLeads.length === 0) return;
        try {
            setLoading(true);
            await leadsAPI.bulkMove(selectedLeads, targetStage);
            setSelectedLeads([]);
            fetchLeads();
        } catch (err) {
            console.error('Error moving leads:', err);
            alert('Failed to move leads. ' + (err.response?.data?.message || err.message));
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
            alert('Failed to create stage: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getStageStyles = (stage) => {
        const styles = {
            'Screening': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'Sourcing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Walk-in': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            'Closure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        const stageData = stages.find(s => s.name === stage);
        if (stageData?.is_custom) {
            return `bg-orange-500/10 text-orange-400 border-orange-500/20`; // Default for custom for now
        }
        return styles[stage] || 'bg-white/10 text-white border-white/20';
    };

    const getBorderColor = (stage) => {
        const borders = {
            'Screening': 'hover:border-indigo-500/50',
            'Sourcing': 'hover:border-purple-500/50',
            'Walk-in': 'hover:border-pink-500/50',
            'Closure': 'hover:border-emerald-500/50'
        };
        return borders[stage] || 'hover:border-primary/50';
    };

    const getAccentBg = (stage) => {
        const bgs = {
            'Screening': 'bg-indigo-500/60 group-hover:bg-indigo-500 shadow-[2px_0_10px_rgba(99,102,241,0.3)]',
            'Sourcing': 'bg-purple-500/60 group-hover:bg-purple-500 shadow-[2px_0_10px_rgba(168,85,247,0.3)]',
            'Walk-in': 'bg-pink-500/60 group-hover:bg-pink-500 shadow-[2px_0_10px_rgba(236,72,153,0.3)]',
            'Closure': 'bg-emerald-500/60 group-hover:bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.3)]'
        };
        return bgs[stage] || 'bg-primary/60 group-hover:bg-primary shadow-[2px_0_10px_rgba(244,157,37,0.3)]';
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

            <div className="flex flex-col h-[calc(100vh-140px)] -m-8 bg-[#0f0b08] text-slate-100 font-sans antialiased overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-[#2d241a] bg-[#0f0b08]/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white tracking-tight">Lead Center</h2>
                        <div className="h-4 w-px bg-[#2d241a] mx-2"></div>
                        <div className="flex items-center bg-[#1a140e]/50 border border-[#2d241a] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#f49d25]/50 transition-all group">
                            <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2">search</span>
                            <span className="text-xs text-slate-400 font-medium mr-4">Quick Group Jump...</span>
                            <span className="text-[10px] bg-[#2d241a] px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">⌘K</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#1a140e] rounded-lg px-3 py-1.5 border border-[#2d241a]">
                            <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2">calendar_today</span>
                            <span className="text-sm font-medium text-slate-200">Last 30 Days</span>
                        </div>
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#f49d25]"></span>
                        </button>
                    </div>
                </header>

                {/* Tab Bar Container */}
                <div className="bg-[#0f0b08]/80 backdrop-blur-sm border-b border-[#2d241a] px-6 py-2 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a140e] border border-[#2d241a] text-white text-xs font-semibold hover:border-[#f49d25]/50 transition-all mr-2">
                                <span className="material-symbols-outlined text-[16px] text-[#f49d25]">grid_view</span>
                                <span>All Groups</span>
                                <span className="material-symbols-outlined text-[16px] text-slate-500">expand_more</span>
                            </button>
                        </div>
                        <div className="h-6 w-px bg-[#2d241a] mx-2"></div>
                        <button
                            onClick={() => { setActiveStage('all'); setSelectedStatus('All'); }}
                            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeStage === 'all' ? 'text-white border-[#f49d25]' : 'text-slate-400 border-transparent hover:text-white'}`}
                        >
                            Default View <span className="ml-1 text-slate-400 font-normal">({leads.length})</span>
                        </button>
                        {stages.map((stage) => (
                            <button
                                key={stage.name}
                                onClick={() => { setActiveStage(stage.name); setSelectedStatus('All'); }}
                                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap group ${activeStage === stage.name ? 'text-white border-b-2 border-[#f49d25]' : 'text-slate-400 border-b-2 border-transparent hover:text-white'}`}
                            >
                                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)] ${stage.name === 'Screening' ? 'bg-indigo-500' : stage.name === 'Sourcing' ? 'bg-purple-500' : stage.name === 'Walk-in' ? 'bg-pink-500' : stage.name === 'Closure' ? 'bg-emerald-500' : 'bg-[#f49d25]'}`}></span>
                                {stage.name} <span className="text-slate-500 group-hover:text-slate-400 transition-colors font-normal">({stage.count})</span>
                            </button>
                        ))}

                        {/* Restore Create Group Button */}
                        <button
                            onClick={() => { setShowManageGroups(true); setShowCreateGroup(true); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#2d241a] text-slate-500 text-xs font-semibold hover:border-[#f49d25]/50 hover:text-white transition-all ml-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            <span>Create Group</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowManageGroups(!showManageGroups)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ml-4 ${showManageGroups ? 'bg-[#f49d25] text-[#0f0b08] border-[#f49d25]' : 'bg-[#1a140e] border-[#2d241a] text-slate-300 hover:border-[#f49d25]/50'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                        Manage Groups
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="px-6 py-3 bg-[#0f0b08] flex items-center gap-4 border-b border-[#2d241a] shrink-0">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
                        <input
                            className="w-full bg-[#1a140e]/40 border-[#2d241a] rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-[#f49d25]/20 focus:border-[#f49d25] transition-all text-slate-200 outline-none"
                            placeholder={`Search leads in ${activeStage === 'all' ? 'All Leads' : activeStage}...`}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-[#1a140e] border-[#2d241a] rounded-lg text-xs font-medium text-slate-300 px-3 py-2 outline-none focus:border-[#f49d25]"
                        >
                            <option value="All">Status: All</option>
                            {(activeStage === 'all'
                                ? Array.from(new Set(Object.values(stageStatusMapping).flat()))
                                : stageStatusMapping[activeStage] || []
                            ).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="bg-[#1a140e] border-[#2d241a] rounded-lg text-xs font-medium text-slate-300 px-3 py-2 outline-none focus:border-[#f49d25]">
                            <option>Sorting: Recently Active</option>
                            <option>Budget: High to Low</option>
                            <option>Name: A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden flex relative">
                    {/* Lead List */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-gradient-to-br from-[#0f0b08] via-[#14100c] to-[#0f0b08]">
                        <div className="max-w-6xl mx-auto flex flex-col gap-3 pb-24">
                            {loading && leads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                    <div className="w-8 h-8 border-2 border-[#f49d25] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Leads...</span>
                                </div>
                            ) : error ? (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center max-w-md mx-auto mt-10">
                                    <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error_outline</span>
                                    <h3 className="text-white font-bold mb-2">Sync Interrupted</h3>
                                    <p className="text-red-400/80 text-xs mb-6 px-4">{error}</p>
                                    <button onClick={fetchLeads} className="px-6 py-2 bg-red-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-900/40">Retry Connection</button>
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-20 text-center opacity-40 max-w-md mx-auto mt-10">
                                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-500">group_off</span>
                                    <p className="font-bold text-slate-300">No leads found</p>
                                    <p className="text-[10px] mt-2 text-slate-500 uppercase tracking-widest">Adjust filters or create a new lead entry</p>
                                </div>
                            ) : (
                                leads.map((lead) => (
                                    <div
                                        key={lead._id || lead.id}
                                        onClick={() => router.push(`/lms/leads?id=${lead._id || lead.id}`)}
                                        className={`bg-gradient-to-br from-[#251c12]/80 to-[#1a140e]/90 backdrop-blur-md border border-[#3d2f1d]/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-xl p-4 flex items-center justify-between group transition-all relative overflow-hidden pl-12 cursor-pointer ${getBorderColor(lead.stage)}`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAccentBg(lead.stage)}`}></div>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                checked={selectedLeads.includes(lead._id || lead.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleLeadSelection(lead._id || lead.id);
                                                }}
                                                className="w-5 h-5 rounded border-[#2d241a] bg-[#1a140e] text-[#f49d25] focus:ring-[#f49d25]/40 focus:ring-offset-0 cursor-pointer"
                                                type="checkbox"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 border border-[#2d241a] flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-inner">
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-sm">
                                                    {lead.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold flex items-center gap-2">
                                                    {lead.name}
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStageStyles(lead.stage)}`}>
                                                        {lead.stage || 'Screening'}
                                                    </span>
                                                </h4>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-medium">
                                                    <span className="flex items-center gap-1 text-orange-200/80">
                                                        <span className="material-symbols-outlined text-[14px]">payments</span>
                                                        {lead.budget_min ? `₹${(lead.budget_min / 100000).toFixed(1)}L` : 'Call for'} Budget
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="flex items-center gap-1 text-slate-300">
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {lead.property_type?.toLowerCase().includes('comm') ? 'corporate_fare' : 'home'}
                                                        </span>
                                                        {lead.property_type || 'Residential'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.15em] mb-1">Source Pipeline</p>
                                                <div className="flex flex-col items-end gap-1">
                                                    <p className="text-[10px] text-white font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10 uppercase tracking-tighter">
                                                        {lead.source || 'Direct Channel'}
                                                    </p>
                                                    {lead.form_name && (
                                                        <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest truncate max-w-[120px]" title={lead.form_name}>
                                                            {lead.form_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.15em] mb-1">Status Update</p>
                                                <p className="text-xs text-slate-200 font-medium">
                                                    {lead.status || 'Active Sync'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button className="h-8 w-8 rounded-lg bg-[#1a140e] border border-[#2d241a] flex items-center justify-center text-slate-400 hover:text-[#f49d25] hover:border-[#f49d25] transition-all active:scale-90 shadow-lg">
                                                    <span className="material-symbols-outlined text-[18px]">call</span>
                                                </button>
                                                <button className="h-8 w-8 rounded-lg bg-[#1a140e] border border-[#2d241a] flex items-center justify-center text-slate-400 hover:text-[#f49d25] hover:border-[#f49d25] transition-all active:scale-90 shadow-lg">
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Manage Groups */}
                    {showManageGroups && (
                        <div className="w-80 bg-[#1a140e] border-l border-[#2d241a] flex flex-col shrink-0 z-40">
                            <div className="p-5 border-b border-[#2d241a] flex justify-between items-center bg-[#0f0b08]/30">
                                <h3 className="text-white font-bold text-base flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#f49d25]">settings_suggest</span>
                                    Manage Groups
                                </h3>
                                <button
                                    onClick={() => setShowManageGroups(false)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined uppercase">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                                {/* Group Architecture Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Group Architecture</p>
                                        <button
                                            onClick={() => setShowCreateGroup(!showCreateGroup)}
                                            className="text-[10px] font-black text-[#f49d25] uppercase tracking-tighter hover:text-orange-400"
                                        >
                                            {showCreateGroup ? 'Cancel' : '+ Custom Stage'}
                                        </button>
                                    </div>

                                    {/* Create Stage Form */}
                                    {showCreateGroup && (
                                        <form onSubmit={handleCreateStage} className="p-3 bg-white/5 rounded-xl border border-[#f49d25]/30 space-y-2 animate-in slide-in-from-top duration-200">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                placeholder="Stage Name (e.g. Follow Up)"
                                                className="w-full bg-[#0f0b08] border-[#2d241a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#f49d25]"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={!newGroupName || loading}
                                                    className="flex-1 py-1.5 bg-[#f49d25] text-[#0f0b08] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 disabled:opacity-50"
                                                >
                                                    Add Stage
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between p-3 bg-[#0f0b08]/50 border border-[#2d241a] rounded-xl cursor-move hover:border-[#f49d25]/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-slate-600 text-[18px]">drag_indicator</span>
                                                <span className="text-sm font-medium text-slate-200">Default View</span>
                                            </div>
                                            <button onClick={() => { setActiveStage('all'); setShowManageGroups(false); }} className="material-symbols-outlined text-slate-600 text-[18px] hover:text-[#f49d25] transition-colors">visibility</button>
                                        </div>
                                        {stages.map((stage) => (
                                            <div key={stage.name} className="flex items-center justify-between p-3 bg-[#0f0b08]/50 border border-[#2d241a] rounded-xl cursor-move hover:border-[#f49d25]/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-slate-600 text-[18px]">drag_indicator</span>
                                                    <div className={`w-2.5 h-2.5 rounded-full ${stage.name === 'Screening' ? 'bg-indigo-500' : stage.name === 'Sourcing' ? 'bg-purple-500' : stage.name === 'Walk-in' ? 'bg-pink-500' : stage.name === 'Closure' ? 'bg-emerald-500' : 'bg-[#f49d25]'}`}></div>
                                                    <span className="text-sm font-medium text-slate-200">{stage.name} <span className="text-slate-500 font-normal">({stage.count})</span></span>
                                                </div>
                                                <button onClick={() => { setActiveStage(stage.name); setShowManageGroups(false); }} className="material-symbols-outlined text-slate-600 text-[18px] hover:text-[#f49d25] transition-colors">visibility</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Selection Bar */}
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${selectedLeads.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                        <div className="bg-[#1a140e]/95 backdrop-blur-md rounded-2xl px-6 py-3 border border-[#f49d25]/30 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded-full bg-[#f49d25] flex items-center justify-center text-[#0f0b08] text-[10px] font-black">{selectedLeads.length}</span>
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Active Selection</span>
                            </div>
                            <div className="h-8 w-px bg-[#2d241a]"></div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-[#f49d25] text-[#0f0b08] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                                        Move Group
                                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                    </button>
                                    <div className="absolute bottom-full mb-2 left-0 bg-[#1a140e] border border-[#2d241a] rounded-lg shadow-xl hidden group-hover:block min-w-[150px]">
                                        {stages.filter(s => s.name !== activeStage).map(s => (
                                            <button
                                                key={s.name}
                                                onClick={() => handleBulkMove(s.name)}
                                                className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-300 hover:bg-[#f49d25] hover:text-[#0f0b08] first:rounded-t-lg last:rounded-b-lg transition-colors border-b border-white/5 last:border-0"
                                            >
                                                Move to {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Download Pipeline">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </button>
                                <button className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Purge Selection">
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                                <button
                                    onClick={() => setSelectedLeads([])}
                                    className="text-slate-500 hover:text-white ml-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Action Button */}
                    <div className="absolute right-6 bottom-6 z-40 flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/lms/leads/new')}
                            className="flex items-center justify-center gap-2 bg-[#f49d25] hover:bg-orange-500 text-[#0f0b08] font-black py-4 px-8 rounded-full transition-all shadow-[0_10px_40px_rgba(244,157,37,0.4)] hover:scale-105 active:scale-95 uppercase text-[11px] tracking-[0.2em]"
                        >
                            <span className="material-symbols-outlined text-[22px]">person_add</span>
                            New Discovery
                        </button>
                    </div>
                </main>
            </div>
        </Layout>
    );
}
