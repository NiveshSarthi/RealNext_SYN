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
  RefreshCw,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Send,
  MoreVertical,
  CheckCircle,
  Clock,
  Circle,
  TrendingUp,
  AlertTriangle,
  SendHorizontal,
  ChevronRight,
  User,
  Activity,
  Briefcase,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Building2,
  Check,
  Loader2,
  ChevronLeft
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
    className="bg-[#161B22]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-32 sm:h-36 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl"
  >
    <div className={`absolute -top-4 -right-4 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${colorClass}`}>
      <Icon className="h-20 w-20 sm:h-24 sm:w-24" />
    </div>
    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} bg-opacity-10 mb-2 sm:mb-4 border border-white/5`}>
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </div>
    <div>
      <p className="text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-xl sm:text-3xl font-black text-white mt-0.5 sm:mt-1 tabular-nums">{value}</h3>
    </div>
  </motion.div>
);

// Lead Card Component
const LeadCard = ({ lead, onEdit, onDelete, onView, onStatusChange, onAssign, canEdit, index }) => {
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));


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
      <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-indigo-400 font-black text-lg shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
            {lead.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-base sm:text-lg truncate max-w-[180px]" title={lead.name}>{lead.name || 'Unknown Lead'}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {isMetaLead && (
                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded-full border border-blue-400/20">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Meta
                </span>
              )}
              <select
                value={lead.stage || 'Screening'}
                onChange={handleStageChange}
                onClick={(e) => e.stopPropagation()}
                disabled={!canEdit}
                className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border bg-[#0D1117] cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${stageColors[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
              >
                {Object.keys(stageStatusMapping).map(stage => (
                  <option key={stage} value={stage} className="bg-[#161B22] text-gray-300">
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#0D1117] p-1 rounded-xl shadow-xl self-end sm:self-auto">
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

// --- NEW DESIGN COMPONENTS ---

const CommunicationButton = ({ icon: Icon, label, color, onClick, sublabel }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all active:scale-95 group relative overflow-hidden ${color}`}
  >
    <div className="relative z-10 flex flex-col items-center">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{label}</span>
      {sublabel && <span className="text-[7px] sm:text-[8px] opacity-60 mt-0.5 hidden sm:inline">{sublabel}</span>}
    </div>
    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const LeadListItem = ({ lead, isSelected, onClick, canEdit }) => {
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));
  const score = lead.ai_score || lead.lead_score || 0;

  const scoreColor = score > 80 ? 'text-emerald-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = score > 80 ? 'bg-emerald-400/10 border-emerald-400/20' : score > 50 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-red-400/10 border-red-400/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`p-4 rounded-[1.5rem] border cursor-pointer transition-all mb-2 group relative overflow-hidden ${isSelected
        ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl'
        : 'bg-[#161B22]/40 border-white/5 hover:border-white/10 hover:bg-[#161B22]/60'
        }`}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`h-12 w-12 rounded-2xl bg-[#161B22] border border-white/10 flex items-center justify-center text-indigo-400 font-black text-lg shadow-2xl relative overflow-hidden ${isSelected ? 'scale-105 border-indigo-500/30' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50" />
          <span className="relative z-10">{lead.name?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-md font-black truncate tracking-tight ${isSelected ? 'text-white' : 'text-gray-200'}`}>
              {lead.name || 'Anonymous'}
            </h4>
            <div className={`px-2.5 py-1 rounded-full text-[8px] font-black border tracking-widest uppercase flex items-center gap-1.5 ${scoreBg} ${scoreColor}`}>
              <div className="w-1 h-1 rounded-full bg-current opacity-40" />
              {score}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-500 font-bold tracking-tight truncate max-w-[120px]">
                {lead.phone || 'No Phone Sync'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">
                {lead.status}
              </span>
              <ChevronRight className={`h-3 w-3 text-gray-800 transition-transform ${isSelected ? 'translate-x-1 text-indigo-500' : 'group-hover:translate-x-0.5'}`} />
            </div>
          </div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
      )}
    </motion.div>
  );
};

const LeadDetailPane = ({ lead, onEdit, onStatusChange, teamMembers, onAssign, canEdit, onUpdate }) => {
  if (!lead) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <Users className="h-16 w-16 mb-4 opacity-10" />
      <p className="font-black uppercase tracking-[0.2em] text-xs opacity-30">Select a lead to visualize matrix</p>
    </div>
  );

  const score = lead.ai_score || lead.lead_score || 0;
  const isMetaLead = lead.source === 'Facebook Ads' || (lead.tags && lead.tags.includes('Meta'));

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    budget_min: '',
    budget_max: '',
    property_type: '',
    status: '',
    stage: ''
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        location: lead.location || '',
        budget_min: lead.budget_min || 0,
        budget_max: lead.budget_max || 0,
        property_type: lead.property_type || lead.custom_fields?.p_type || 'Residential',
        status: lead.status || 'Uncontacted',
        stage: lead.stage || 'Screening'
      });
      setIsEditing(false);
    }
  }, [lead?.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await leadsAPI.updateLead(lead.id, editForm);
      if (res.data?.success) {
        toast.success("Lead sync updated");
        // Update local state without search/global refresh
        const freshLead = await leadsAPI.getLead(lead.id);
        if (freshLead.data?.success) {
          // This updates the selected lead in the parent component via the reference
          // In index.js, selectedLead is passed down. We need to ensure the parent's state is updated.
          // For now, we'll assume the parent handles the state update if we had a callback, 
          // but since we are modifying the object, we need to find where setSelectedLead is.
          // Actually, we should probably pass a refresh callback from the parent.

          // Let's assume onStatusChange or a new onUpdate callback is needed.
          // For now, I'll update it locally and suggest a callback in the next step if needed.
          setIsEditing(false);
          // Trigger a silent refresh in parent if available
          if (onUpdate) {
            onUpdate(freshLead.data.data);
          } else {
            onStatusChange(lead, lead.status, lead.stage);
          }
        }
      }
    } catch (err) {
      toast.error("Failed to update matrix");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-3xl bg-[#161B22] border border-white/10 flex items-center justify-center text-indigo-400 font-black text-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50" />
            <span className="relative z-10">{lead.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xl sm:text-2xl font-black text-white focus:outline-none focus:border-indigo-500/50 w-full sm:w-auto"
                  placeholder="Lead Name"
                />
              ) : (
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{lead.name || 'Anonymous'}</h2>
              )}
              <div className={`px-2 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-black border tracking-[0.2em] uppercase flex items-center gap-1 sm:gap-2 ${score > 80 ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                score > 50 ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                  'bg-red-400/10 border-red-400/20 text-red-400'
                }`}>
                <span className="opacity-60">Score:</span>
                <span className="text-sm sm:text-lg leading-none">{score}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 opacity-40" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 min-w-[150px]"
                    placeholder="Location"
                  />
                ) : (
                  lead.location || 'Unknown Location'
                )}
              </span>
              <div className="h-1 w-1 rounded-full bg-gray-800" />
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={editForm.stage}
                    onChange={(e) => setEditForm({ ...editForm, stage: e.target.value, status: stageStatusMapping[e.target.value][0] })}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                  >
                    {Object.keys(stageStatusMapping).map(stage => (
                      <option key={stage} value={stage} className="bg-[#161B22]">{stage}</option>
                    ))}
                  </select>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                  >
                    {(stageStatusMapping[editForm.stage] || stageStatusMapping['Screening']).map(status => (
                      <option key={status} value={status} className="bg-[#161B22]">{status}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-white/5'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-pulse" />
                  {lead.status}
                </span>
              )}
              <div className="h-1 w-1 rounded-full bg-gray-800" />
              <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-indigo-500/5 text-indigo-400 border border-indigo-500/20 flex items-center gap-2">
                {isMetaLead ? <Facebook className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {lead.source || 'Lead Ads'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {canEdit && (
            <>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="h-10 sm:h-12 border-white/10 bg-transparent hover:bg-white/5 text-gray-400 rounded-2xl px-4 sm:px-6 font-black uppercase tracking-widest text-[10px] sm:text-[11px]"
                  >
                    <X className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Cancel</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-6 sm:px-8 shadow-2xl shadow-emerald-900/40 font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-0"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 sm:mr-2" />}
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="h-10 sm:h-12 border-white/10 bg-transparent hover:bg-white/5 text-white rounded-2xl px-6 sm:px-8 font-black uppercase tracking-widest text-[10px] sm:text-[11px]"
                >
                  <Pencil className="h-4 w-4 sm:mr-2 opacity-50" /> <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
            </>
          )}
          <Button
            className="h-10 sm:h-12 bg-[#FF7A19] hover:bg-[#FF8B33] text-white rounded-2xl px-6 sm:px-10 shadow-2xl shadow-orange-900/40 font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-0"
          >
            <Zap className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Action</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="space-y-6">
          {/* Real Estate Property Requirements */}
          <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
              <Building2 className="h-32 w-32" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              Property Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Property Interest</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <select
                      value={editForm.property_type}
                      onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="Residential" className="bg-[#0D1117]">Residential</option>
                      <option value="Commercial" className="bg-[#0D1117]">Commercial</option>
                      <option value="Industrial" className="bg-[#0D1117]">Industrial</option>
                      <option value="Plot" className="bg-[#0D1117]">Plot</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-white leading-tight">
                    {lead.location || 'No Location'} - {lead.property_type || lead.custom_fields?.p_type || 'Residential'}
                  </p>
                )}
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Budget Range</p>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-1">
                    <input
                      type="number"
                      value={editForm.budget_min}
                      onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500/50 w-full sm:w-32 sm:text-right"
                      placeholder="Min"
                    />
                    <span className="text-gray-600 self-center hidden sm:inline">-</span>
                    <input
                      type="number"
                      value={editForm.budget_max}
                      onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500/50 w-full sm:w-32 sm:text-right"
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <p className="text-base sm:text-lg font-black text-emerald-400">
                    ₹{lead.budget_min?.toLocaleString() || '0'} - ₹{lead.budget_max?.toLocaleString() || 'Ask'}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Inquiry Source</p>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{lead.source || 'Direct'}</span>
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Priority</p>
                <div className="flex items-center sm:justify-end gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${score > 70 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-gray-500/10 border-white/5 text-gray-500'
                    }`}>
                    {score > 70 ? 'High Intent' : 'Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Communication Dashboard */}
          <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
              <PhoneCall className="h-3.5 w-3.5" />
              Communication Dashboard
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CommunicationButton
                icon={MessageSquare}
                label="WhatsApp"
                color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
                sublabel="Active Now"
              />
              <CommunicationButton
                icon={Phone}
                label="Dialer"
                color="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                onClick={() => window.location.href = `tel:${lead.phone}`}
                sublabel="Mobile"
              />
              <CommunicationButton
                icon={MessageCircle}
                label="SMS"
                color="bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                onClick={() => toast.success('SMS interface opening...')}
                sublabel="Local Gateway"
              />
              <CommunicationButton
                icon={Mail}
                label="Email"
                color="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                onClick={() => window.location.href = `mailto:${lead.email}`}
                sublabel="RealNext Mail"
              />
            </div>
          </div>

          {/* Key Contact Information */}
          <div className="bg-[#161B22]/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Contact Breakdown</h4>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Full Name</p>
                  <p className="text-sm font-bold text-white">{lead.name || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Primary Phone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 w-full"
                      placeholder="Phone Number"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white">{lead.phone || 'No phone'}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 w-full"
                      placeholder="Email Address"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{lead.email || 'No email'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Assignment & Management */}
          <div className="bg-[#161B22]/40 border border-white/5 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Management Matrix</h4>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stage & Status</p>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <select
                          value={editForm.stage}
                          onChange={(e) => setEditForm({ ...editForm, stage: e.target.value, status: stageStatusMapping[e.target.value][0] })}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                        >
                          {Object.keys(stageStatusMapping).map(stage => (
                            <option key={stage} value={stage} className="bg-[#161B22]">{stage}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                        >
                          {(stageStatusMapping[editForm.stage] || stageStatusMapping['Screening']).map(status => (
                            <option key={status} value={status} className="bg-[#161B22]">{status}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-white">{lead.stage} - <span className="opacity-50">{lead.status}</span></p>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-fit px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ownership</p>
                    <p className="text-sm font-black text-white">{lead.assigned_to?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <button
                  onClick={() => onAssign(lead)}
                  className="w-fit px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col h-[450px] sm:h-[600px]">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Live Pulse</span> Timeline
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 lowercase text-[8px] font-bold">Live Sync</span>
            </h4>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {lead.activity_logs && lead.activity_logs.length > 0 ? (
                lead.activity_logs.slice().reverse().map((log, index) => (
                  <div key={index} className="relative pl-8 group">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-white/5 group-hover:bg-indigo-500/20 transition-colors" />
                    <div className={`absolute left-0 top-0 h-6 w-6 rounded-lg bg-[#0E1117] border-2 flex items-center justify-center z-10 ${log.type === 'note' ? 'border-indigo-500/30 text-indigo-400' :
                      log.type === 'status_change' ? 'border-emerald-500/30 text-emerald-400' :
                        'border-gray-700 text-gray-500'
                      }`}>
                      {log.type === 'note' ? <Pencil className="h-2.5 w-2.5" /> :
                        log.type === 'status_change' ? <TrendingUp className="h-2.5 w-2.5" /> :
                          <User className="h-2.5 w-2.5" />}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.user_id?.name || 'System'}</span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium bg-white/[0.01] p-2 rounded-lg border border-white/5">
                        {log.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Activity className="h-10 w-10 mb-2" />
                  <p className="text-[10px] uppercase font-black tracking-widest">No activity logs recorded</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Drop a quick note or internal log..."
                  className="w-full bg-[#161B22] border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      try {
                        const content = e.target.value;
                        e.target.value = '';
                        await leadsAPI.addNote(lead.id, content);
                        toast.success('Note added to timeline');
                        const res = await leadsAPI.getLead(lead.id);
                        if (res.data?.success) setSelectedLead(res.data.data);
                      } catch (err) {
                        toast.error('Sync failure');
                      }
                    }
                  }}
                />
                <button className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/40">
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

  const [selectedLead, setSelectedLead] = useState(null);
  const [isSelectionLoading, setIsSelectionLoading] = useState(false);
  const [mobileSubView, setMobileSubView] = useState('list'); // 'list' or 'detail'
  // Dynamic Filter Options
  const [filterOptions, setFilterOptions] = useState({
    form_names: [],
    campaign_names: [],
    sources: [],
    stages: [],
    statuses: [],
    assigned_users: [],
    budget_range: { min: 0, max: 0 },
    ai_score_range: { min: 0, max: 100 }
  });

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

  // Fetch Filters when Advanced Menu is opened
  useEffect(() => {
    if (showAdvancedFilters) {
      fetchFilters();
    }
  }, [showAdvancedFilters]);

  const fetchFilters = async () => {
    try {
      const res = await leadsAPI.getFilters();
      if (res.data?.success) {
        setFilterOptions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch filters", err);
    }
  };

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
      const leadsArray = data.data || [];
      setLeads(leadsArray);

      // Auto-select first lead on first load if none selected
      if (leadsArray.length > 0 && !selectedLead && currentPage === 1) {
        handleLeadSelection(leadsArray[0]);
      }

      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleLeadSelection = async (lead) => {
    if (!lead) return;
    setIsSelectionLoading(true);
    setSelectedLead(lead);
    setMobileSubView('detail'); // Switch to detail view on mobile
    try {
      // Fetch full details for the selected lead to ensure timeline and notes are fresh
      const res = await leadsAPI.getLead(lead.id || lead._id);
      if (res.data?.success) {
        setSelectedLead(res.data.data);
      }
    } catch (err) {
      console.error("Failed to sync selection", err);
    } finally {
      setIsSelectionLoading(false);
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
      const res = await leadsAPI.assignLead(leadId, { user_id: userId });
      if (res.data?.success) {
        const updatedLead = res.data.data;
        toast.success(userId ? "Lead assigned successfully" : "Lead unassigned");
        setIsAssignModalOpen(false);
        // Silent local update
        setSelectedLead(updatedLead);
        setLeads(prev => prev.map(l => (l.id === leadId || l._id === leadId) ? updatedLead : l));
      }
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


  return (
    <Layout>
      <div className="min-h-screen bg-[#0E1117] p-6 md:p-10 space-y-10 w-full mx-auto pb-24">

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
              <div className="px-3 py-1 bg-indigo-500/10 border border-white/5 rounded-full">
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
              className="bg-[#FF7A19] hover:bg-[#FF8B33] text-white shadow-2xl shadow-orange-900/20 h-14 px-8 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-sm border-0"
            >
              <Plus className="w-5 h-5 mr-3" /> Create Lead
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="bg-transparent border border-white/10 hover:bg-white/5 text-white h-14 px-8 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-sm"
            >
              <Zap className="w-5 h-5 mr-3 text-white/40" /> Import
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          <StatsCard title="Pipeline" value={stats.total} icon={Zap} colorClass="text-indigo-400" bgClass="bg-indigo-400" delay={0.1} />
          <StatsCard title="Screening" value={stats.screening} icon={Users} colorClass="text-blue-400" bgClass="bg-blue-400" delay={0.2} />
          <StatsCard title="Sourcing" value={stats.sourcing} icon={Search} colorClass="text-yellow-400" bgClass="bg-yellow-400" delay={0.3} />
          <StatsCard title="Walk-in" value={stats.walkin} icon={MapPin} colorClass="text-pink-400" bgClass="bg-pink-400" delay={0.4} />
          <StatsCard title="Closure" value={stats.closure} icon={CheckCircle2} colorClass="text-emerald-400" bgClass="bg-emerald-400" delay={0.5} />
        </div>

        {/* Management Toolbar */}
        <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex flex-col xl:flex-row justify-between items-center gap-4 sm:gap-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full xl:w-auto">
            {/* Stage Filter */}
            <div className="flex w-full sm:w-auto bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5">
              <span className="px-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">Stage:</span>
              <select
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setStatusFilter('all'); setCurrentPage(1); }}
                className="bg-transparent text-gray-300 text-xs font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer flex-1 sm:flex-none"
              >
                <option value="all">All Stages</option>
                {Object.keys(stageStatusMapping).map(stage => (
                  <option key={stage} value={stage} className="bg-[#161B22]">{stage}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex w-full sm:w-auto bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5">
              <span className="px-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-gray-300 text-xs font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer flex-1 sm:flex-none"
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

          {/* Search Center */}
          <div className="flex-1 max-w-full xl:max-w-xl w-full relative group order-last xl:order-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#0E1117]/80 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between xl:justify-end gap-3 w-full xl:w-auto">
            {/* View Toggle */}
            <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchLeads(false);
                  fetchStats();
                  toast.success('Matrix Refreshed');
                }}
                className="p-3 rounded-2xl bg-[#0E1117]/80 border border-white/5 text-gray-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Button
                onClick={() => setShowAdvancedFilters(true)}
                variant="outline"
                className="bg-[#0E1117]/80 border-white/5 hover:border-indigo-500/30 text-gray-400 hover:text-white rounded-2xl h-12 px-4 sm:px-6 font-black uppercase tracking-widest text-[9px] sm:text-[10px]"
              >
                <Filter className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Advanced</span>
              </Button>
            </div>
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

                    {/* Stage Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Stage</label>
                      <select
                        value={stageFilter}
                        onChange={(e) => {
                          setStageFilter(e.target.value);
                          setStatusFilter('all');
                          setCurrentPage(1);
                        }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      >
                        <option value="all">All Stages</option>
                        {Object.keys(stageStatusMapping).map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>

                    {/* Form Name Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Form Name</label>
                      <select
                        value={formNameFilter}
                        onChange={(e) => { setFormNameFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      >
                        <option value="all">All Forms</option>
                        {filterOptions.form_names.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campaign Filter */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Campaign</label>
                      <select
                        value={campaignFilter}
                        onChange={(e) => { setCampaignFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#0E1117]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      >
                        <option value="all">All Campaigns</option>
                        {filterOptions.campaign_names.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
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
                        {filterOptions.assigned_users.length > 0 ? (
                          filterOptions.assigned_users.map(user => (
                            <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                          ))
                        ) : (
                          teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))
                        )}
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
                    <div className="flex flex-col xl:flex-row gap-8 min-h-[600px] xl:h-[800px]">
                      {/* Left Panel: Compact List */}
                      <div className={`w-full xl:w-[380px] flex flex-col h-full bg-[#161B22]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 shadow-2xl ${mobileSubView === 'detail' ? 'hidden xl:flex' : 'flex'}`}>
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Master Index</h4>
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            {leads.length} Records
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1 max-h-[500px] xl:max-h-none">
                          {leads.map((lead) => (
                            <LeadListItem
                              key={lead.id}
                              lead={lead}
                              isSelected={selectedLead?.id === lead.id}
                              onClick={() => handleLeadSelection(lead)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right Panel: Enhanced Detail Visualization */}
                      <div className={`flex-1 bg-[#161B22]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden ${mobileSubView === 'list' ? 'hidden xl:block' : 'block'}`}>
                        {/* Mobile Back Button */}
                        <div className="xl:hidden mb-6">
                          <button
                            onClick={() => setMobileSubView('list')}
                            className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-300 transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Index
                          </button>
                        </div>

                        {/* Background Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full -mr-48 -mt-48 z-0" />

                        <div className="relative z-10 h-full">
                          {isSelectionLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-indigo-500/30 py-20">
                              <div className="w-10 h-10 border-2 border-indigo-500/10 border-t-indigo-500/50 rounded-full animate-spin mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-widest">Syncing Matrix...</p>
                            </div>
                          ) : (
                            <LeadDetailPane
                              lead={selectedLead}
                              canEdit={canEditLead(selectedLead)}
                              onEdit={(l) => router.push(`/lms/leads/${l.id}/edit`)}
                              onStatusChange={handleStatusChange}
                              onAssign={handleAssignClick}
                              teamMembers={teamMembers}
                              onUpdate={(updatedLead) => {
                                setSelectedLead(updatedLead);
                                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                              }}
                            />
                          )}
                        </div>
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
                          onView={() => {
                            setSelectedLead(lead);
                            setViewMode('table');
                            handleLeadSelection(lead);
                          }}
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
