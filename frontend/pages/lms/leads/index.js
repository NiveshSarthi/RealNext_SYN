import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
  ArchiveBoxXMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#161B22] border border-border/50 rounded-xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-all">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
      <Icon className="h-16 w-16" />
    </div>
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${bgClass} ${colorClass} bg-opacity-10 mb-3`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </div>
);

// Lead Card Component (replacing Row)
const LeadCard = ({ lead, onEdit, onDelete, onView }) => (
  <div className="bg-[#161B22] border border-border/50 rounded-xl p-5 hover:border-primary/50 transition-all group relative">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mr-3 text-primary font-bold">
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <h4 className="text-white font-medium truncate max-w-[150px]" title={lead.name}>{lead.name || 'Unknown'}</h4>
          <div className="flex items-center text-xs text-gray-400 mt-1">
            {lead.tags && lead.tags.includes('Meta') && (
              <span className="flex items-center text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1"></span>
                Meta
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${lead.status === 'qualified' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
              lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                lead.status === 'interested' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  lead.status === 'closed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    lead.status === 'lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
              {lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'New'}
            </span>
          </div>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => onEdit(lead)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
          <PencilIcon className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(lead)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="space-y-2 text-sm text-gray-400">
      <div className="flex items-center">
        <PhoneIcon className="h-4 w-4 mr-2" />
        {lead.phone}
      </div>
      <div className="flex items-center">
        <MapPinIcon className="h-4 w-4 mr-2" />
        {lead.location || 'N/A'}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
        <span className="text-xs text-gray-500">
          <CalendarDaysIcon className="h-3 w-3 inline mr-1" />
          {(lead.createdAt || lead.created_at) ? new Date(lead.createdAt || lead.created_at).toLocaleDateString() : 'N/A'}
        </span>
        <button onClick={() => onView(lead)} className="text-xs text-primary hover:underline flex items-center">
          View Details <EyeIcon className="h-3 w-3 ml-1" />
        </button>
      </div>
    </div>
  </div>
);

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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'contacted', etc.
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
      if (response.data && response.data.success) {
        const data = response.data.data;
        // Parse by_status array: [{status: 'new', count: '5'}, ...]
        const statusCounts = {};
        data.by_status.forEach(item => {
          statusCounts[item.status] = parseInt(item.count);
        });

        // Calculate total or use pagination total elsewhere, 
        // but for stats card we sum up status counts which is accurate for 'Lead Status' breakdown
        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        setStats({
          total: total,
          new: statusCounts['new'] || 0,
          contacted: statusCounts['contacted'] || 0,
          qualified: statusCounts['qualified'] || 0,
          won: statusCounts['closed'] || 0, // Mapping 'closed' to 'won' for UI if applicable, or check DB enum
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
        limit: 20, // Grid view can show more or same
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter
      };

      const response = await leadsAPI.getLeads(params);
      const data = response.data;
      setLeads(data.data || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 20));
      // Optionally update total stats from pagination if stats endpoint fails
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Are you sure you want to delete the lead "${lead.name || lead.phone}"?`)) {
      return;
    }
    try {
      await leadsAPI.deleteLead(lead.id);
      toast.success('Lead deleted successfully');
      fetchLeads();
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'closed', label: 'Won' }, // DB uses 'closed' usually, UI shows 'Won'
    { id: 'lost', label: 'Lost' },
  ];

  if (loading && leads.length === 0) { // Initial load
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in content-container pb-10">

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
            <SparklesIcon className="h-40 w-40 text-white" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                My Leads <SparklesIcon className="h-6 w-6 text-yellow-300 animate-pulse" />
              </h1>
              <p className="text-violet-100 mt-1">Manage and track your assigned leads</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard
            title="Total Leads"
            value={stats.total}
            icon={DocumentTextIcon}
            colorClass="text-white"
            bgClass="bg-gray-700"
          />
          <StatsCard
            title="New"
            value={stats.new}
            icon={UsersIcon}
            colorClass="text-blue-400"
            bgClass="bg-blue-400"
          />
          <StatsCard
            title="Contacted"
            value={stats.contacted}
            icon={PhoneIcon}
            colorClass="text-yellow-400"
            bgClass="bg-yellow-400"
          />
          <StatsCard
            title="Qualified"
            value={stats.qualified}
            icon={StarIcon}
            colorClass="text-orange-400"
            bgClass="bg-orange-400"
          />
          <StatsCard
            title="Won"
            value={stats.won}
            icon={CheckCircleIcon}
            colorClass="text-green-400"
            bgClass="bg-green-400"
          />
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#161B22] border border-border/50 rounded-xl p-2 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Tabs */}
          <div className="flex bg-[#0E1117] rounded-lg p-1 w-full md:w-auto overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statusFilter === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-9 pr-4 py-2 bg-[#0E1117] border border-border/50 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => router.push('/lms/leads/new')} variant="primary" className="shrink-0">
              <PlusIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onView={() => router.push(`/lms/leads/${lead.id}`)}
                onEdit={() => router.push(`/lms/leads/${lead.id}/edit`)}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">No leads found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

        {/* Pagination - Simple */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-[#161B22] border border-border/50 text-gray-400 disabled:opacity-50 hover:bg-white/5"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-400">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-[#161B22] border border-border/50 text-gray-400 disabled:opacity-50 hover:bg-white/5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
