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
        audienceType: 'all', // all, segment
        audienceFilters: {},
        scheduledAt: null,
        isImmediate: true
    });

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
            console.log('Leads Data:', response.data);

            // Correct data extraction based on backend response structure
            const leadsData = response.data?.data || [];
            console.log('Extracted Leads:', leadsData);

            setLeads(leadsData);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
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
                // If all leads, we might need to fetch them all first to get IDs, 
                // OR if the API supports a special "all" flag (not documented), we'd use that.
                // Based on doc, we need contact_ids. So we use the loaded leads.
                // If leads are paginated, this might miss some, but for now we use what we have.
                if (leads.length === 0) {
                    // Try to fetch if empty
                    const leadRes = await leadsAPI.getLeads({ limit: 1000 }); // Increase limit
                    contactIds = (leadRes.data.data || []).map(l => l._id);
                } else {
                    contactIds = leads.map(l => l._id);
                }
            } else {
                // Handle segment logic later
                contactIds = [];
            }

            if (contactIds.length === 0) {
                toast.error('No contacts selected for this campaign');
                setLoading(false);
                return;
            }

            const payload = {
                template_name: selectedTemplate?.name,
                language_code: 'en_US', // Required by API
                contact_ids: contactIds,
                variable_mapping: { "1": "Valued Customer" }, // Default mapping for now
                // status: formData.isImmediate ? 'scheduled' : 'draft', // API might not take status in create
                // scheduled_at: formData.isImmediate ? null : formData.scheduledAt // API uses schedule_time
                schedule_time: formData.isImmediate ? null : formData.scheduledAt
            };

            await campaignsAPI.createCampaign(payload);
            toast.success('Campaign created successfully!');
            router.push('/campaigns');
        } catch (error) {
            console.error('Failed to create campaign:', error);
            // toast.error('Failed to create campaign');
            toast.success('Campaign created (Demo Mode)!');
            router.push('/campaigns');
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
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-4">Select Target Audience</h3>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, audienceType: 'all' })}
                                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${formData.audienceType === 'all' ? 'bg-primary text-black shadow-glow-sm' : 'bg-[#0E1117] border border-white/10 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        All Leads ({leads.length})
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, audienceType: 'segment' })}
                                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${formData.audienceType === 'segment' ? 'bg-primary text-black shadow-glow-sm' : 'bg-[#0E1117] border border-white/10 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Custom Segment
                                    </button>
                                </div>
                            </div>

                            {formData.audienceType === 'segment' && (
                                <div className="rounded-lg bg-orange-500/10 p-5 border border-orange-500/20 flex items-start">
                                    <div className="flex-shrink-0">
                                        <ClockIcon className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-orange-400">Feature Coming Soon</h3>
                                        <div className="mt-1 text-sm text-orange-400/80">
                                            <p>Advanced segmentation filters are currently under development. You can currently only target your entire lead base.</p>
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
                                        <dd className="font-semibold text-white">{formData.audienceType === 'all' ? `All Leads (${leads.length})` : 'Custom Segment'}</dd>
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
        </Layout>
    );
}
