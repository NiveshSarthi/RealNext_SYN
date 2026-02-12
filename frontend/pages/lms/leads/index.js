import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Mail,
  Users,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  Star,
  LayoutGrid,
  List,
  Sparkles,
  Facebook,
  Zap
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, colorClass, bgClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#161B22]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl"
  >
    <div className={`absolute -top-4 -right-4 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${colorClass}`}>
      <Icon className="h-24 w-24" />
    </div>
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} bg-opacity-10 mb-4 border border-white/5`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-3xl font-black text-white mt-1 tabular-nums">{value}</h3>
    </div>
  </motion.div>
);

// Lead Card Component
const LeadCard = ({ lead, onEdit, onDelete, onView, onStatusChange, index }) => {
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));

  const stageStatusMapping = {
    'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead'],
    'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
  };

  const statusColors = {
    'Uncontacted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Not Interested': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Not Responding': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Dead': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Hot': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Warm': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cold': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  const stageColors = {
    'Screening': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Sourcing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Walk-in': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'Closure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  const handleStageChange = async (e) => {
    e.stopPropagation();
    const newStage = e.target.value;
    const defaultStatus = stageStatusMapping[newStage][0];
    onStatusChange(lead, defaultStatus, newStage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#161B22]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group relative shadow-lg"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-indigo-400 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
            {lead.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="text-white font-bold text-lg truncate max-w-[180px]" title={lead.name}>{lead.name || 'Unknown Lead'}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              {isMetaLead && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded-full border border-blue-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Meta Ads
                </span>
              )}
              <select
                value={lead.stage || 'Screening'}
                onChange={handleStageChange}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${stageColors[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
              >
                {Object.keys(stageStatusMapping).map(stage => (
                  <option key={stage} value={stage} className="bg-[#161B22] text-gray-300">
                    {stage}
                  </option>
                ))}
              </select>
              <select
                value={lead.status || 'Uncontacted'}
                onChange={(e) => onStatusChange(lead, e.target.value, lead.stage)}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
              >
                {(stageStatusMapping[lead.stage] || stageStatusMapping['Screening']).map(status => (
                  <option key={status} value={status} className="bg-[#161B22] text-gray-300">
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#0D1117] p-1 rounded-xl shadow-xl">
          <button onClick={() => onEdit(lead)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(lead)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center text-sm font-medium text-gray-400 group/item cursor-pointer hover:text-white transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center mr-3 border border-white/5">
            <Phone className="h-4 w-4" />
          </div>
          {lead.phone || 'No phone'}
        </div>
        <div className="flex items-center text-sm font-medium text-gray-400">
          <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center mr-3 border border-white/5">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="truncate">{lead.location || 'Location not set'}</span>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-white/5">
          <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" />
            {(lead.created_at || lead.createdAt) ? format(new Date(lead.created_at || lead.createdAt), 'MMM dd, yyyy') : 'N/A'}
          </span>
          <Button onClick={onView} variant="ghost" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full">
            Details <Eye className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    screening: 0,
    sourcing: 0,
    walkin: 0,
    closure: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchLeads();
      fetchStats();
    }
  }, [user, authLoading, searchTerm, stageFilter, statusFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const response = await leadsAPI.getStats();
      if (response.data?.success) {
        const data = response.data.data;

        const stageCounts = {};
        data.by_stage.forEach(item => {
          stageCounts[item.stage] = parseInt(item.count);
        });

        const total = data.by_stage.reduce((acc, item) => acc + parseInt(item.count), 0);

        setStats({
          total: total,
          screening: stageCounts['Screening'] || 0,
          sourcing: stageCounts['Sourcing'] || 0,
          walkin: stageCounts['Walk-in'] || 0,
          closure: stageCounts['Closure'] || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        stage: stageFilter === 'all' ? '' : stageFilter,
        status: statusFilter === 'all' ? '' : statusFilter
      };

      const response = await leadsAPI.getLeads(params);
      const data = response.data;
      setLeads(data.data || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name || lead.phone}"?`)) return;
    try {
      await leadsAPI.deleteLead(lead.id);
      toast.success('Lead deleted');
      fetchLeads();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'New', label: 'New' },
    { id: 'Contacted', label: 'Contacted' },
    { id: 'Screening', label: 'Screening' },
    { id: 'Qualified', label: 'Qualified' },
    { id: 'Proposal', label: 'Proposal' },
    { id: 'Negotiation', label: 'Negotiation' },
    { id: 'Site Visit', label: 'Site Visit' },
    { id: 'Agreement', label: 'Agreement' },
    { id: 'Payment', label: 'Payment' },
    { id: 'Closed Won', label: 'Closed Won' },
  ];

  const handleStatusChange = async (lead, newStatus, newStage = null) => {
    try {
      const updateData = { status: newStatus };
      if (newStage) updateData.stage = newStage;

      await leadsAPI.updateLead(lead.id, updateData);
      toast.success(`Updated to ${newStage || lead.stage} - ${newStatus}`);
      fetchLeads();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const stageStatusMapping = {
    'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead'],
    'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
  };

  const stageColors = {
    'Screening': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Sourcing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Walk-in': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'Closure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  const statusColors = {
    'Uncontacted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Not Interested': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Not Responding': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Dead': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Hot': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Warm': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cold': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0E1117] p-6 md:p-10 space-y-10 max-w-[1500px] mx-auto pb-24">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Database Engine</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                Live Sync Active
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight flex items-center gap-4">
              Lead Center
              <Sparkles className="w-10 h-10 text-yellow-400/80 animate-pulse hidden md:block" />
            </h1>
            <p className="text-gray-500 text-lg max-w-xl font-medium leading-relaxed">
              Real-time monitoring and lifecycle management for your cross-channel leads.
            </p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <Button
              onClick={() => router.push('/lms/leads/new')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/30 h-14 px-8 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-sm border-0"
            >
              <Plus className="w-5 h-5 mr-3" /> Create Lead
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard title="Pipeline Total" value={stats.total} icon={Zap} colorClass="text-indigo-400" bgClass="bg-indigo-400" delay={0.1} />
          <StatsCard title="Screening" value={stats.screening} icon={Users} colorClass="text-blue-400" bgClass="bg-blue-400" delay={0.2} />
          <StatsCard title="Sourcing" value={stats.sourcing} icon={Search} colorClass="text-yellow-400" bgClass="bg-yellow-400" delay={0.3} />
          <StatsCard title="Walk-in" value={stats.walkin} icon={MapPin} colorClass="text-pink-400" bgClass="bg-pink-400" delay={0.4} />
          <StatsCard title="Closure" value={stats.closure} icon={CheckCircle2} colorClass="text-emerald-400" bgClass="bg-emerald-400" delay={0.5} />
        </div>

        {/* Management Toolbar */}
        <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-2xl">
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Stage Filter */}
            <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5">
              <span className="px-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">Stage:</span>
              <select
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setStatusFilter('all'); setCurrentPage(1); }}
                className="bg-transparent text-gray-300 text-xs font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Stages</option>
                {Object.keys(stageStatusMapping).map(stage => (
                  <option key={stage} value={stage} className="bg-[#161B22]">{stage}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5">
              <span className="px-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-gray-300 text-xs font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                {(stageFilter === 'all'
                  ? Array.from(new Set(Object.values(stageStatusMapping).flat()))
                  : stageStatusMapping[stageFilter]
                ).map(status => (
                  <option key={status} value={status} className="bg-[#161B22]">{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex w-full xl:w-auto gap-4 px-2">
            <div className="relative flex-1 xl:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-12 pr-6 py-4 bg-[#0E1117]/80 border border-white/5 rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5 shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>
            <Button variant="outline" className="h-14 w-14 p-0 rounded-2xl border-white/5 bg-[#0E1117]/80 hover:bg-white/5">
              <Filter className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-40 gap-6"
              >
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Querying Lead Matrix...</p>
              </motion.div>
            ) : (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                {leads.length > 0 ? (
                  viewMode === 'table' ? (
                    <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#0D1117]/50">
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Lead Info</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Contact Details</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Location</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Stages</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {leads.map((lead, idx) => {
                              const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));
                              const statusColors = {
                                'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                'Contacted': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                'Screening': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                                'Qualified': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                'Proposal': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                                'Negotiation': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                                'Site Visit': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                                'Agreement': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                                'Payment': 'bg-green-500/10 text-green-400 border-green-500/20',
                                'Closed Won': 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              };

                              return (
                                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-indigo-400 font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                        {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                      <div>
                                        <p className="text-white font-bold text-sm">{lead.name || 'Unknown Lead'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(lead.created_at || lead.createdAt), 'MMM dd, yyyy')}
                                          </span>
                                          {isMetaLead && (
                                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/5 px-1.5 py-0.5 rounded-full border border-blue-400/20">
                                              Meta
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                        <Phone className="h-3 w-3 mr-2 opacity-50" />
                                        {lead.phone || 'No phone'}
                                      </div>
                                      {lead.email && (
                                        <div className="flex items-center text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                          <Mail className="h-3 w-3 mr-2 opacity-50" />
                                          {lead.email}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                      <MapPin className="h-3 w-3 mr-2 opacity-50" />
                                      {lead.location || 'Location not set'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                    <select
                                      value={lead.stage || 'Screening'}
                                      onChange={(e) => {
                                        const newStage = e.target.value;
                                        handleStatusChange(lead, stageStatusMapping[newStage][0], newStage);
                                      }}
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${stageColors[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                                    >
                                      {Object.keys(stageStatusMapping).map(stage => (
                                        <option key={stage} value={stage} className="bg-[#161B22] text-gray-300">
                                          {stage}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-6 py-4">
                                    <select
                                      value={lead.status || 'Uncontacted'}
                                      onChange={(e) => handleStatusChange(lead, e.target.value, lead.stage)}
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                                    >
                                      {(stageStatusMapping[lead.stage] || stageStatusMapping['Screening']).map(status => (
                                        <option key={status} value={status} className="bg-[#161B22] text-gray-300">
                                          {status}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => router.push(`/lms/leads/${lead.id}`)}
                                        className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => router.push(`/lms/leads/${lead.id}/edit`)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(lead)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {leads.map((lead, idx) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          index={idx}
                          onView={() => router.push(`/lms/leads/${lead.id}`)}
                          onEdit={() => router.push(`/lms/leads/${lead.id}/edit`)}
                          onDelete={() => handleDelete(lead)}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="col-span-full py-32 text-center bg-[#161B22]/20 rounded-[3rem] border-2 border-dashed border-white/5">
                    <div className="h-24 w-24 bg-indigo-500/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-indigo-500/10">
                      <Users className="h-10 w-10 text-indigo-500/40" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">No Leads Captured</h3>
                    <p className="text-gray-600 mt-2 max-w-xs mx-auto font-medium">Verify your Facebook Ads integration or manually add leads to see them here.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-6 mt-16 pt-10 border-t border-white/5"
          >
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="px-8 h-12 rounded-xl bg-[#161B22]/40 border-white/5 text-gray-500 hover:text-white transition-all disabled:opacity-20"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-500 pb-0.5">Page</span>
              <span className="text-xl font-black text-white tabular-nums">{currentPage}</span>
              <span className="text-xs font-black uppercase tracking-widest text-gray-600 pb-0.5">of {totalPages}</span>
            </div>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="px-8 h-12 rounded-xl bg-[#161B22]/40 border-white/5 text-gray-500 hover:text-white transition-all disabled:opacity-20"
            >
              Next
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
