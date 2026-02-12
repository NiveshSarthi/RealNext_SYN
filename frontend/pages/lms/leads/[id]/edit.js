import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import { leadsAPI } from '../../../../utils/api';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/ui/Button';

const stageStatusMapping = {
    'Screening': ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead'],
    'Sourcing': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Walk-in': ['Hot', 'Warm', 'Cold', 'Lost'],
    'Closure': ['Hot', 'Warm', 'Cold', 'Lost']
};

export default function EditLead() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { id } = router.query;
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        stage: 'Screening',
        status: 'Uncontacted',
        source: 'manual',
        location: '',
        budget_min: '',
        budget_max: '',
        type: 'residential',
        notes: ''
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && id) {
            fetchLead();
        }
    }, [user, authLoading, id]);

    const fetchLead = async () => {
        try {
            const response = await leadsAPI.getLead(id);
            const lead = response.data.data;
            setFormData({
                name: lead.name || '',
                phone: lead.phone || '',
                email: lead.email || '',
                stage: lead.stage || 'Screening',
                status: lead.status || 'Uncontacted',
                source: lead.source || 'manual',
                location: lead.location || '',
                budget_min: lead.budget_min || '',
                budget_max: lead.budget_max || '',
                type: lead.type || 'residential',
                notes: lead.notes || ''
            });
        } catch (error) {
            console.error('Failed to fetch lead:', error);
            toast.error('Failed to load lead details');
            // Mock data for demo
            setFormData({
                name: 'Michael Wilson',
                phone: '910000000025',
                email: 'michael.wilson@example.com',
                status: 'new',
                source: 'manual',
                location: 'Mumbai',
                budget_min: 5000000,
                budget_max: 7500000,
                type: 'residential',
                notes: ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (!formData.name || !formData.phone) {
                toast.error('Name and Phone are required');
                setSaving(false);
                return;
            }

            await leadsAPI.updateLead(id, formData);
            toast.success('Lead updated successfully');
            router.push(`/lms/leads/${id}`);
        } catch (error) {
            console.error('Error updating lead:', error);
            toast.error(error.response?.data?.message || 'Failed to update lead');
        } finally {
            setSaving(false);
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

    return (
        <Layout>
            <div className="max-w-3xl mx-auto py-6 animate-fade-in content-container">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href={`/lms/leads/${id}`} className="text-gray-400 hover:text-white mr-4 transition-colors">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <h1 className="text-2xl font-bold font-display text-white">Edit Lead</h1>
                    </div>
                </div>

                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Basic Info */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-white mb-6 flex items-center border-b border-border/50 pb-2">
                                <UserIcon className="h-5 w-5 mr-2 text-primary" />
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <InputField
                                    label="Full Name *"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    required
                                />
                                <InputField
                                    label="Phone Number *"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    icon={<PhoneIcon className="h-4 w-4" />}
                                    required
                                />
                                <div className="sm:col-span-2">
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        icon={<EnvelopeIcon className="h-4 w-4" />}
                                        type="email"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-white mb-6 flex items-center border-b border-border/50 pb-2">
                                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-primary" />
                                Requirements
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <InputField
                                    label="Detailed Location Preference"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Bandra West, Mumbai"
                                    icon={<MapPinIcon className="h-4 w-4" />}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Property Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
                                    >
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="plot">Plot/Land</option>
                                    </select>
                                </div>
                                <InputField
                                    label="Min Budget"
                                    name="budget_min"
                                    type="number"
                                    value={formData.budget_min}
                                    onChange={handleChange}
                                    placeholder="Min"
                                    icon={<span className="text-gray-400 font-bold">₹</span>}
                                />
                                <InputField
                                    label="Max Budget"
                                    name="budget_max"
                                    type="number"
                                    value={formData.budget_max}
                                    onChange={handleChange}
                                    placeholder="Max"
                                    icon={<span className="text-gray-400 font-bold">₹</span>}
                                />
                            </div>
                        </div>

                        {/* Stage and Status */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-white mb-6 flex items-center border-b border-border/50 pb-2">
                                Lead Lifecycle
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Lead Stage</label>
                                    <select
                                        name="stage"
                                        value={formData.stage}
                                        onChange={(e) => {
                                            const newStage = e.target.value;
                                            const defaultStatus = stageStatusMapping[newStage][0];
                                            setFormData(prev => ({ ...prev, stage: newStage, status: defaultStatus }));
                                        }}
                                        className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
                                    >
                                        {Object.keys(stageStatusMapping).map(stage => (
                                            <option key={stage} value={stage}>{stage}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Lead Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="block w-full bg-[#0E1117] border border-border/50 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all"
                                    >
                                        {(stageStatusMapping[formData.stage] || stageStatusMapping['Screening']).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>



                        <div className="flex justify-end pt-5 border-t border-border/50">
                            <Link href={`/lms/leads/${id}`}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mr-3"
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={saving}
                                variant="primary"
                                className="w-32"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </Layout>
    );
}

function InputField({ label, name, value, onChange, placeholder, type = "text", required, icon }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            <div className="relative rounded-md shadow-sm">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`block w-full bg-[#0E1117] border border-border/50 rounded-lg py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-all ${icon ? 'pl-10' : ''}`}
                    placeholder={placeholder}
                    required={required}
                />
            </div>
        </div>
    );
}
