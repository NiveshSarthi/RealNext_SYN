import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI, teamAPI, followupsAPI } from '../../../utils/api';
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
  UserCheck,
  Building2,
  Check,
  Loader2,
  BellRing,
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

// Modal Component for Schedule Follow-Up
const ScheduleFollowUpModal = ({ isOpen, onClose, onSchedule, lead }) => {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [form, setForm] = useState({
    follow_up_date: today,
    follow_up_time: nowTime,
    notes: '',
    reminder_minutes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ follow_up_date: today, follow_up_time: nowTime, notes: '', reminder_minutes: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const reminderOptions = [
    { label: 'No reminder', value: '' },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
  ];

  const handleSubmit = async () => {
    if (!form.follow_up_date || !form.follow_up_time) {
      toast.error('Please select a date and time');
      return;
    }
    setLoading(true);
    try {
      await onSchedule(lead, form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <BellRing className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-base tracking-tight">Schedule Follow-Up</h2>
              <p className="text-gray-400 text-xs mt-0.5">For: <span className="text-white font-semibold">{lead?.name || lead?.phone}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
            <input
              type="date"
              value={form.follow_up_date}
              min={today}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          {/* Time */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Time</label>
            <input
              type="time"
              value={form.follow_up_time}
              onChange={e => setForm(f => ({ ...f, follow_up_time: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>
          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes / Comments</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Add any follow-up context..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
            />
          </div>
          {/* Reminder */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reminder (optional)</label>
            <select
              value={form.reminder_minutes}
              onChange={e => setForm(f => ({ ...f, reminder_minutes: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            >
              {reminderOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#0D1117]">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
            {loading ? 'Scheduling...' : 'Schedule Follow-Up'}
          </button>
        </div>
      </div>
    </div>
  );
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
    className="bg-[#161B22]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col justify-between h-20 sm:h-24 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl"
  >
    <div className={`absolute -top-2 -right-2 p-2 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity ${colorClass}`}>
      <Icon className="h-12 w-12 sm:h-16 sm:w-16" />
    </div>
    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center ${bgClass} ${colorClass} bg-opacity-10 mb-1 sm:mb-2 border border-white/5`}>
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </div>
    <div>
      <p className="text-gray-500 text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">{value}</h3>
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
    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all active:scale-95 group relative overflow-hidden shadow-lg hover:shadow-xl ${color}`}
  >
    <div className="relative z-10 flex flex-col items-center w-full">
      <div className="p-2 sm:p-3 rounded-xl bg-white/5 mb-2 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-center leading-none">{label}</span>
      {sublabel && <span className="text-[7px] sm:text-[8px] opacity-50 mt-1 hidden sm:inline font-bold uppercase tracking-tighter">{sublabel}</span>}
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const LeadListItem = ({ lead, isSelected, onClick }) => {
  const score = lead.ai_score || lead.lead_score || 0;

  // Refined Color Palette for Professional Feel
  const scoreStyles = score > 80
    ? { text: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-500/20' }
    : score > 50
      ? { text: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-500/20' }
      : { text: 'text-rose-400', bg: 'bg-rose-400/5', border: 'border-rose-500/20' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group relative flex flex-col lg:flex-row lg:items-center p-4 lg:p-5 rounded-2xl border transition-all cursor-pointer select-none ${isSelected
        ? 'bg-[#1C2128] border-indigo-500/50 shadow-lg shadow-black/20'
        : 'bg-transparent border-transparent hover:bg-[#161B22] hover:border-white/10 hover:shadow-xl'
        }`}
    >
      {/* Contact Col (30%) */}
      <div className="lg:w-[30%] flex items-center gap-4 mb-3 lg:mb-0">
        {/* Active Indicator Bar */}
        {isSelected && (
          <motion.div
            layoutId="active-bar"
            className="absolute left-0 top-2 bottom-2 w-1.5 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          />
        )}

        {/* Compact Avatar */}
        <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-transform duration-300 ${isSelected ? 'bg-indigo-500/20 text-indigo-400 scale-105' : 'bg-[#0D1117] text-gray-500 border border-white/5 group-hover:border-white/10'
          }`}>
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
          {/* Connection Status Dot */}
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px] border-[#0D1117] bg-emerald-500" />
        </div>

        {/* Name/Phone */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-[15px] font-black truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'
            }`}>
            {lead.name || 'Anonymous Lead'}
          </h4>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">
            {lead.phone || 'No Phone Sync'}
          </p>
        </div>
      </div>

      {/* Stage Col (20%) */}
      <div className="lg:w-[20%] flex flex-col mb-3 lg:mb-0 lg:px-4">
        <span className="lg:hidden text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Stage</span>
        <span className="text-[13px] text-white font-bold uppercase tracking-wider">{lead.stage || 'Sourcing'}</span>
      </div>

      {/* Status Col (20%) */}
      <div className="lg:w-[20%] flex flex-col mb-3 lg:mb-0 lg:px-4">
        <span className="lg:hidden text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</span>
        <span className="text-[13px] text-gray-400 font-bold uppercase tracking-widest">{lead.status || 'Uncontacted'}</span>
      </div>

      {/* Array Score Col (20%) */}
      <div className="lg:w-[20%] flex flex-col mb-3 lg:mb-0 lg:px-4">
        <span className="lg:hidden text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Score</span>
        <div className="flex items-center">
          <div className={`px-2.5 py-1 rounded-md border text-[11px] font-black tracking-widest ${scoreStyles.bg} ${scoreStyles.text} ${scoreStyles.border}`}>
            {score}
          </div>
        </div>
      </div>

      {/* Action Col (10%) */}
      <div className="lg:w-[10%] flex justify-end items-center mt-2 lg:mt-0">
        <div className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400'}`}>
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

const LeadDetailPane = ({ lead, onEdit, onStatusChange, teamMembers, onAssign, onScheduleFollowUp, canEdit, onUpdate }) => {
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
    stage: '',
    form_name: '',
    campaign_name: ''
  });
  const [noteContent, setNoteContent] = useState('');

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const content = noteContent;
      setNoteContent('');
      await leadsAPI.addNote(lead.id, content);
      toast.success('Sync Successful');
      const res = await leadsAPI.getLead(lead.id);
      if (res.data?.success && onUpdate) {
        onUpdate(res.data.data);
      }
    } catch (err) {
      toast.error('Sync Interrupted');
      console.error(err);
    }
  };

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
        stage: lead.stage || 'Screening',
        form_name: lead.form_name || '',
        campaign_name: lead.campaign_name || ''
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
      <div className="flex flex-col gap-6 mb-8 pb-8 border-b border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Back to Index Toggle */}
            {onUpdate && (
              <Button
                variant="ghost"
                onClick={() => onUpdate({ isListCollapsed: false })}
                className="h-10 w-10 p-0 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all group/back"
                title="Back to Master Index"
              >
                <ChevronLeft className="h-5 w-5 group-hover/back:-translate-x-0.5 transition-transform" />
              </Button>
            )}

            {/* Professional Avatar */}
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#1C2128] to-[#0D1117] border border-white/10 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-xl relative overflow-hidden group/detail-avatar transition-all hover:scale-105">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/detail-avatar:opacity-100 transition-opacity" />
              {lead.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-1 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-full sm:w-auto transition-all"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{lead.name || 'Anonymous Lead'}</h2>
                )}

                <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm ${score > 80 ? 'bg-emerald-400/5 border-emerald-500/20 text-emerald-400' :
                  score > 50 ? 'bg-amber-400/5 border-amber-500/20 text-amber-400' :
                    'bg-rose-400/5 border-rose-500/20 text-rose-400'
                  }`}>
                  <Sparkles className="h-3 w-3 opacity-50" />
                  Score: {score}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 hover:border-white/10 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400/70" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="bg-transparent border-0 p-0 text-[11px] font-medium text-white outline-none focus:ring-0 w-[140px]"
                    />
                  ) : (
                    lead.location || 'No Location Set'
                  )}
                </span>

                <div className="w-px h-3 bg-white/10" />

                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 transition-all hover:brightness-110 ${statusColors[lead.status] || 'bg-gray-500/10 text-gray-400 border-white/5'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  {lead.status}
                </span>

                <div className="w-px h-3 bg-white/10" />

                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 flex items-center gap-2">
                  {lead.source?.includes('Facebook') ? <Facebook className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {lead.source || 'Direct Source'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 bg-[#161B22] p-1.5 rounded-xl border border-white/5 shadow-inner">
            {canEdit && (
              <>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      className="h-10 text-[11px] font-bold uppercase tracking-widest px-4 hover:bg-white/5 text-gray-400 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5 mr-2" /> Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-widest px-6 rounded-lg shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-2" />}
                      Sync Matrix
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    className="h-10 text-[11px] font-bold uppercase tracking-widest px-4 hover:bg-indigo-500/10 hover:text-indigo-400 text-gray-300 rounded-lg group/edit"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2 opacity-50 text-indigo-400 group-hover/edit:scale-110 transition-transform" /> Edit Record
                  </Button>
                )}
              </>
            )}

            <div className="w-px h-6 bg-white/5 mx-1" />

            <Button
              onClick={() => onScheduleFollowUp && onScheduleFollowUp(lead)}
              className="h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-[11px] font-bold uppercase tracking-widest px-6 rounded-lg shadow-xl shadow-violet-500/10 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <BellRing className="h-3.5 w-3.5" /> Schedule Follow-Up
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="space-y-6">
          {/* Real Estate Property Requirements */}
          <div className="bg-[#0D1117] border border-white/10 rounded-3xl p-6 relative overflow-hidden group/card transition-all hover:bg-[#0D1117]/80">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover/card:scale-110 transition-transform duration-500">
              <Building2 className="h-32 w-32" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              Property Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-6 relative z-10">
              <div className="space-y-1.5 min-w-0">
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
                  <p className="text-sm font-bold text-white leading-tight break-words">
                    {lead.location || 'Location Not Identified'} <br /><span className="text-indigo-400/80">{lead.property_type || lead.custom_fields?.p_type || 'Residential'}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:text-right min-w-0">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Budget Range</p>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-1">
                    <input
                      type="number"
                      value={editForm.budget_min}
                      onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500/50 w-full sm:w-28 sm:text-right"
                      placeholder="Min"
                    />
                    <span className="text-gray-600 self-center hidden sm:inline">-</span>
                    <input
                      type="number"
                      value={editForm.budget_max}
                      onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500/50 w-full sm:w-28 sm:text-right"
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight">
                    ₹{lead.budget_min?.toLocaleString() || '0'} - ₹{lead.budget_max?.toLocaleString() || 'Ask'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Inquiry Source</p>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{lead.source || 'Direct Channel'}</span>
                  </div>
                  {lead.form_name && (
                    <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-2 py-1 w-fit max-w-full">
                      <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest truncate" title={lead.form_name}>
                        {lead.form_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 sm:text-right min-w-0">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Priority Rating</p>
                <div className="flex items-center sm:justify-end gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${score > 70 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-orange-900/10' : 'bg-white/5 border-white/10 text-gray-500'
                    }`}>
                    {score > 70 ? '🔥 High Intent' : '⚡ Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Communication Dashboard */}
          <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 shadow-sm hover:border-white/10 transition-colors relative overflow-hidden group/comm">
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl group-hover/comm:bg-indigo-500/10 transition-all duration-700" />

            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2 relative z-10">
              <PhoneCall className="h-3.5 w-3.5 text-indigo-400/80" />
              Unified Communications Hub
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
              {[
                { icon: MessageSquare, label: 'WhatsApp', sub: 'API Sync', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', action: () => window.open(`https://wa.me/${lead.phone}`, '_blank') },
                { icon: Phone, label: 'Direct Call', sub: 'CRM Dialer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', action: () => window.location.href = `tel:${lead.phone}` },
                { icon: MessageCircle, label: 'Broadcast', sub: 'SMS Matrix', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', action: () => toast.success('SMS Bridge Opening...') },
                { icon: Mail, label: 'Enterprise', sub: 'SMTP Link', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', action: () => window.location.href = `mailto:${lead.email}` },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all active:scale-95 group/btn relative overflow-hidden shadow-sm hover:shadow-md ${btn.color}`}
                >
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="p-2 rounded-lg bg-black/10 mb-2 group-hover/btn:scale-110 transition-transform duration-300">
                      <btn.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-none">{btn.label}</span>
                    <span className="text-[8px] opacity-40 mt-1 font-bold uppercase tracking-tighter whitespace-nowrap">{btn.sub}</span>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Key Contact Information */}
          <div className="bg-[#161B22]/40 border border-white/10 rounded-3xl p-6 space-y-4 shadow-sm hover:bg-[#161B22]/50 transition-colors">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              Contact Breakdown
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group/row hover:border-white/10 transition-all overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover/row:text-indigo-400 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Lead Identity</p>
                    <p className="text-sm font-bold text-white truncate">{lead.name || 'Anonymous'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group/row hover:border-white/10 transition-all overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover/row:text-indigo-400 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Active Phone</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 w-full"
                        placeholder="Phone..."
                      />
                    ) : (
                      <p className="text-sm font-bold text-white truncate">{lead.phone || 'No Phone Registered'}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group/row hover:border-white/10 transition-all overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover/row:text-indigo-400 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Email Sync</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 w-full"
                        placeholder="Email..."
                      />
                    ) : (
                      <p className="text-sm font-bold text-white truncate">{lead.email || 'No Email Registered'}</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Form Info Section */}
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5 group/row hover:border-white/10 transition-all overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Marketing Attribution</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="text"
                          value={editForm.form_name}
                          onChange={(e) => setEditForm({ ...editForm, form_name: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500/50 w-full"
                          placeholder="Form Name"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-bold text-indigo-300 truncate" title={lead.form_name}>{lead.form_name || 'Direct Organic'}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter truncate">{lead.campaign_name || 'General Campaign'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Professional Property Analysis */}
          <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 shadow-sm hover:border-white/10 transition-colors group/analysis">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-indigo-400/80" />
              Strategic Portfolio Analysis
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 opacity-40" /> Asset Location
                  </p>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    {lead.location_interest || 'Location Not Identified'}
                  </p>
                </div>

                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3 w-3 opacity-40" /> Configuration Sync
                  </p>
                  <p className="text-xs font-bold text-white">
                    {lead.configuration_interest || 'Awaiting Property Coordinates'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center bg-indigo-500/5 rounded-xl border border-indigo-500/10 p-4 border-dashed relative overflow-hidden group/budget">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/budget:scale-110 transition-transform duration-700">
                  <TrendingUp className="h-24 w-24 text-indigo-400" />
                </div>
                <div className="relative z-10 text-center">
                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-[0.25em] mb-2 font-mono">Current Budget Matrix</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-medium text-indigo-300 opacity-60">₹</span>
                    <span className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                      {lead.budget_range || '0.00'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Market Alignment: High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Management Matrix */}
          <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 shadow-sm hover:border-white/10 transition-colors group/matrix">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-5 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-indigo-400/80" />
              Operational Lifecycle Matrix
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col p-5 bg-black/20 rounded-xl border border-white/5 shadow-inner group/row hover:bg-black/30 transition-all gap-5 justify-between h-full">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-[#0D1117] border border-white/5 flex items-center justify-center text-amber-400/70 group-hover/row:scale-105 transition-transform mt-0.5">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mb-2 font-mono truncate">Stage & Health</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <select
                          value={editForm.stage}
                          onChange={(e) => {
                            const newStage = e.target.value;
                            setEditForm({ ...editForm, stage: newStage, status: stageStatusMapping[newStage][0] });
                          }}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          {Object.keys(stageStatusMapping).map(stg => (
                            <option key={stg} value={stg} className="bg-[#0D1117]">{stg}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-amber-400 focus:outline-none focus:border-indigo-500/50"
                        >
                          {(stageStatusMapping[editForm.stage || 'Screening'] || []).map(stt => (
                            <option key={stt} value={stt} className="bg-[#0D1117]">{stt}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[14px] font-black text-white tracking-tight truncate">{lead.stage || 'Discovery'}</span>
                        <span className="text-[10px] text-gray-600 font-black px-1.5 py-0.5 bg-white/5 rounded shrink-0">/</span>
                        <span className="text-[14px] font-bold text-amber-400/90 tracking-tight truncate">{lead.status}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  className="h-10 w-full text-[10px] font-black uppercase tracking-[0.2em] bg-[#0D1117]/80 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all"
                >
                  Change Status
                </Button>
              </div>

              <div className="flex flex-col p-5 bg-black/20 rounded-xl border border-white/5 shadow-inner group/row hover:bg-black/30 transition-all gap-5 justify-between h-full">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-[#0D1117] border border-white/5 flex items-center justify-center text-indigo-400/70 group-hover/row:scale-105 transition-transform mt-0.5">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mb-2 font-mono truncate">Owner Assignment</p>
                    <p className="text-[14px] font-black text-white tracking-tight truncate mt-1">
                      {lead.assigned_to?.name || 'Unassigned Node'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onAssign(lead)}
                  variant="ghost"
                  className="h-10 w-full text-[10px] font-black uppercase tracking-[0.2em] bg-[#0D1117]/80 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {lead.assigned_to ? 'Reassign Owner' : 'Assign Owner'}
                </Button>
              </div>
            </div>
          </div>
          {/* Professional Activity Sync */}
          <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 sm:p-6 flex flex-col h-[650px] shadow-sm relative overflow-hidden group/sync">
            <div className="absolute top-0 right-0 p-12 opacity-[0.015] -rotate-12 pointer-events-none group-hover/sync:opacity-[0.03] transition-opacity duration-1000">
              <Activity className="h-56 w-56 text-indigo-400" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-[pulse_2s_infinite] shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                Operational Activity Stream
              </h4>
              <span className="bg-[#161B22] text-indigo-400/80 px-2.5 py-1 rounded-md border border-white/5 text-[8px] font-bold uppercase tracking-widest shadow-inner">
                Real-Time Access
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6 relative z-10">
              {lead.activity_logs && lead.activity_logs.length > 0 ? (
                lead.activity_logs.slice().reverse().map((log, index) => (
                  <div key={index} className="relative pl-10 group/log">
                    <div className="absolute left-[13px] top-0 bottom-0 w-px bg-white/5 group-hover/log:bg-indigo-500/20 transition-all duration-500" />
                    <div className={`absolute left-0 top-0 h-[26px] w-[26px] rounded-lg bg-[#0D1117] border flex items-center justify-center z-10 shadow-lg transition-all duration-300 group-hover/log:scale-105 ${log.type === 'note' ? 'border-indigo-500/30 text-indigo-400' :
                      log.type === 'status_change' ? 'border-emerald-500/30 text-emerald-400' :
                        'border-white/10 text-gray-600'
                      }`}>
                      {log.type === 'note' ? <Pencil className="h-3 w-3" /> :
                        log.type === 'status_change' ? <TrendingUp className="h-3 w-3" /> :
                          <User className="h-3 w-3" />}
                    </div>
                    <div className="bg-[#161B22]/40 border border-white/5 rounded-lg p-4 group-hover/log:bg-[#161B22]/60 group-hover/log:border-white/10 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                          {log.user_id?.name || 'Network Node'}
                        </span>
                        <span className="text-[9px] text-gray-600 font-medium uppercase font-mono">
                          {format(new Date(log.created_at), 'MMM dd | HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                        {log.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Activity className="h-14 w-14 mb-4" />
                  <p className="text-[10px] uppercase font-bold tracking-[0.4em] font-mono">Matrix Offline</p>
                </div>
              )}
            </div>

            <div className="mt-8 relative z-10">
              <div className="relative group/input">
                <input
                  type="text"
                  placeholder="Record sync coordinate or internal log entry..."
                  className="w-full bg-[#161B22] border border-white/10 rounded-xl pl-5 pr-14 py-4 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/40 focus:bg-[#1C2128] transition-all shadow-inner"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote();
                    }
                  }}
                />
                <button
                  onClick={handleAddNote}
                  className="absolute right-2 top-2 h-10 w-10 bg-indigo-600/90 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center active:scale-90 group-hover/input:scale-105"
                >
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

  // Follow-Up Scheduling State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);

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
  const [isListCollapsed, setIsListCollapsed] = useState(false);
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
        onSelectLead(leadsArray[0]);
      }

      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const onSelectLead = async (lead) => {
    if (!lead) {
      setSelectedLead(null);
      setIsListCollapsed(false);
      return;
    }

    setIsSelectionLoading(true);
    setSelectedLead(lead);
    setIsListCollapsed(true); // Automatically collapse for immersive view
    setMobileSubView('detail');

    try {
      const res = await leadsAPI.getLead(lead.id);
      if (res.data?.success) {
        setSelectedLead(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch lead details", err);
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

  const handleScheduleFollowUpClick = (lead) => {
    setSelectedLeadForFollowUp(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleScheduleFollowUpSubmit = async (lead, form) => {
    try {
      const payload = {
        lead_id: lead.id || lead._id,
        follow_up_date: form.follow_up_date,
        follow_up_time: form.follow_up_time,
        notes: form.notes || '',
        reminder_minutes: form.reminder_minutes ? parseInt(form.reminder_minutes) : null,
      };
      const res = await followupsAPI.createFollowUp(payload);
      if (res.data?.success) {
        toast.success('Follow-up scheduled!');
        setIsFollowUpModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to schedule follow-up');
      console.error(error);
      throw error; // re-throw so modal knows it failed
    }
  };

  const handleAssignSubmit = async (leadId, userId) => {
    try {
      const res = await leadsAPI.assignLead(leadId, { user_id: userId });
      if (res.data?.success) {
        const updatedLead = res.data.data;
        toast.success(userId ? "Lead assigned successfully" : "Lead unassigned");
        setIsAssignModalOpen(false);
        // Silent local update — use the full object from response to get activity logs
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

      const res = await leadsAPI.updateLead(lead.id, updateData);
      toast.success(`Updated to ${newStage || lead.stage} - ${newStatus}`);
      // Real-time local update — use the full object from response to get activity logs
      const updatedLead = res.data?.data || { ...lead, ...updateData };
      setSelectedLead(prev => prev?.id === lead.id ? updatedLead : prev);
      setLeads(prev => prev.map(l => (l.id === lead.id || l._id === lead._id) ? updatedLead : l));
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
      form_name: lead.form_name || '',
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
      const res = await leadsAPI.updateLead(selectedLeadForUpdate.id, quickUpdateForm);
      toast.success('Lead updated successfully');
      const updatedLead = res.data?.data || { ...selectedLeadForUpdate, ...quickUpdateForm };
      // Real-time local update — use the full object from response to get activity logs
      setSelectedLead(prev => prev?.id === selectedLeadForUpdate.id ? updatedLead : prev);
      setLeads(prev => prev.map(l => (l.id === selectedLeadForUpdate.id || l._id === selectedLeadForUpdate._id) ? updatedLead : l));
      setIsUpdateModalOpen(false);
      setSelectedLeadForUpdate(null);
    } catch (error) {
      toast.error('Failed to update lead');
      console.error(error);
    }
  };


  return (
    <Layout>
      <div className="min-h-screen bg-[#0E1117] p-4 md:p-6 space-y-6 w-full mx-auto pb-24">

        <AssignModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignSubmit}
          lead={selectedLeadForAssign}
          members={teamMembers}
        />

        <ScheduleFollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          onSchedule={handleScheduleFollowUpSubmit}
          lead={selectedLeadForFollowUp}
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-0.5 bg-indigo-500/10 border border-white/5 rounded-full">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">Database Engine</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                Live Sync Active
              </div>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Lead Center
                <Sparkles className="w-5 h-5 text-yellow-400/80 animate-pulse hidden md:block" />
              </h1>
            </div>
            <p className="text-gray-500 text-xs max-w-lg font-medium">
              Real-time monitoring and lifecycle management for your cross-channel leads.
            </p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <Button
              onClick={() => router.push('/lms/leads/new')}
              className="bg-[#FF7A19] hover:bg-[#FF8B33] text-white shadow-xl shadow-orange-900/20 h-10 px-6 font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all text-[11px] border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Lead
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="bg-transparent border border-white/10 hover:bg-white/5 text-white h-10 px-6 font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all text-[11px]"
            >
              <Zap className="w-4 h-4 mr-2 text-white/40" /> Import
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
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                {leads.length > 0 ? (
                  viewMode === 'table' ? (
                    <div className="relative min-h-[800px]">
                      <AnimatePresence mode="wait">
                        {!isListCollapsed ? (
                          <motion.div
                            key="master-index"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col gap-6"
                          >
                            <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-2xl relative group/index min-h-[600px]">
                              <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-500 pointer-events-none group-hover/index:scale-110 transition-transform duration-1000">
                                <LayoutGrid className="h-40 w-40" />
                              </div>

                              <div className="flex items-center justify-between mb-8 relative z-10 px-2 lg:px-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  Master Index
                                </h3>
                                <div className="px-5 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                  <span className="text-xs font-black text-indigo-400">{leads.length} Records</span>
                                </div>
                              </div>

                              <div className="overflow-x-auto lg:overflow-visible focus:outline-none">
                                {/* Table Header Row */}
                                <div className="hidden lg:flex items-center px-6 py-4 mb-4 rounded-xl bg-[#0D1117]/80 border border-white/5 shadow-inner min-w-[800px]">
                                  <div className="w-[30%] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pl-4">Contact Profile</div>
                                  <div className="w-[20%] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pl-4">Lifecycle Stage</div>
                                  <div className="w-[20%] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pl-4">Current Status</div>
                                  <div className="w-[20%] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pl-4">AI Score</div>
                                  <div className="w-[10%] text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pr-4">Action</div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[300px] lg:min-w-[800px]">
                                  {leads.map((lead) => (
                                    <LeadListItem
                                      key={lead.id}
                                      lead={lead}
                                      isSelected={selectedLead?.id === lead.id}
                                      onClick={() => onSelectLead(lead)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="detail-pane"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full flex-1 min-w-0"
                          >
                            <div className="bg-[#161B22]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl min-h-full">
                              {isSelectionLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
                                  <div className="relative">
                                    <Loader2 className="h-16 w-16 text-indigo-500 animate-spin" />
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                                  </div>
                                  <p className="text-[12px] font-black uppercase tracking-[0.5em] text-gray-500 animate-pulse mt-4">Syncing Full Matrix...</p>
                                </div>
                              ) : (
                                <LeadDetailPane
                                  lead={selectedLead}
                                  onStatusChange={handleStatusChange}
                                  teamMembers={teamMembers}
                                  onAssign={handleAssignClick}
                                  onScheduleFollowUp={handleScheduleFollowUpClick}
                                  canEdit={selectedLead ? canEditLead(selectedLead) : false}
                                  onUpdate={(data) => {
                                    if (!data) return;

                                    // If data has an id, it's a lead update
                                    if (data.id || data._id) {
                                      const updatedLead = data;
                                      setSelectedLead(updatedLead);
                                      setLeads(prev => prev.map(l => (l.id === updatedLead.id || l._id === updatedLead._id) ? updatedLead : l));
                                    }
                                    // Handle layout/collapsed state updates
                                    else if (data.hasOwnProperty('isListCollapsed')) {
                                      setIsListCollapsed(data.isListCollapsed);
                                      if (data.isListCollapsed === false) {
                                        // Clear selection entirely when returning to master index
                                        setSelectedLead(null);
                                      }
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                            setIsListCollapsed(true);
                            onSelectLead(lead);
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
        {
          totalPages > 1 && (
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
          )
        }
      </div >
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
    </Layout >
  );
}
