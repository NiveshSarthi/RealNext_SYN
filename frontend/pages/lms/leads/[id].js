import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI, teamAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CurrencyRupeeIcon,
    CalendarIcon,
    UserCircleIcon,
    TagIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    PaperAirplaneIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

export default function LeadDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();
    const [lead, setLead] = useState(null);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noteContent, setNoteContent] = useState('');
    const [showQuickUpdate, setShowQuickUpdate] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [quickUpdateForm, setQuickUpdateForm] = useState({
        stage: '',
        status: '',
        assigned_to: '',
        source: '',
        form_name: '',
        campaign_name: ''
    });

    const stageStatusMapping = {
        'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead'],
        'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost'],
        'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost'],
        'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
    };

    const sourceOptions = ['manual', 'csv', 'meta', 'api', 'website', 'referral', 'facebook', 'instagram', 'import'];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && id) {
            fetchLead();
            fetchTeam();
        }
    }, [user, authLoading, id]);

    const fetchLead = async () => {
        try {
            const response = await leadsAPI.getLead(id);
            const leadData = response.data.data;
            setLead(leadData);
            setQuickUpdateForm({
                stage: leadData.stage || 'Screening',
                status: leadData.status || 'Uncontacted',
                assigned_to: leadData.assigned_to?._id || leadData.assigned_to || '',
                source: leadData.source || 'manual',
                form_name: leadData.form_name || '',
                campaign_name: leadData.campaign_name || ''
            });
        } catch (error) {
            console.error('Failed to fetch lead:', error);
            toast.error('Failed to load lead details');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const response = await teamAPI.getTeam();
            setTeam(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch team:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete the lead "${lead.name || lead.phone}"?`)) {
            return;
        }

        try {
            await leadsAPI.deleteLead(id);
            toast.success('Lead deleted successfully');
            router.push('/lms/leads');
        } catch (error) {
            console.error('Failed to delete lead:', error);
            toast.error('Failed to delete lead');
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;
        try {
            await leadsAPI.addNote(id, noteContent);
            toast.success('Note added');
            setNoteContent('');
            fetchLead();
        } catch (error) {
            console.error('Failed to add note:', error);
            toast.error('Failed to add note');
        }
    };

    const handleQuickUpdate = async () => {
        setUpdating(true);
        try {
            // If user_id is changed, use assignLead, else updateLead
            if (quickUpdateForm.assigned_to !== (lead.assigned_to?._id || lead.assigned_to)) {
                await leadsAPI.assignLead(id, { user_id: quickUpdateForm.assigned_to || null });
            }

            // Update other fields
            await leadsAPI.updateLead(id, {
                stage: quickUpdateForm.stage,
                status: quickUpdateForm.status,
                source: quickUpdateForm.source,
                form_name: quickUpdateForm.form_name,
                campaign_name: quickUpdateForm.campaign_name
            });

            toast.success('Lead updated successfully');
            setShowQuickUpdate(false);
            fetchLead();
        } catch (error) {
            console.error('Failed to update lead:', error);
            toast.error('Failed to update lead');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!lead) {
        return (
            <Layout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-white">Lead Not Found</h2>
                    <p className="mt-2 text-gray-400">The lead you are looking for does not exist or has been deleted.</p>
                    <Link href="/lms/leads" className="mt-6 inline-flex items-center text-primary hover:text-primary/80">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Leads
                    </Link>
                </div>
            </Layout>
        );
    }

    const getStatusColor = (status) => {
        const colors = {
            'Uncontacted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Not Interested': 'bg-red-500/10 text-red-400 border-red-500/20',
            'Not Responding': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            'Dead': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            'Hot': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'Warm': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            'Cold': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
        return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    const getStageColor = (stage) => {
        const colors = {
            'Screening': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'Sourcing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Walk-in': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            'Closure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        return colors[stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in content-container">
                {/* Navigation and Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push('/lms/leads')}
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => setShowQuickUpdate(true)}
                            variant="primary"
                            className="text-sm shadow-glow-sm"
                        >
                            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                            Quick Update
                        </Button>
                        <Button
                            onClick={() => router.push(`/lms/leads/${id}/edit`)}
                            variant="outline"
                            className="text-sm"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit Lead
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant="danger"
                            className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Lead Profile Header */}
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
                    <div className="px-6 py-6 border-b border-border/50 bg-[#161B22]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center">
                                <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-bold font-display">
                                    {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="ml-6">
                                    <h1 className="text-2xl font-bold font-display text-white">{lead.name || 'Anonymous Lead'}</h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageColor(lead.stage)}`}>
                                            {lead.stage?.toUpperCase() || 'SCREENING'}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                            {lead.status?.toUpperCase() || 'UNCONTACTED'}
                                        </span>
                                        <span className="text-sm text-gray-400 flex items-center">
                                            <TagIcon className="h-4 w-4 mr-1 text-gray-500" />
                                            Score: <span className="text-white ml-1 font-mono">{lead.lead_score || 0}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* New Header Info Section */}
                            <div className="flex flex-wrap gap-8 items-center bg-muted/20 p-4 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Assigned To</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <ShieldCheckIcon className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <span className="text-sm font-medium text-white">
                                            {lead.assigned_to?.name || lead.assigned_to || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-border/50 hidden md:block"></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Lead Source</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <TagIcon className="h-3.5 w-3.5 text-emerald-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white capitalize leading-tight">
                                                {lead.source || 'manual'}
                                            </span>
                                            {lead.form_name && (
                                                <span className="text-[10px] text-indigo-400 font-bold truncate max-w-[150px]">
                                                    {lead.form_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                                <UserCircleIcon className="h-5 w-5 mr-2 text-primary" />
                                Contact Details
                            </h3>
                            <dl className="space-y-4">
                                <DetailRow label="Phone" value={lead.phone} icon={PhoneIcon} />
                                <DetailRow label="Email" value={lead.email || 'Not provided'} icon={EnvelopeIcon} />
                                <DetailRow label="Location" value={lead.location || 'Not specified'} icon={MapPinIcon} />
                                <DetailRow label="Marketing Form" value={lead.form_name || 'N/A'} icon={PaperAirplaneIcon} />
                                <DetailRow label="Campaign" value={lead.campaign_name || 'N/A'} icon={TagIcon} />
                            </dl>
                        </div>

                        {/* Property Requirements */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                                <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-green-400" />
                                Requirements
                            </h3>
                            <dl className="space-y-4">
                                <DetailRow
                                    label="Budget Range"
                                    value={`₹${lead.budget_min?.toLocaleString() || '0'} - ₹${lead.budget_max?.toLocaleString() || 'Any'}`}
                                    icon={CurrencyRupeeIcon}
                                />
                                <DetailRow
                                    label="Preferred Type"
                                    value={lead.property_type || 'Any'}
                                    icon={BuildingOfficeIcon}
                                    isUppercase
                                />
                                <DetailRow
                                    label="Last Contact"
                                    value={lead.last_contact ? new Date(lead.last_contact).toLocaleString() : 'Never'}
                                    icon={CalendarIcon}
                                />
                            </dl>

                            {/* Facebook Meta Data */}
                            {lead.metadata?.facebook_form_data && lead.metadata.facebook_form_data.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-border/50">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                                        <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-400" />
                                        Facebook Form Answers
                                    </h3>
                                    <dl className="space-y-4">
                                        {lead.metadata.facebook_form_data.map((field, index) => (
                                            <DetailRow
                                                key={index}
                                                label={field.name}
                                                value={field.values ? field.values[0] : 'N/A'}
                                                icon={TagIcon}
                                            />
                                        ))}
                                    </dl>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes/Activities */}
                    <div className="px-6 py-6 border-t border-border/50">
                        <h3 className="text-lg font-semibold text-white mb-4">Notes & Activity</h3>
                        <div className="bg-[#0E1117] border border-border/50 p-6 rounded-lg space-y-6">
                            {/* Add Note Input */}
                            <div className="flex gap-4">
                                <textarea
                                    className="flex-1 bg-[#161B22] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
                                    placeholder="Add a note..."
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                />
                                <Button
                                    onClick={handleAddNote}
                                    disabled={!noteContent.trim()}
                                    className="self-end bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    Add Note
                                </Button>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-6 pt-6 border-t border-white/5">
                                {lead.activity_logs && lead.activity_logs.length > 0 ? (
                                    lead.activity_logs.slice().reverse().map((log, index) => (
                                        <div key={index} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${log.type === 'note' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                                    log.type === 'status_change' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {log.type === 'note' ? <PencilIcon className="h-4 w-4" /> :
                                                        log.type === 'status_change' ? <TagIcon className="h-4 w-4" /> :
                                                            <UserCircleIcon className="h-4 w-4" />}
                                                </div>
                                                {index !== lead.activity_logs.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-white/5 group-hover:bg-white/10 my-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-bold text-white">
                                                        {log.user_id?.name || 'System'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                    {log.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No activity logs or notes yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Update Modal */}
                {showQuickUpdate && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                            <div className="fixed inset-0 transition-opacity" onClick={() => setShowQuickUpdate(false)}>
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                            </div>

                            <div className="inline-block align-bottom bg-card border border-border/50 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="px-6 py-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">Quick Update</h3>
                                        <button onClick={() => setShowQuickUpdate(false)} className="text-gray-400 hover:text-white transition-colors">
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Stage</label>
                                                <select
                                                    value={quickUpdateForm.stage}
                                                    onChange={(e) => {
                                                        const newStage = e.target.value;
                                                        setQuickUpdateForm(prev => ({
                                                            ...prev,
                                                            stage: newStage,
                                                            status: stageStatusMapping[newStage][0]
                                                        }));
                                                    }}
                                                    className="w-full bg-[#0E1117] border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                >
                                                    {Object.keys(stageStatusMapping).map(stage => (
                                                        <option key={stage} value={stage}>{stage}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Status</label>
                                                <select
                                                    value={quickUpdateForm.status}
                                                    onChange={(e) => setQuickUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                                                    className="w-full bg-[#0E1117] border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                >
                                                    {(stageStatusMapping[quickUpdateForm.stage] || []).map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign To Team Member</label>
                                            <select
                                                value={quickUpdateForm.assigned_to}
                                                onChange={(e) => setQuickUpdateForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                                                className="w-full bg-[#0E1117] border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option value="">Unassigned</option>
                                                {team.map(member => (
                                                    <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Source</label>
                                            <div className="w-full bg-[#0E1117]/50 border border-border/30 rounded-xl px-4 py-3 text-gray-400 capitalize cursor-not-allowed">
                                                {quickUpdateForm.source || 'manual'}
                                            </div>
                                            <p className="mt-1.5 text-[10px] text-gray-500 italic">Source cannot be manually updated</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <Button
                                            onClick={() => setShowQuickUpdate(false)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleQuickUpdate}
                                            disabled={updating}
                                            className="flex-1 bg-primary text-black hover:bg-primary/90 shadow-glow-sm"
                                        >
                                            {updating ? 'Updating...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

function DetailRow({ label, value, icon: Icon, isUppercase }) {
    return (
        <div className="flex items-center text-sm group">
            <dt className="w-32 text-gray-500 group-hover:text-gray-400 transition-colors uppercase text-[10px] font-bold tracking-wider">{label}</dt>
            <dd className={`text-gray-300 font-medium flex items-center ${isUppercase ? 'uppercase' : ''}`}>
                {Icon && <Icon className="h-4 w-4 mr-2 text-gray-600 group-hover:text-primary/70 transition-colors" />}
                {value}
            </dd>
        </div>
    )
}
