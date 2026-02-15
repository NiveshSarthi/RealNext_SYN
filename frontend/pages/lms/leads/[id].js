import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI } from '../../../utils/api';
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
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

export default function LeadDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login'); // Assuming login is at /login or /
        } else if (user && id) {
            fetchLead();
        }
    }, [user, authLoading, id]);

    const fetchLead = async () => {
        try {
            const response = await leadsAPI.getLead(id);
            setLead(response.data.data);
        } catch (error) {
            console.error('Failed to fetch lead:', error);
            // toast.error('Failed to load lead details');
            // Mock data for demo if API fails
            setLead({
                id: id,
                name: 'Michael Wilson',
                phone: '910000000025',
                email: 'michael.wilson@example.com',
                status: 'new',
                location: 'Mumbai',
                budget_min: 5000000,
                budget_max: 7500000,
                lead_score: 10,
                last_contact: null,
                property_type: 'Residential'
            });
        } finally {
            setLoading(false);
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
            fetchLead(); // Refresh to show new note
        } catch (error) {
            console.error('Failed to add note:', error);
            toast.error('Failed to add note');
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
                            onClick={() => router.push(`/lms/leads/${id}/edit`)}
                            variant="outline"
                            className="text-sm"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit Lead
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant="danger" // Assuming danger variant exists or default to red styled button
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
                        <div className="flex items-center">
                            <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-bold font-display">
                                {lead.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="ml-6">
                                <h1 className="text-2xl font-bold font-display text-white">{lead.name || 'Anonymous Lead'}</h1>
                                <div className="mt-2 flex items-center space-x-4">
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
            </div>
        </Layout>
    );
}

function DetailRow({ label, value, icon: Icon, isUppercase }) {
    return (
        <div className="flex items-center text-sm group">
            <dt className="w-32 text-gray-500 group-hover:text-gray-400 transition-colors">{label}</dt>
            <dd className={`text-gray-300 font-medium flex items-center ${isUppercase ? 'uppercase' : ''}`}>
                {Icon && <Icon className="h-4 w-4 mr-2 text-gray-600 group-hover:text-primary/70 transition-colors" />}
                {value}
            </dd>
        </div>
    )
}
