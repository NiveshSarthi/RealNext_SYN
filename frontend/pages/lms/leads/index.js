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
const LeadCard = ({ lead, onEdit, onDelete, onView, index }) => {
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));

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
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${lead.status === 'qualified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  lead.status === 'interested' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    lead.status === 'won' || lead.status === 'closed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      lead.status === 'lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                {lead.status || 'New'}
              </span>
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
    new: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchLeads();
      fetchStats();
    }
  }, [user, authLoading, searchTerm, statusFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const response = await leadsAPI.getStats();
      if (response.data?.success) {
        const data = response.data.data;
        const statusCounts = {};
        data.by_status.forEach(item => {
          statusCounts[item.status] = parseInt(item.count);
        });

        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        setStats({
          total: total,
          new: statusCounts['new'] || 0,
          contacted: statusCounts['contacted'] || 0,
          qualified: statusCounts['qualified'] || 0,
          won: statusCounts['closed'] || statusCounts['won'] || 0,
          lost: statusCounts['lost'] || 0
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
        limit: 12, // Better for grid layout
        search: searchTerm,
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
    { id: 'new', label: 'Fresh Leads' },
    { id: 'contacted', label: 'In Progress' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'won', label: 'Success' },
    { id: 'lost', label: 'Closed' },
  ];

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
          <StatsCard title="Fresh Leads" value={stats.new} icon={Users} colorClass="text-blue-400" bgClass="bg-blue-400" delay={0.2} />
          <StatsCard title="In Discussion" value={stats.contacted} icon={Phone} colorClass="text-yellow-400" bgClass="bg-yellow-400" delay={0.3} />
          <StatsCard title="High Quality" value={stats.qualified} icon={Star} colorClass="text-emerald-400" bgClass="bg-emerald-400" delay={0.4} />
          <StatsCard title="Converted" value={stats.won} icon={CheckCircle2} colorClass="text-purple-400" bgClass="bg-purple-400" delay={0.5} />
        </div>

        {/* Management Toolbar */}
        <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-3 flex flex-col xl:flex-row justify-between items-center gap-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 w-full xl:w-auto overflow-x-auto border border-white/5 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
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
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {leads.length > 0 ? (
                  leads.map((lead, idx) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      index={idx}
                      onView={() => router.push(`/lms/leads/${lead.id}`)}
                      onEdit={() => router.push(`/lms/leads/${lead.id}/edit`)}
                      onDelete={() => handleDelete(lead)}
                    />
                  ))
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
