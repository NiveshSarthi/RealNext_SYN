import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import { campaignsAPI, templatesAPI, leadsAPI } from '../../../../utils/api';
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
    PencilIcon
} from '@heroicons/react/24/outline';

const steps = [
    { id: 1, name: 'Basic Info', icon: PencilIcon },
    { id: 2, name: 'Template', icon: ChatBubbleLeftRightIcon },
    { id: 3, name: 'Audience', icon: UsersIcon },
    { id: 4, name: 'Schedule', icon: ClockIcon },
];

export default function EditCampaign() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [leads, setLeads] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        templateId: '',
        audienceType: 'all',
        audienceFilters: {},
        scheduledAt: null,
        isImmediate: true
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user && id) {
            fetchInitialData();
        }
    }, [user, authLoading, id]);

    const fetchInitialData = async () => {
        try {
            const [campaignRes, templatesRes, leadsRes] = await Promise.all([
                campaignsAPI.getCampaign(id),
                templatesAPI.getTemplates(),
                leadsAPI.getLeads({ limit: 100 })
            ]);

            const campaign = campaignRes.data.data;
            setFormData({
                name: campaign.name,
                description: campaign.description || '',
                templateId: campaign.template_id,
                audienceType: campaign.audience_type || 'all',
                audienceFilters: campaign.audience_filters || {},
                scheduledAt: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : null,
                isImmediate: !campaign.scheduled_at
            });

            setTemplates(templatesRes.data.data.filter(t => t.is_approved));
            setLeads(leadsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            toast.error('Failed to load campaign data');
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
        setSubmitLoading(true);
        try {
            const payload = {
                ...formData,
                scheduled_at: formData.isImmediate ? null : formData.scheduledAt
            };

            await campaignsAPI.updateCampaign(id, payload);
            toast.success('Campaign updated successfully!');
            router.push('/campaigns');
        } catch (error) {
            console.error('Failed to update campaign:', error);
            toast.error('Failed to update campaign');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
                </div>

                {/* Stepper */}
                <nav aria-label="Progress">
                    <ol role="list" className="flex items-center">
                        {steps.map((step, stepIdx) => (
                            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                <div className="flex items-center" aria-hidden="true">
                                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${step.id < currentStep ? 'bg-blue-600 border-blue-600' :
                                        step.id === currentStep ? 'border-blue-600' : 'border-gray-300'
                                        }`}>
                                        {step.id < currentStep ? (
                                            <CheckIcon className="h-6 w-6 text-white" />
                                        ) : (
                                            <step.icon className={`h-6 w-6 ${step.id === currentStep ? 'text-blue-600' : 'text-gray-400'}`} />
                                        )}
                                    </div>
                                    {stepIdx !== steps.length - 1 && (
                                        <div className={`absolute top-5 left-10 -ml-px h-0.5 w-full transition-colors ${step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                            }`} style={{ width: 'calc(100% - 40px)' }} />
                                    )}
                                </div>
                                <div className="mt-2 block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {step.name}
                                </div>
                            </li>
                        ))}
                    </ol>
                </nav>

                {/* Form Content */}
                <div className="bg-white shadow rounded-lg p-6 sm:p-8">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setFormData({ ...formData, templateId: template.id })}
                                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${formData.templateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                                        {formData.templateId === template.id && <CheckCircleIcon className="h-5 w-5 text-blue-500" />}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 uppercase">{template.category}</p>
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{template.content?.body || 'No preview available'}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setFormData({ ...formData, audienceType: 'all' })}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.audienceType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    All Leads ({leads.length})
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, audienceType: 'segment' })}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.audienceType === 'segment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    Custom Segment
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2 mb-4">Final Review</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Campaign Name</dt>
                                        <dd className="font-medium">{formData.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Template</dt>
                                        <dd className="font-medium">{templates.find(t => t.id === formData.templateId)?.name || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center">
                                    <input
                                        id="immediate"
                                        type="radio"
                                        checked={formData.isImmediate}
                                        onChange={() => setFormData({ ...formData, isImmediate: true })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="immediate" className="ml-3 text-sm font-medium text-gray-700">Immediate/Draft</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="scheduled"
                                        type="radio"
                                        checked={!formData.isImmediate}
                                        onChange={() => setFormData({ ...formData, isImmediate: false })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="scheduled" className="ml-3 text-sm font-medium text-gray-700">Schedule for Later</label>
                                </div>

                                {!formData.isImmediate && (
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledAt || ''}
                                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center py-4">
                    {currentStep > 1 ? (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeftIcon className="h-5 w-5 mr-1" />
                            Back
                        </button>
                    ) : <div />}

                    {currentStep < steps.length ? (
                        <button
                            onClick={handleNext}
                            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                        >
                            Next
                            <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            className="inline-flex items-center px-8 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            {submitLoading ? 'Updating...' : 'Update Campaign'}
                            {!submitLoading && <CheckIcon className="h-5 w-5 ml-2" />}
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    );
}
