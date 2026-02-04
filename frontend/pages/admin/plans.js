import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Toggle from '../../components/ui/Switch';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        price_monthly: 0,
        price_yearly: 0,
        trial_days: 14,
        description: '',
        is_public: true,
        is_active: true
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPlans();
            if (response.data.success) {
                setPlans(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load plans');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await adminAPI.updatePlan(editingId, formData);
                toast.success('Plan updated successfully');
            } else {
                await adminAPI.createPlan(formData);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchPlans();
        } catch (error) {
            toast.error(editingId ? 'Failed to update plan' : 'Failed to create plan');
            console.error(error);
        }
    };

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setFormData({
            name: plan.name,
            code: plan.code,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly || 0,
            trial_days: plan.trial_days,
            description: plan.description || '',
            is_public: plan.is_public,
            is_active: plan.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
            try {
                await adminAPI.deletePlan(id);
                toast.success('Plan deleted');
                fetchPlans();
            } catch (error) {
                toast.error('Failed to delete plan');
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            code: '',
            price_monthly: 0,
            price_yearly: 0,
            trial_days: 14,
            description: '',
            is_public: true,
            is_active: true
        });
    };

    const filteredPlans = plans.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="container-custom py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Subscription Plans</h1>
                        <p className="mt-1 text-muted-foreground">Manage pricing tiers and feature packages.</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Plan
                    </Button>
                </div>

                {/* Search & Filter */}
                <Card className="mb-6 p-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            placeholder="Search plans..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Plans Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-6 py-4">Plan Name</th>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Monthly Price</th>
                                <th className="px-6 py-4">Trial Days</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">Loading plans...</td></tr>
                            ) : filteredPlans.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">No plans found.</td></tr>
                            ) : (
                                filteredPlans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{plan.name}</div>
                                            <div className="text-sm text-muted-foreground truncate max-w-xs">{plan.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{plan.code}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">₹{plan.price_monthly}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{plan.trial_days} days</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1">
                                                {plan.is_active ?
                                                    <span className="text-xs text-green-600 flex items-center"><CheckCircleIcon className="w-3 h-3 mr-1" /> Active</span> :
                                                    <span className="text-xs text-red-600 flex items-center"><XCircleIcon className="w-3 h-3 mr-1" /> Inactive</span>
                                                }
                                                {plan.is_public ?
                                                    <span className="text-xs text-blue-600 flex items-center">Public</span> :
                                                    <span className="text-xs text-gray-500 flex items-center">Private</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(plan)} className="text-primary hover:text-primary/80 transition-colors">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(plan.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl p-6 border border-border m-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-display text-foreground">
                                    {editingId ? 'Edit Plan' : 'Create New Plan'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Plan Name</label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Pro Plan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Plan Code</label>
                                        <Input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="pro_monthly"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Monthly Price (₹)</label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.price_monthly}
                                            onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Yearly Price (₹)</label>
                                        <Input
                                            type="number"
                                            value={formData.price_yearly}
                                            onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Trial Days</label>
                                    <Input
                                        type="number"
                                        value={formData.trial_days}
                                        onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                    <textarea
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Plan details..."
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <label className="text-sm font-medium text-foreground">Active Status</label>
                                    <Toggle enabled={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e })} />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <label className="text-sm font-medium text-foreground">Publicly Visible</label>
                                    <Toggle enabled={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e })} />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingId ? 'Update Plan' : 'Create Plan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
