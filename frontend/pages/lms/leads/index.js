import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI, teamAPI } from '../../../utils/api';
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
  Zap,
  UserPlus,
  Megaphone,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/Dialog";

import ImportLeadsModal from '../../../components/leads/ImportLeadsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Modal Component for Assignment
const AssignModal = ({ isOpen, onClose, onAssign, lead, members }) => {
  const [selectedMember, setSelectedMember] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedMember(lead?.assigned_to?._id || lead?.assigned_to || '');
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <h3 className="text-xl font-bold text-white mb-4">Assign Lead</h3>
        <p className="text-gray-400 text-sm mb-6">
          Assign <strong>{lead?.name}</strong> to a team member.
        </p>

        <div className="space-y-4">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Select Member</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Select a member...</option>
            {members.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancel</Button>
          <Button
            onClick={() => onAssign(lead.id, selectedMember)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {selectedMember ? 'Assign Member' : 'Unassign'}
          </Button>
        </div>
      </div>
    </div>
  );
};

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
const LeadCard = ({ lead, onEdit, onDelete, onView, onStatusChange, onAssign, canEdit, index }) => {
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));

  const stageStatusMapping = {
    'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Qualified'],
    'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost', 'Visit expected', 'Schedule', 'Done'],
    'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost', 'Token expected', 'Re-Walkin'],
    'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
  };

  const statusColors = {
    'Uncontacted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Not Interested': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Not Responding': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Dead': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Qualified': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Hot': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Warm': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cold': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Visit expected': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Schedule': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Done': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Token expected': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Re-Walkin': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  };

  const stageColors = {
    'Screening': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Sourcing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Walk-in': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'Closure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  const handleStageChange = async (e) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("You don't have permission to edit this lead");
      return;
    }
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
                disabled={!canEdit}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${stageColors[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
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
                disabled={!canEdit}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
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
          <button onClick={() => onAssign(lead)} className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Assign Lead">
            <UserPlus className="h-4 w-4" />
          </button>
          {canEdit && (
            <button onClick={() => onEdit(lead)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Pencil className="h-4 w-4" />
            </button>
          )}
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
        {lead.assigned_to && (
          <div className="flex items-center text-xs font-bold text-indigo-400 mt-2 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
            <Users className="h-3 w-3 mr-2" />
            Assigned to: {lead.assigned_to.name || 'Unknown'}
          </div>
        )}

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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [formNameFilter, setFormNameFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [budgetMinFilter, setBudgetMinFilter] = useState('');
  const [budgetMaxFilter, setBudgetMaxFilter] = useState('');
  const [aiScoreMinFilter, setAiScoreMinFilter] = useState('');
  const [aiScoreMaxFilter, setAiScoreMaxFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Quick Update Modal State
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState(null);
  const [quickUpdateForm, setQuickUpdateForm] = useState({
    name: '',
    phone: '',
    email: '',
    campaign_name: '',
    source: '',
    budget_min: '',
    budget_max: '',
    notes: '',
    stage: 'Screening',
    status: 'Uncontacted'
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [quickUpdateStatus, setQuickUpdateStatus] = useState('');

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Derived permissions
  const isSuperAdmin = user?.is_super_admin;
  const isClientAdminOrManager = user?.client?.role === 'admin' || user?.client?.role === 'manager';

  // Helper check for edit permission
  const canEditLead = (lead) => {
    // If super admin or client admin/manager, allow
    if (isSuperAdmin || isClientAdminOrManager) return true;
    // If assigned, only allow if assigned to current user
    if (lead.assigned_to) {
      return user && (lead.assigned_to._id === user.id || lead.assigned_to === user.id);
    }
    // If unassigned, allow all (or restriction policy can be applied here)
    return true;
  };

  useEffect(() => {
    console.log('[LEADS-FRONTEND] useEffect triggered - user:', user, 'authLoading:', authLoading);
    if (!authLoading && !user) {
      console.log('[LEADS-FRONTEND] No user, redirecting to login');
      router.push('/');
    } else if (user) {
      console.log('[LEADS-FRONTEND] User authenticated, fetching data');
      fetchLeads();
      fetchStats();
      fetchTeamMembers();
    }
  }, [user, authLoading, searchTerm, stageFilter, statusFilter, sourceFilter, formNameFilter, campaignFilter, assignedFilter, budgetMinFilter, budgetMaxFilter, aiScoreMinFilter, aiScoreMaxFilter, startDateFilter, endDateFilter, currentPage, router.query.refresh]);

  // Auto-refresh leads every 30 seconds for real-time updates
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(() => {
      // Only auto-refresh if user is not actively interacting (no modals open)
      if (!showAdvancedFilters && !isAssignModalOpen && !isUpdateModalOpen && !isImportModalOpen) {
        console.log('[LEADS-FRONTEND] Auto-refreshing leads data');
        fetchLeads(false).catch(error => {
          console.error('[LEADS-FRONTEND] Auto-refresh failed:', error);
        });
        fetchStats().catch(error => {
          console.error('[LEADS-FRONTEND] Auto-refresh stats failed:', error);
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, authLoading, showAdvancedFilters, isAssignModalOpen, isUpdateModalOpen, isImportModalOpen]);

  const fetchTeamMembers = async () => {
    try {
      const res = await teamAPI.getTeam();
      if (res.data?.success) {
        setTeamMembers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch team", err);
    }
  };

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

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        stage: stageFilter === 'all' ? '' : stageFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        source: sourceFilter === 'all' ? '' : sourceFilter,
        form_name: formNameFilter === 'all' ? '' : formNameFilter,
        campaign_name: campaignFilter === 'all' ? '' : campaignFilter,
        assigned_to: assignedFilter === 'all' ? '' : assignedFilter,
        budget_min: budgetMinFilter || '',
        budget_max: budgetMaxFilter || '',
        ai_score_min: aiScoreMinFilter || '',
        ai_score_max: aiScoreMaxFilter || '',
        start_date: startDateFilter || '',
        end_date: endDateFilter || ''
        // TODO: Add back when filters are implemented
        // tags: tagsFilter || '',
        // location: locationFilter || '',
        // last_contact_start_date: lastContactStartDateFilter || '',
        // last_contact_end_date: lastContactEndDateFilter || '',
        // facebook_lead_id: facebookLeadIdFilter || ''
      };

      console.log('[LEADS-FRONTEND] Fetching leads with params:', params);
      const response = await leadsAPI.getLeads(params);
      console.log('[LEADS-FRONTEND] API Response:', response);
      const data = response.data;
      console.log('[LEADS-FRONTEND] Setting leads data:', data.data || []);
      setLeads(data.data || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name || lead.phone}"?`)) return;

    // Optimistic Update: Remove immediately from UI
    setLeads(prev => prev.filter(l => l.id !== lead.id));

    try {
      await leadsAPI.deleteLead(lead.id);
      toast.success('Lead deleted');

      // Silent refresh to keep stats and pagination in sync
      fetchLeads(false);
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete');
      // Revert/Refetch if failed
      fetchLeads(false);
    }
  };

  const handleAssignClick = (lead) => {
    setSelectedLeadForAssign(lead);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (leadId, userId) => {
    try {
      await leadsAPI.assignLead(leadId, { user_id: userId });
      toast.success(userId ? "Lead assigned successfully" : "Lead unassigned");
      setIsAssignModalOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error("Failed to assign lead");
      console.error(error);
    }
  };

  const handleStatusChange = async (lead, newStatus, newStage = null) => {
    if (!canEditLead(lead)) {
      toast.error("You don't have permission to edit this lead");
      return;
    }
    try {
      const updateData = { status: newStatus };
      if (newStage) updateData.stage = newStage;

      await leadsAPI.updateLead(lead.id, updateData);
      toast.success(`Updated to ${newStage || lead.stage} - ${newStatus}`);
      fetchLeads(false); // Silent refresh
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleRowDoubleClick = (lead) => {
    if (!canEditLead(lead)) return;
    setSelectedLeadForUpdate(lead);
    setQuickUpdateForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      campaign_name: lead.campaign_name || '',
      source: lead.source || '',
      budget_min: lead.budget_min || '',
      budget_max: lead.budget_max || '',
      notes: lead.notes || '',
      stage: lead.stage || 'Screening',
      status: lead.status || 'Uncontacted'
    });
    setIsUpdateModalOpen(true);
  };

  const handleQuickUpdate = async () => {
    if (!selectedLeadForUpdate) return;

    try {
      await leadsAPI.updateLead(selectedLeadForUpdate.id, quickUpdateForm);
      toast.success('Lead updated successfully');
      fetchLeads(false);
      fetchStats();
      setIsUpdateModalOpen(false);
      setSelectedLeadForUpdate(null);
    } catch (error) {
      toast.error('Failed to update lead');
      console.error(error);
    }
  };

  const stageStatusMapping = {
    'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Qualified'],
    'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost', 'Visit expected', 'Schedule', 'Done'],
    'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost', 'Token expected', 'Re-Walkin'],
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
    'Qualified': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Hot': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Warm': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cold': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Visit expected': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Schedule': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Done': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Token expected': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Re-Walkin': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0E1117] p-6 md:p-10 space-y-10 max-w-[1500px] mx-auto pb-24">

        <AssignModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignSubmit}
          lead={selectedLeadForAssign}
          members={teamMembers}
        />

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
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="bg-[#161B22] border-white/10 hover:bg-white/5 text-white shadow-2xl h-14 px-8 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-sm"
            >
              <Sparkles className="w-5 h-5 mr-3 text-indigo-400" /> Import
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
            {/* Stage Filter - Prominent on main page */}
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

            {/* Status Filter - Prominent on main page */}
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
                placeholder="Search by name, email, phone, location, form, campaign, notes..."
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
            <Button
              onClick={() => {
                fetchLeads(false); // Force refresh
                fetchStats();
                toast.success('Data refreshed');
              }}
              variant="outline"
              className="h-14 px-6 rounded-2xl border-white/5 bg-[#0E1117]/80 hover:bg-white/5 mr-3"
            >
              <RefreshCw className="h-5 w-5 text-gray-500" />
            </Button>
            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className={`h-14 px-6 rounded-2xl border-white/5 bg-[#0E1117]/80 hover:bg-white/5 ${showAdvancedFilters ? 'bg-indigo-600/20 border-indigo-500/30' : ''}`}
            >
              <Filter className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-xs font-black uppercase tracking-widest">Advanced</span>
            </Button>
          </div>
        </div>

        {/* Advanced Filters Sidebar */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setShowAdvancedFilters(false)}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-[#161B22]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white">Advanced Filters</h3>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Filters Grid */}
                  <div className="space-y-6">


                    {/* Form Name Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Form Name</label>
                      <select
                        value={formNameFilter}
                        onChange={(e) => { setFormNameFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      >
                        <option value="all">All Forms</option>
                        <option value="Navraj-copy-copy">Navraj-copy-copy</option>
                        <option value="BUILDER FLOOR_sept-copy">BUILDER FLOOR_sept-copy</option>
                        <option value="BUILDER FLOOR_sept">BUILDER FLOOR_sept</option>
                        <option value="Amolik Concordia sector 97 Faridabad">Amolik Concordia sector 97 Faridabad</option>
                        <option value="Navraj">Navraj</option>
                        <option value="Navraj-copy">Navraj-copy</option>
                        <option value="NAVRAJ-copy">NAVRAJ-copy</option>
                        <option value="NAVRAJ">NAVRAJ</option>
                      </select>
                    </div>

                    {/* Campaign Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Campaign</label>
                      <input
                        type="text"
                        placeholder="Campaign name..."
                        value={campaignFilter}
                        onChange={(e) => { setCampaignFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>

                    {/* Assigned To Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Assigned To</label>
                      <select
                        value={assignedFilter}
                        onChange={(e) => { setAssignedFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      >
                        <option value="all">All Members</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Budget Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={budgetMinFilter}
                          onChange={(e) => { setBudgetMinFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={budgetMaxFilter}
                          onChange={(e) => { setBudgetMaxFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* AI Score Range */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">AI Score Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          min="0"
                          max="100"
                          value={aiScoreMinFilter}
                          onChange={(e) => { setAiScoreMinFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          min="0"
                          max="100"
                          value={aiScoreMaxFilter}
                          onChange={(e) => { setAiScoreMaxFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <input
                          type="date"
                          value={endDateFilter}
                          onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
                          className="flex-1 bg-[#0E1117]/80 border border-white/5 rounded-xl px-3 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => {
                          setStageFilter('all');
                          setFormNameFilter('all');
                          setCampaignFilter('all');
                          setAssignedFilter('all');
                          setSourceFilter('all');
                          setBudgetMinFilter('');
                          setBudgetMaxFilter('');
                          setAiScoreMinFilter('');
                          setAiScoreMaxFilter('');
                          setStartDateFilter('');
                          setEndDateFilter('');
                          setStatusFilter('all');
                          // TODO: Add missing state declarations for filters
                          // setTagsFilter('');
                          // setLocationFilter('');
                          // setLastContactStartDateFilter('');
                          // setLastContactEndDateFilter('');
                          // setFacebookLeadIdFilter('');
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        className="flex-1 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400"
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                        <table className="w-full min-w-[1500px] text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#0D1117]/50">
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Lead Info</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Contact Details</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Form Name</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Assigned To</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Stages</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</th>
                              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {leads.map((lead, idx) => {
                              const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));
                              const isImportLead = lead.source === 'import' || lead.source === 'referral';
                              const isManualLead = lead.source === 'manual';
                              const canEdit = canEditLead(lead);
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
                                <tr key={lead.id} onDoubleClick={() => handleRowDoubleClick(lead)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
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
                                          {isImportLead && (
                                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                                              CSV
                                            </span>
                                          )}
                                          {isManualLead && (
                                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/5 px-1.5 py-0.5 rounded-full border border-orange-400/20">
                                              Manually
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
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                        <FileText className="h-3 w-3 mr-2 opacity-50" />
                                        {lead.form_name || lead.campaign_name || 'No Form'}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {lead.assigned_to ? (
                                      <div className="flex items-center text-[10px] font-bold text-indigo-400">
                                        <Users className="h-3 w-3 mr-1" />
                                        {lead.assigned_to.name}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-600 italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                    <select
                                      value={lead.stage || 'Screening'}
                                      onChange={(e) => {
                                        const newStage = e.target.value;
                                        handleStatusChange(lead, stageStatusMapping[newStage][0], newStage);
                                      }}
                                      disabled={!canEdit}
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${stageColors[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
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
                                      disabled={!canEdit}
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
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
                                        onClick={() => handleAssignClick(lead)}
                                        className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        title="Assign Lead"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => router.push(`/lms/leads/${lead.id}`)}
                                        className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      {canEdit && (
                                        <button
                                          onClick={() => router.push(`/lms/leads/${lead.id}/edit`)}
                                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                      )}
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
                          canEdit={canEditLead(lead)}
                          onView={() => router.push(`/lms/leads/${lead.id}`)}
                          onEdit={() => router.push(`/lms/leads/${lead.id}/edit`)}
                          onDelete={() => handleDelete(lead)}
                          onAssign={() => handleAssignClick(lead)}
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
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#161B22] border-[#1F2937] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Quick Update Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name</label>
                <input
                  value={quickUpdateForm.name}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, name: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                <input
                  value={quickUpdateForm.phone}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, phone: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <input
                  value={quickUpdateForm.email}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, email: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Form Name</label>
                <input
                  value={quickUpdateForm.form_name}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, form_name: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Source</label>
                <input
                  value={quickUpdateForm.source}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, source: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Budget</label>
                <input
                  type="number"
                  value={quickUpdateForm.budget_min}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, budget_min: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Budget</label>
                <input
                  type="number"
                  value={quickUpdateForm.budget_max}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, budget_max: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notes</label>
              <textarea
                value={quickUpdateForm.notes}
                onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                placeholder="Add a quick note..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stage</label>
                <select
                  value={quickUpdateForm.stage}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, stage: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {Object.keys(stageStatusMapping).map((stage) => (
                    <option key={stage} value={stage} className="bg-[#161B22]">{stage}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                <select
                  value={quickUpdateForm.status}
                  onChange={(e) => setQuickUpdateForm({ ...quickUpdateForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {(stageStatusMapping[quickUpdateForm.stage] || stageStatusMapping['Screening']).map((status) => (
                    <option key={status} value={status} className="bg-[#161B22]">{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdateModalOpen(false)}
              className="bg-transparent border-white/10 text-gray-400 hover:text-white rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleQuickUpdate} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchLeads();
          fetchStats();
        }}
      />
    </Layout>
  );
}
