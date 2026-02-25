import { useState, useEffect, useCallback } from 'react';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { followupsAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import {
    Calendar,
    List,
    BellRing,
    CheckCircle2,
    Clock,
    RefreshCw,
    Trash2,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail,
    X,
    Loader2,
    AlertTriangle,
    Check,
    RotateCcw,
} from 'lucide-react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const styles = {
        Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        Rescheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    const icons = { Pending: Clock, Completed: CheckCircle2, Rescheduled: RotateCcw };
    const Icon = icons[status] || Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.Pending}`}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
};

// ─── Edit Follow-Up Modal ─────────────────────────────────────────────────────
const EditFollowUpModal = ({ followUp, onClose, onSave }) => {
    const [form, setForm] = useState({
        follow_up_date: followUp?.follow_up_date ? format(new Date(followUp.follow_up_date), 'yyyy-MM-dd') : '',
        follow_up_time: followUp?.follow_up_time || '',
        notes: followUp?.notes || '',
        reminder_minutes: followUp?.reminder_minutes ?? '',
    });
    const [loading, setLoading] = useState(false);

    const reminderOptions = [
        { label: 'No reminder', value: '' },
        { label: '15 minutes before', value: 15 },
        { label: '30 minutes before', value: 30 },
        { label: '1 hour before', value: 60 },
        { label: '1 day before', value: 1440 },
    ];

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(followUp.id || followUp._id, {
                follow_up_date: form.follow_up_date,
                follow_up_time: form.follow_up_time,
                notes: form.notes,
                reminder_minutes: form.reminder_minutes !== '' ? parseInt(form.reminder_minutes) : null,
            });
            onClose();
        } catch {
            // error handled in parent
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
                            <Pencil className="w-4 h-4 text-violet-400" />
                        </div>
                        <h2 className="text-white font-black text-base">Edit Follow-Up</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                        <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Time</label>
                        <input type="time" value={form.follow_up_time} onChange={e => setForm(f => ({ ...f, follow_up_time: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reminder</label>
                        <select value={form.reminder_minutes} onChange={e => setForm(f => ({ ...f, reminder_minutes: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                            {reminderOptions.map(o => <option key={o.value} value={o.value} className="bg-[#0D1117]">{o.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Table View ───────────────────────────────────────────────────────────────
const TableView = ({ followUps, onEdit, onComplete, onReschedule, onDelete, loading }) => {
    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
    );
    if (followUps.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <BellRing className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-40">No follow-ups scheduled</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/5">
                        {['Lead', 'Contact', 'Date & Time', 'Notes', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-4 py-3">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {followUps.map((fu, i) => {
                            const lead = fu.lead_id;
                            const isOverdue = fu.status === 'Pending' && new Date(fu.follow_up_date) < new Date();
                            return (
                                <motion.tr
                                    key={fu._id || fu.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`border-b border-white/5 hover:bg-white/2 transition-colors group ${isOverdue ? 'bg-red-500/3' : ''}`}
                                >
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-white">{lead?.name || '—'}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${lead?.stage === 'Screening' ? 'bg-indigo-500/10 text-indigo-400' : lead?.stage === 'Sourcing' ? 'bg-purple-500/10 text-purple-400' : lead?.stage === 'Walk-in' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {lead?.stage || '—'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            {lead?.phone && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Phone className="w-3 h-3 shrink-0" />{lead.phone}</div>}
                                            {lead?.email && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Mail className="w-3 h-3 shrink-0" />{lead.email}</div>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                            <div>
                                                <p className="text-sm font-bold">{format(new Date(fu.follow_up_date), 'dd MMM yyyy')}</p>
                                                <p className="text-xs text-gray-500">{fu.follow_up_time}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-[200px]">
                                        <p className="text-xs text-gray-400 line-clamp-2">{fu.notes || <span className="italic opacity-40">No notes</span>}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={fu.status} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {fu.status !== 'Completed' && (
                                                <button onClick={() => onComplete(fu)} title="Mark Complete"
                                                    className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 transition-all">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => onEdit(fu)} title="Edit"
                                                className="p-1.5 rounded-lg hover:bg-violet-500/20 text-gray-500 hover:text-violet-400 transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {fu.status === 'Pending' && (
                                                <button onClick={() => onReschedule(fu)} title="Mark Rescheduled"
                                                    className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-all">
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => onDelete(fu)} title="Delete"
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

// ─── Calendar View ────────────────────────────────────────────────────────────
const CalendarView = ({ followUps, onEdit, onComplete, onDelete }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart); // 0=Sun

    const fuOnDay = (day) => followUps.filter(fu => isSameDay(new Date(fu.follow_up_date), day));
    const selectedDayFus = selectedDay ? fuOnDay(selectedDay) : [];

    const statusDot = { Pending: 'bg-amber-400', Completed: 'bg-emerald-400', Rescheduled: 'bg-blue-400' };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Grid */}
            <div className="flex-1">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-white font-black text-sm tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-600 py-2">{d}</div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                    {days.map(day => {
                        const fus = fuOnDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDay && isSameDay(day, selectedDay);
                        return (
                            <motion.button
                                key={day.toISOString()}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setSelectedDay(isSelected ? null : day)}
                                className={`relative min-h-[60px] rounded-xl p-1.5 text-left transition-all border ${isSelected ? 'bg-violet-500/20 border-violet-500/40' : isToday ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-white/5 hover:border-white/10 hover:bg-white/3'}`}
                            >
                                <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : isSelected ? 'text-violet-300' : 'text-gray-500'}`}>
                                    {format(day, 'd')}
                                </span>
                                {fus.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                        {fus.slice(0, 2).map(fu => (
                                            <div key={fu._id} className={`w-full h-1.5 rounded-full ${statusDot[fu.status] || 'bg-gray-400'}`} />
                                        ))}
                                        {fus.length > 2 && <span className="text-[9px] text-gray-500 font-bold">+{fus.length - 2}</span>}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4">
                    {Object.entries(statusDot).map(([s, c]) => (
                        <div key={s} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Day Panel */}
            <div className="lg:w-80 bg-black/20 border border-white/5 rounded-2xl p-4">
                {selectedDay ? (
                    <>
                        <h4 className="text-sm font-black text-white mb-3">{format(selectedDay, 'EEEE, dd MMM yyyy')}</h4>
                        {selectedDayFus.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8 italic">No follow-ups on this day</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedDayFus.map(fu => (
                                    <div key={fu._id} className="bg-white/3 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-white">{fu.lead_id?.name || '—'}</p>
                                                <p className="text-xs text-gray-500">{fu.follow_up_time}</p>
                                            </div>
                                            <StatusBadge status={fu.status} />
                                        </div>
                                        {fu.notes && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{fu.notes}</p>}
                                        <div className="flex gap-1.5">
                                            {fu.status !== 'Completed' && (
                                                <button onClick={() => onComplete(fu)}
                                                    className="flex-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider transition-all">
                                                    Complete
                                                </button>
                                            )}
                                            <button onClick={() => onEdit(fu)}
                                                className="flex-1 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider transition-all">
                                                Edit
                                            </button>
                                            <button onClick={() => onDelete(fu)}
                                                className="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-all">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                        <Calendar className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-center">Click a day to view follow-ups</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FollowUpsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rescheduled: 0, overdue: 0 });
    const [editingFollowUp, setEditingFollowUp] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) router.push('/');
        else if (user) fetchFollowUps();
    }, [user, authLoading]);

    const fetchFollowUps = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await followupsAPI.getFollowUps(params);
            if (res.data?.success) {
                setFollowUps(res.data.data);
                if (res.data.meta?.stats) setStats({ total: res.data.meta.total, ...res.data.meta.stats });
            }
        } catch (err) {
            toast.error('Failed to load follow-ups');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchFollowUps(); }, [statusFilter]);

    const handleComplete = async (fu) => {
        try {
            await followupsAPI.updateStatus(fu.id || fu._id, 'Completed');
            toast.success('Marked as completed!');
            setFollowUps(prev => prev.map(f => (f._id === fu._id || f.id === fu.id) ? { ...f, status: 'Completed' } : f));
        } catch { toast.error('Failed to update'); }
    };

    const handleReschedule = async (fu) => {
        try {
            await followupsAPI.updateStatus(fu.id || fu._id, 'Rescheduled');
            toast.success('Marked as rescheduled');
            setFollowUps(prev => prev.map(f => (f._id === fu._id || f.id === fu.id) ? { ...f, status: 'Rescheduled' } : f));
        } catch { toast.error('Failed to update'); }
    };

    const handleSaveEdit = async (id, data) => {
        try {
            const res = await followupsAPI.updateFollowUp(id, data);
            if (res.data?.success) {
                toast.success('Follow-up updated!');
                setFollowUps(prev => prev.map(f => (f._id === id || f.id === id) ? res.data.data : f));
            }
        } catch { toast.error('Failed to save'); throw new Error('save failed'); }
    };

    const handleDelete = async (fu) => {
        if (!confirm(`Delete this follow-up for "${fu.lead_id?.name}"?`)) return;
        try {
            await followupsAPI.deleteFollowUp(fu.id || fu._id);
            toast.success('Deleted');
            setFollowUps(prev => prev.filter(f => f._id !== fu._id && f.id !== fu.id));
        } catch { toast.error('Failed to delete'); }
    };

    const statCards = [
        { label: 'Total', value: stats.total, color: 'text-white', dot: 'bg-indigo-400' },
        { label: 'Pending', value: stats.pending, color: 'text-amber-400', dot: 'bg-amber-400' },
        { label: 'Completed', value: stats.completed, color: 'text-emerald-400', dot: 'bg-emerald-400' },
        { label: 'Rescheduled', value: stats.rescheduled, color: 'text-blue-400', dot: 'bg-blue-400' },
        { label: 'Overdue', value: stats.overdue, color: 'text-red-400', dot: 'bg-red-400' },
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-[#0A0D12] p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <BellRing className="w-5 h-5 text-violet-400" />
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Follow-Ups</h1>
                        </div>
                        <p className="text-gray-500 text-sm ml-11">Track and manage all scheduled follow-ups</p>
                    </div>
                    <button onClick={fetchFollowUps}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statCards.map(s => (
                        <div key={s.label} className="bg-[#161B22] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s.label}</span>
                            </div>
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Status Filter */}
                    <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5 gap-1">
                        {['all', 'Pending', 'Completed', 'Rescheduled'].map(s => (
                            <button key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-[#0E1117]/80 rounded-2xl p-1.5 border border-white/5 gap-1">
                        <button onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <List className="w-3.5 h-3.5" /> Table
                        </button>
                        <button onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <Calendar className="w-3.5 h-3.5" /> Calendar
                        </button>
                    </div>
                </div>

                {/* Main Panel */}
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#161B22] border border-white/5 rounded-2xl p-4 sm:p-6"
                >
                    {viewMode === 'table' ? (
                        <TableView
                            followUps={followUps}
                            loading={loading}
                            onEdit={setEditingFollowUp}
                            onComplete={handleComplete}
                            onReschedule={handleReschedule}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <CalendarView
                            followUps={followUps}
                            onEdit={setEditingFollowUp}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                        />
                    )}
                </motion.div>
            </div>

            {/* Edit Modal */}
            {editingFollowUp && (
                <EditFollowUpModal
                    followUp={editingFollowUp}
                    onClose={() => setEditingFollowUp(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </Layout>
    );
}
