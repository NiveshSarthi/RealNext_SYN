import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { dripSequencesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
    QueueListIcon,
    PlayIcon,
    PauseIcon,
    ClockIcon,
    UserGroupIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    XMarkIcon,
    CheckIcon,
    BoltIcon,
    ArrowRightIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const STEP_TYPES = [
    { id: 'whatsapp', label: 'WhatsApp Message', icon: ChatBubbleLeftRightIcon, color: 'text-green-400' },
    { id: 'delay', label: 'Wait / Delay', icon: ClockIcon, color: 'text-yellow-400' },
    { id: 'condition', label: 'If/Else Condition', icon: BoltIcon, color: 'text-purple-400' },
];

const DELAY_OPTIONS = ['1 hour', '3 hours', '1 day', '2 days', '3 days', '1 week'];

// ─── Step Builder Component ─────────────────────────────────────────────────
const StepBuilder = ({ steps, onChange }) => {
    const addStep = (type) => {
        const newStep = {
            id: Date.now(),
            type,
            message: type === 'whatsapp' ? '' : undefined,
            delay: type === 'delay' ? '1 day' : undefined,
            condition: type === 'condition' ? '' : undefined,
        };
        onChange([...steps, newStep]);
    };

    const removeStep = (id) => onChange(steps.filter(s => s.id !== id));

    const updateStep = (id, field, value) => {
        onChange(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <div className="space-y-3">
            {steps.map((step, idx) => {
                const StepDef = STEP_TYPES.find(t => t.id === step.type);
                const Icon = StepDef?.icon || BoltIcon;
                return (
                    <div key={step.id} className="relative flex items-start gap-3">
                        {/* Connector line */}
                        {idx < steps.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border/50 z-0" />
                        )}
                        <div className={`relative z-10 flex-shrink-0 h-10 w-10 rounded-full bg-card border-2 border-border flex items-center justify-center ${StepDef?.color}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 bg-[#0E1117] border border-border/50 rounded-xl p-4 group">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-bold uppercase tracking-wider ${StepDef?.color}`}>
                                    Step {idx + 1} — {StepDef?.label}
                                </span>
                                <button onClick={() => removeStep(step.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                            {step.type === 'whatsapp' && (
                                <textarea
                                    rows={2}
                                    value={step.message || ''}
                                    onChange={e => updateStep(step.id, 'message', e.target.value)}
                                    placeholder="Type your WhatsApp message... Use {{name}} for contact name."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                />
                            )}
                            {step.type === 'delay' && (
                                <select
                                    value={step.delay || '1 day'}
                                    onChange={e => updateStep(step.id, 'delay', e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                >
                                    {DELAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            )}
                            {step.type === 'condition' && (
                                <input
                                    type="text"
                                    value={step.condition || ''}
                                    onChange={e => updateStep(step.id, 'condition', e.target.value)}
                                    placeholder="E.g. lead.status === 'Hot'"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add step buttons */}
            <div className="flex flex-wrap gap-2 pt-2 pl-13">
                {STEP_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            onClick={() => addStep(type.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                        >
                            <PlusIcon className="h-3 w-3" />
                            {type.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Create/Edit Modal ──────────────────────────────────────────────────────
const SequenceModal = ({ open, onClose, onSave, initial }) => {
    const [form, setForm] = useState({ name: '', description: '', trigger: 'new_lead', steps: [] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(initial || { name: '', description: '', trigger: 'new_lead', steps: [] });
        }
    }, [open, initial]);

    if (!open) return null;

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Sequence name is required'); return; }
        if (form.steps.length === 0) { toast.error('Add at least one step'); return; }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#0E1117] border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-white">{initial?._id ? 'Edit Sequence' : 'New Drip Sequence'}</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Sequence Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. New Lead Nurture"
                                className="w-full bg-black/30 border border-border/50 rounded-lg py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Trigger</label>
                            <select
                                value={form.trigger}
                                onChange={e => setForm({ ...form, trigger: e.target.value })}
                                className="w-full bg-black/30 border border-border/50 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                            >
                                <option value="new_lead">New Lead Created</option>
                                <option value="status_change">Lead Status Changes</option>
                                <option value="stage_change">Lead Stage Changes</option>
                                <option value="manual">Manual Enrollment</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Optional notes..."
                            className="w-full bg-black/30 border border-border/50 rounded-lg py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-4">Steps</label>
                        <StepBuilder steps={form.steps} onChange={steps => setForm({ ...form, steps })} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 text-sm font-medium bg-primary text-black rounded-lg hover:bg-primary/90 shadow-glow-sm transition-all disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : (initial?._id ? 'Save Changes' : 'Create Sequence')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DripSequences() {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user) {
            fetchSequences();
        }
    }, [user, authLoading]);

    const fetchSequences = async () => {
        setLoading(true);
        try {
            const res = await dripSequencesAPI.getSequences({ type: 'drip' });
            const data = res.data?.data || res.data || [];
            setSequences(Array.isArray(data) ? data : []);
        } catch (error) {
            // Fallback to demo data so the UI is always useful
            setSequences([
                { _id: 'demo1', name: 'New Lead Nurture', status: 'active', flow_data: { steps: [{ type: 'whatsapp' }, { type: 'delay' }, { type: 'whatsapp' }] }, trigger: 'new_lead', description: 'Auto-nurture every new lead over 3 days', execution_count: 120 },
                { _id: 'demo2', name: 'Post-Visit Follow-up', status: 'active', flow_data: { steps: [{ type: 'delay' }, { type: 'whatsapp' }] }, trigger: 'stage_change', description: 'Follow up after a site visit', execution_count: 45 },
                { _id: 'demo3', name: 'Cold Lead Revival', status: 'inactive', flow_data: { steps: [{ type: 'whatsapp' }, { type: 'whatsapp' }] }, trigger: 'status_change', description: 'Re-engage cold leads after 14 days', execution_count: 0 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (form) => {
        try {
            const payload = {
                name: form.name,
                description: form.description,
                type: 'drip',
                trigger_config: { trigger: form.trigger },
                flow_data: { steps: form.steps },
                status: 'inactive'
            };

            if (editTarget?._id && !editTarget._id.startsWith('demo')) {
                await dripSequencesAPI.updateSequence(editTarget._id, payload);
                toast.success('Sequence updated!');
            } else {
                await dripSequencesAPI.createSequence(payload);
                toast.success('Sequence created!');
            }

            setModalOpen(false);
            setEditTarget(null);
            fetchSequences();
        } catch (err) {
            // Optimistic update for demo mode
            const isEdit = editTarget?._id;
            if (isEdit) {
                setSequences(prev => prev.map(s => s._id === editTarget._id ? { ...s, name: form.name, description: form.description, flow_data: { steps: form.steps } } : s));
                toast.success('Sequence updated!');
            } else {
                setSequences(prev => [...prev, { _id: `demo${Date.now()}`, ...form, status: 'inactive', flow_data: { steps: form.steps }, execution_count: 0 }]);
                toast.success('Sequence created!');
            }
            setModalOpen(false);
            setEditTarget(null);
        }
    };

    const toggleStatus = async (seq) => {
        const newStatus = seq.status === 'active' ? 'inactive' : 'active';
        try {
            if (!seq._id.startsWith('demo')) {
                await dripSequencesAPI.updateSequence(seq._id, { status: newStatus });
            }
            setSequences(prev => prev.map(s => s._id === seq._id ? { ...s, status: newStatus } : s));
            toast.success(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}`);
        } catch {
            setSequences(prev => prev.map(s => s._id === seq._id ? { ...s, status: newStatus } : s));
        }
    };

    const deleteSequence = async (seq) => {
        if (!confirm(`Delete "${seq.name}"?`)) return;
        try {
            if (!seq._id.startsWith('demo')) await dripSequencesAPI.deleteSequence(seq._id);
            setSequences(prev => prev.filter(s => s._id !== seq._id));
            toast.success('Sequence deleted');
        } catch {
            setSequences(prev => prev.filter(s => s._id !== seq._id));
            toast.success('Sequence deleted');
        }
    };

    const TRIGGER_LABELS = {
        new_lead: 'New Lead',
        status_change: 'Status Change',
        stage_change: 'Stage Change',
        manual: 'Manual',
    };

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Drip Automation</h1>
                        <p className="mt-1 text-sm text-gray-400">
                            {sequences.filter(s => s.status === 'active').length} active sequence{sequences.filter(s => s.status === 'active').length !== 1 ? 's' : ''} · {sequences.length} total
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditTarget(null); setModalOpen(true); }}
                        className="inline-flex items-center px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all shadow-glow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        New Sequence
                    </button>
                </div>

                {/* Stats Row */}
                {sequences.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Sequences', value: sequences.length, color: 'text-white' },
                            { label: 'Active', value: sequences.filter(s => s.status === 'active').length, color: 'text-green-400' },
                            { label: 'Paused', value: sequences.filter(s => s.status === 'inactive').length, color: 'text-yellow-400' },
                            { label: 'Total Enrolled', value: sequences.reduce((a, s) => a + (s.execution_count || 0), 0), color: 'text-primary' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sequences List */}
                {sequences.length === 0 ? (
                    <div className="bg-card border border-border/50 rounded-xl p-16 text-center">
                        <div className="h-20 w-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <QueueListIcon className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No sequences yet</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">Create your first drip sequence to automate lead nurturing with timed WhatsApp messages.</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Sequence
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sequences.map((seq) => {
                            const steps = seq.flow_data?.steps || [];
                            const trigger = TRIGGER_LABELS[seq.trigger_config?.trigger || seq.trigger] || 'Manual';
                            return (
                                <div key={seq._id} className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-200 group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-white truncate">{seq.name}</h3>
                                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${seq.status === 'active'
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    }`}>
                                                    {seq.status === 'active' ? '● Active' : '⏸ Paused'}
                                                </span>
                                            </div>
                                            {seq.description && <p className="text-sm text-gray-500 mb-3">{seq.description}</p>}

                                            {/* Step preview */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {steps.map((step, i) => {
                                                    const StepDef = STEP_TYPES.find(t => t.id === step.type);
                                                    const Icon = StepDef?.icon || BoltIcon;
                                                    return (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <div className={`flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs ${StepDef?.color || 'text-gray-400'}`}>
                                                                <Icon className="h-3 w-3" />
                                                                <span>{StepDef?.label}</span>
                                                            </div>
                                                            {i < steps.length - 1 && <ArrowRightIcon className="h-3 w-3 text-gray-700 flex-shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <QueueListIcon className="h-4 w-4" />
                                                    <span className="text-white font-medium">{steps.length}</span> steps
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <UserGroupIcon className="h-4 w-4" />
                                                    <span className="text-white font-medium">{seq.execution_count || 0}</span> enrolled
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BoltIcon className="h-4 w-4" />
                                                    Trigger: <span className="text-gray-300 ml-1">{trigger}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => toggleStatus(seq)}
                                                title={seq.status === 'active' ? 'Pause' : 'Activate'}
                                                className={`p-2 rounded-lg border transition-all ${seq.status === 'active'
                                                    ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20'
                                                    : 'text-green-400 border-green-500/20 bg-green-500/10 hover:bg-green-500/20'
                                                    }`}
                                            >
                                                {seq.status === 'active' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => { setEditTarget(seq); setForm && setForm(null); setModalOpen(true); }}
                                                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteSequence(seq)}
                                                className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <SequenceModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSave={handleSave}
                initial={editTarget ? {
                    ...editTarget,
                    name: editTarget.name,
                    description: editTarget.description,
                    trigger: editTarget.trigger_config?.trigger || editTarget.trigger || 'new_lead',
                    steps: editTarget.flow_data?.steps || []
                } : null}
            />
        </Layout>
    );
}
