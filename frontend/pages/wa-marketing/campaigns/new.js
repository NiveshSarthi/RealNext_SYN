import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { campaignsAPI, templatesAPI, leadsAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    CheckIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    ChatBubbleLeftRightIcon,
    UsersIcon,
    ClockIcon,
    CheckCircleIcon,
    PencilIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

const steps = [
    { id: 1, name: 'Basic Info', icon: PencilIcon },
    { id: 2, name: 'Template', icon: DocumentTextIcon },
    { id: 3, name: 'Audience', icon: UsersIcon },
    { id: 4, name: 'Schedule', icon: ClockIcon },
];

export default function NewCampaign() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [leads, setLeads] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        templateId: '',
        audienceType: 'all', // all, manual, csv
        selectedLeadIds: [],
        audienceFilters: {},
        scheduledAt: null,
        isImmediate: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user) {
            fetchTemplates();
            fetchLeads();
        }
    }, [user, authLoading]);

    const fetchTemplates = async () => {
        try {
            const response = await templatesAPI.getTemplates();
            // API returns direct array
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setTemplates(data.filter(t => t.status === 'APPROVED') || []);
        } catch (error) {
            // Mock templates if API fails
            setTemplates([
                { id: 1, name: 'Welcome Message', category: 'Marketing', content: { body: 'Hello {{1}}, welcome to our service!' } },
                { id: 2, name: 'Festival Offer', category: 'Marketing', content: { body: 'Happy Diwali! Get 20% off on all items.' } }
            ]);
        }
    };

    const fetchLeads = async () => {
        try {
            console.log('Fetching leads for campaign...');
            const response = await leadsAPI.getLeads({ limit: 100 });
            console.log('Leads API Response:', response);

            // Robust data extraction
            const rawData = response.data;
            let leadsData = [];

            if (Array.isArray(rawData)) {
                leadsData = rawData;
            } else if (Array.isArray(rawData?.data)) {
                leadsData = rawData.data;
            } else if (Array.isArray(rawData?.contacts)) {
                leadsData = rawData.contacts;
            }

            console.log('Extracted Leads:', leadsData);
            setLeads(leadsData);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        }
    };

    const fetchLiveLeads = async () => {
        setLoading(true);
        try {
            toast.loading('Fetching live leads from Meta Ads...', { id: 'fetch-live' });
            const res = await metaAdsAPI.fetchLeads();
            toast.success(`Fetched ${res.data.newLeadsCreated || 0} new leads!`, { id: 'fetch-live' });
            await fetchLeads(); // Refresh list
        } catch (err) {
            console.error('Failed to fetch live leads:', err);
            toast.error('Failed to fetch live leads. Check your Meta Ads connection.', { id: 'fetch-live' });
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 1 && !formData.name) {
            toast.error('Campaign name is required');
            return;
        }
        if (currentStep === 2 && !formData.templateId) {
            toast.error('Please select a template');
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Find selected template to get its name
            const selectedTemplate = templates.find(t => t.id === formData.templateId);

            // 1. Prepare Contact IDs
            let contactIds = [];
            if (formData.audienceType === 'all') {
                if (leads.length === 0) {
                    const leadRes = await leadsAPI.getLeads({ limit: 1000 });
                    contactIds = (leadRes.data.data || []).map(l => l._id || l.id);
                } else {
                    contactIds = leads.map(l => l._id || l.id);
                }
            } else if (formData.audienceType === 'manual' || formData.audienceType === 'csv') {
                contactIds = formData.selectedLeadIds || [];
            } else {
                contactIds = [];
            }

            if (contactIds.length === 0) {
                toast.error('No contacts selected for this campaign');
                setLoading(false);
                return;
            }

            const payload = {
                name: formData.name,
                type: 'broadcast',
                template_name: selectedTemplate?.name,
                template_data: {
                    language_code: 'en_US',
                    variable_mapping: { "1": "Valued Customer" }
                },
                target_audience: {
                    include: contactIds
                },
                scheduled_at: formData.isImmediate ? null : formData.scheduledAt,
                metadata: {
                    audience_type: formData.audienceType
                }
            };

            console.log('Creating campaign...', payload);
            const response = await campaignsAPI.createCampaign(payload);
            console.log('Campaign created:', response.data);

            toast.success(response.data.message || 'Campaign launched successfully!');
            router.push('/wa-marketing/campaigns');
        } catch (error) {
            console.error('Failed to create campaign:', error);
            const errorMessage = error.response?.data?.message ||
                (error.response?.data?.error) ||
                error.message ||
                'Failed to create campaign';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold font-display text-white">Create New Campaign</h1>
                        <p className="text-sm text-gray-400">Launch a new marketing initiative in 4 simple steps.</p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="bg-card border border-border/50 rounded-xl p-8 shadow-soft">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                                    <div className="flex items-center" aria-hidden="true">
                                        <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${step.id < currentStep ? 'bg-primary border-primary shadow-glow-sm' :
                                            step.id === currentStep ? 'border-primary bg-primary/20 text-primary shadow-glow-sm' : 'border-gray-700 bg-gray-800 text-gray-500'
                                            }`}>
                                            {step.id < currentStep ? (
                                                <CheckIcon className="h-6 w-6 text-black" />
                                            ) : (
                                                <step.icon className="h-6 w-6" />
                                            )}
                                        </div>
                                        {stepIdx !== steps.length - 1 && (
                                            <div className={`absolute top-6 left-14 -ml-px h-0.5 w-full transition-colors duration-300 ${step.id < currentStep ? 'bg-primary shadow-glow-sm' : 'bg-gray-800'
                                                }`} style={{ width: 'calc(100% - 56px)' }} />
                                        )}
                                    </div>
                                    <div className={`mt-3 block text-xs font-bold uppercase tracking-wider ${step.id === currentStep ? 'text-white' : 'text-gray-500'}`}>
                                        {step.name}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {/* Form Content */}
                <div className="bg-card border border-border/50 rounded-xl p-8 shadow-soft min-h-[400px]">
                    {currentStep === 1 && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
                                    placeholder="E.g., Festive Offer 2024"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
                                    placeholder="Optional notes about this campaign..."
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setFormData({ ...formData, templateId: template.id })}
                                    className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${formData.templateId === template.id ? 'border-primary bg-primary/10 shadow-glow-sm' : 'border-white/5 bg-[#0E1117] hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-white font-display">{template.name}</h3>
                                        {formData.templateId === template.id && <CheckCircleIcon className="h-6 w-6 text-primary" />}
                                    </div>
                                    <div className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-gray-400 mb-3">
                                        {template.category}
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                        {template.content?.body || 'No preview available'}
                                    </p>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="col-span-full py-16 text-center text-gray-500 bg-[#0E1117] rounded-xl border border-dashed border-white/10">
                                    <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-600 mb-2" />
                                    No approved templates found. <br />
                                    Please approve templates in the Templates module first.
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Select Target Audience</h3>
                                    <p className="text-sm text-gray-400">Choose how you want to reach your audience.</p>
                                </div>
                                <Button
                                    onClick={fetchLiveLeads}
                                    disabled={loading}
                                    variant="outline"
                                    className="border-primary/50 text-primary hover:bg-primary/10 transition-all flex items-center"
                                >
                                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                                    Fetch Live Leads
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'all', name: 'All Leads', desc: `Broadcast to all ${leads.length} contacts`, icon: UsersIcon },
                                    { id: 'manual', name: 'Manual Selection', desc: 'Search and pick specific contacts', icon: CheckCircleIcon },
                                    { id: 'csv', name: 'Import CSV', desc: 'Upload and target new contacts via EXCEL/CSV', icon: DocumentTextIcon },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, audienceType: type.id })}
                                        className={`flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left ${formData.audienceType === type.id
                                            ? 'border-primary bg-primary/10 shadow-glow-sm'
                                            : 'border-white/5 bg-[#0E1117] hover:border-white/10'
                                            }`}
                                    >
                                        <type.icon className={`h-6 w-6 mb-3 ${formData.audienceType === type.id ? 'text-primary' : 'text-gray-500'}`} />
                                        <span className={`font-bold ${formData.audienceType === type.id ? 'text-white' : 'text-gray-400'}`}>{type.name}</span>
                                        <span className="text-xs text-gray-500 mt-1">{type.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* CSV IMPORT UI */}
                            {formData.audienceType === 'csv' && (
                                <div className="p-8 border-2 border-dashed border-white/10 rounded-xl bg-[#0E1117] text-center">
                                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <DocumentTextIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h4 className="text-white font-medium mb-1">Upload Audience CSV</h4>
                                    <p className="text-xs text-gray-500 mb-6">File must contain "Name" and "Phone" columns.</p>
                                    <input
                                        type="file"
                                        id="csv-upload"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                                const text = event.target.result;
                                                const lines = text.split(/\r?\n/).filter(line => line.trim());
                                                if (lines.length < 2) {
                                                    toast.error('CSV appears to be empty or missing data');
                                                    return;
                                                }

                                                // Simple CSV parser that handles quotes
                                                const parseCSVLine = (line) => {
                                                    const result = [];
                                                    let cur = "";
                                                    let inQuotes = false;
                                                    for (let i = 0; i < line.length; i++) {
                                                        const char = line[i];
                                                        if (char === '"') {
                                                            if (inQuotes && line[i + 1] === '"') {
                                                                cur += '"';
                                                                i++;
                                                            } else {
                                                                inQuotes = !inQuotes;
                                                            }
                                                        } else if (char === ',' && !inQuotes) {
                                                            result.push(cur);
                                                            cur = "";
                                                        } else {
                                                            cur += char;
                                                        }
                                                    }
                                                    result.push(cur);
                                                    return result;
                                                };

                                                try {
                                                    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
                                                    const nameIdx = headers.findIndex(h => h.includes('name'));
                                                    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('number') || h.includes('mobile'));

                                                    if (nameIdx === -1 || phoneIdx === -1) {
                                                        toast.error('CSV must have "Name" and "Phone" headers');
                                                        return;
                                                    }

                                                    const importedLeads = lines.slice(1).map(line => {
                                                        const cols = parseCSVLine(line);
                                                        return {
                                                            name: cols[nameIdx]?.trim(),
                                                            phone: cols[phoneIdx]?.trim()?.replace(/[^0-9+]/g, '')
                                                        };
                                                    }).filter(l => l.name && l.phone && l.phone.length >= 10);

                                                    if (importedLeads.length === 0) {
                                                        toast.error('No valid contacts found in CSV (ensure name and valid phone numbers exist)');
                                                        return;
                                                    }

                                                    setLoading(true);
                                                    toast.loading(`Importing ${importedLeads.length} leads...`, { id: 'csv-import' });

                                                    const res = await leadsAPI.importLeads({ leads: importedLeads });
                                                    const newLeads = Array.isArray(res.data?.data) ? res.data.data : (res.data?.leads || []);

                                                    toast.success(`Successfully imported ${newLeads.length} contacts!`, { id: 'csv-import' });

                                                    setLeads(prev => [...newLeads, ...prev]);
                                                    setFormData({
                                                        ...formData,
                                                        audienceType: 'manual',
                                                        selectedLeadIds: newLeads.map(l => l._id || l.id)
                                                    });
                                                } catch (err) {
                                                    console.error('CSV Parsing/Import Error:', err);
                                                    toast.error(err.response?.data?.message || 'Failed to import CSV contacts', { id: 'csv-import' });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            };
                                            reader.readAsText(file);
                                        }}
                                    />
                                    <Button
                                        onClick={() => document.getElementById('csv-upload').click()}
                                        variant="outline"
                                        className="border-primary/50 text-primary hover:bg-primary/10"
                                    >
                                        Browse Files
                                    </Button>
                                </div>
                            )}

                            {/* MANUAL SELECTION UI */}
                            {formData.audienceType === 'manual' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search by name or number..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="block w-full bg-[#0E1117] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    const filteredIds = leads
                                                        .filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm))
                                                        .map(l => l._id || l.id);
                                                    setFormData({ ...formData, selectedLeadIds: [...new Set([...(formData.selectedLeadIds || []), ...filteredIds])] });
                                                }}
                                                className="text-[10px] uppercase font-bold text-primary hover:text-primary/80 transition-colors"
                                            >
                                                Select Filtered
                                            </button>
                                            <span className="text-gray-700">|</span>
                                            <button
                                                onClick={() => setFormData({ ...formData, selectedLeadIds: [] })}
                                                className="text-[10px] uppercase font-bold text-gray-500 hover:text-gray-400 transition-colors"
                                            >
                                                Clear
                                            </button>
                                            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                                {formData.selectedLeadIds?.length || 0} selected
                                            </span>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto border border-white/5 rounded-xl bg-[#0E1117] divide-y divide-white/5 custom-scrollbar">
                                        {leads
                                            .filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm))
                                            .map(lead => {
                                                const leadId = lead._id || lead.id;
                                                const isSelected = formData.selectedLeadIds?.includes(leadId);
                                                return (
                                                    <div
                                                        key={leadId}
                                                        onClick={() => {
                                                            const current = formData.selectedLeadIds || [];
                                                            setFormData({
                                                                ...formData,
                                                                selectedLeadIds: isSelected
                                                                    ? current.filter(id => id !== leadId)
                                                                    : [...current, leadId]
                                                            });
                                                        }}
                                                        className={`flex items-center p-4 cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <div className={`h-5 w-5 rounded border-2 mr-4 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-700'}`}>
                                                            {isSelected && <CheckIcon className="h-3 w-3 text-black font-bold" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-white">{lead.name}</p>
                                                            <p className="text-xs text-gray-500">{lead.phone || lead.email || 'No contact info'}</p>
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-500 uppercase font-bold">
                                                            {lead.source || 'Manual'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        {leads.length === 0 && (
                                            <div className="p-8 text-center text-gray-500 italic">No contacts found.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {formData.audienceType === 'all' && (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start">
                                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                                        <UsersIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-white font-medium">Global Broadcast</h4>
                                        <p className="text-sm text-gray-400 mt-1">
                                            This campaign will target all <strong>{leads.length}</strong> available contacts in your database.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {formData.audienceType === 'segment' && (
                                <div className="rounded-lg bg-orange-500/10 p-5 border border-orange-500/20 flex items-start">
                                    <div className="flex-shrink-0">
                                        <ClockIcon className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-orange-400">Feature Coming Soon</h3>
                                        <div className="mt-1 text-sm text-orange-400/80">
                                            <p>Advanced segmentation filters are currently under development. You can currently only target your entire lead base or specific selections.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-8">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm">
                                <h3 className="text-base font-bold text-white border-b border-primary/20 pb-3 mb-4 flex items-center">
                                    <CheckCircleIcon className="h-5 w-5 mr-2 text-primary" />
                                    Campaign Summary
                                </h3>
                                <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 text-sm">
                                    <div>
                                        <dt className="text-gray-500 mb-1">Campaign Name</dt>
                                        <dd className="font-semibold text-white text-lg">{formData.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 mb-1">Selected Template</dt>
                                        <dd className="font-semibold text-white">{templates.find(t => t.id === formData.templateId)?.name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 mb-1">Target Audience</dt>
                                        <dd className="font-semibold text-white">
                                            {formData.audienceType === 'all' ? `All Leads (${leads.length} contacts)` :
                                                formData.audienceType === 'manual' ? `Selected Contacts (${formData.selectedLeadIds?.length || 0})` :
                                                    'CSV Import'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 mb-1">Delivery Schedule</dt>
                                        <dd className="font-semibold text-white">{formData.isImmediate ? 'Send Immediately' : `Scheduled: ${formData.scheduledAt}`}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <label className="text-sm font-medium text-gray-300">Schedule Delivery</label>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <input
                                            id="immediate"
                                            name="delivery"
                                            type="radio"
                                            checked={formData.isImmediate}
                                            onChange={() => setFormData({ ...formData, isImmediate: true })}
                                            className="h-4 w-4 bg-[#0E1117] border-white/20 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="immediate" className="ml-3 text-sm font-medium text-white">Send Immediately</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="scheduled"
                                            name="delivery"
                                            type="radio"
                                            checked={!formData.isImmediate}
                                            onChange={() => setFormData({ ...formData, isImmediate: false })}
                                            className="h-4 w-4 bg-[#0E1117] border-white/20 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="scheduled" className="ml-3 text-sm font-medium text-white">Schedule for Later</label>
                                    </div>
                                </div>

                                {!formData.isImmediate && (
                                    <div className="max-w-xs mt-3">
                                        <input
                                            type="datetime-local"
                                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                            className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center py-4 px-2">
                    {currentStep > 1 ? (
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="bg-[#0E1117] border-white/10 text-white hover:bg-white/5"
                        >
                            <ChevronLeftIcon className="h-5 w-5 mr-1" />
                            Back
                        </Button>
                    ) : <div />}

                    {currentStep < steps.length ? (
                        <Button
                            onClick={handleNext}
                            variant="primary"
                            className="w-32"
                        >
                            Next
                            <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            variant="primary"
                            className="w-48 shadow-glow"
                        >
                            {loading ? 'Creating...' : 'Launch Campaign'}
                            {!loading && <CheckIcon className="h-5 w-5 ml-2" />}
                        </Button>
                    )}
                </div>
            </div>
        </Layout >
    );
}
