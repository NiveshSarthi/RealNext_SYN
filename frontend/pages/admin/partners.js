import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminPartners() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        domain: '',
        commission_rate: 10
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPartners();
            if (response.data.success) {
                setPartners(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load partners');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await adminAPI.updatePartner(editingId, formData);
                toast.success('Partner updated successfully');
            } else {
                await adminAPI.createPartner(formData);
                toast.success('Partner created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchPartners();
        } catch (error) {
            toast.error(editingId ? 'Failed to update partner' : 'Failed to create partner');
            console.error(error);
        }
    };

    const handleEdit = (partner) => {
        setEditingId(partner.id);
        setFormData({
            name: partner.name,
            email: partner.email,
            domain: partner.domain || '',
            commission_rate: partner.commission_rate
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
            try {
                await adminAPI.deletePartner(id);
                toast.success('Partner deleted');
                fetchPartners();
            } catch (error) {
                toast.error('Failed to delete partner');
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            domain: '',
            commission_rate: 10
        });
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="container-custom py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Partner Management</h1>
                        <p className="mt-1 text-muted-foreground">Manage resellers, affiliates, and white-label partners.</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Partner
                    </Button>
                </div>

                {/* Search & Filter */}
                <Card className="mb-6 p-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            placeholder="Search partners..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Partners Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-6 py-4">Partner</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Commission</th>
                                <th className="px-6 py-4">Referral Code</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">Loading partners...</td></tr>
                            ) : filteredPartners.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">No partners found.</td></tr>
                            ) : (
                                filteredPartners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{partner.name}</div>
                                            <div className="text-sm text-muted-foreground">{partner.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {partner.status === 'active' ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                                                {partner.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">{partner.commission_rate}%</td>
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{partner.referral_code}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(partner)} className="text-primary hover:text-primary/80 transition-colors">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(partner.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Modal Implementation */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-card w-full max-w-md rounded-xl shadow-2xl p-6 border border-border m-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold font-display text-foreground">
                                    {editingId ? 'Edit Partner' : 'Create New Partner'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Acme Resellers Inc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                                    <Input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="partner@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Custom Domain (Optional)</label>
                                    <Input
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        placeholder="partners.acme.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Commission Rate (%)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        value={formData.commission_rate}
                                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingId ? 'Update Partner' : 'Create Partner'}
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
