import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminTenants() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getTenants();
            if (response.data.success) {
                setTenants(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load tenants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="container-custom py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Tenant Overview</h1>
                        <p className="mt-1 text-muted-foreground">Monitor all customer organizations and their status.</p>
                    </div>
                    {/* Create Tenant usually done via Registration or Partner Portal */}
                </div>

                {/* Search & Filter */}
                <Card className="mb-6 p-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            placeholder="Search tenants by name or email..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Tenants Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">Loading tenants...</div>
                    ) : filteredTenants.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">No tenants found.</div>
                    ) : (
                        filteredTenants.map((tenant) => (
                            <Card key={tenant.id} className="p-6 hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <BuildingOfficeIcon className="w-6 h-6" />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {tenant.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-foreground mb-1">{tenant.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{tenant.email}</p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <UserGroupIcon className="w-4 h-4 mr-2" />
                                        <span>{tenant.users_count || 1} Users</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <CreditCardIcon className="w-4 h-4 mr-2" />
                                        <span>{tenant.subscription?.plan?.name || 'Free Plan'}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                                    <Button variant="outline" size="sm">Manage</Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
