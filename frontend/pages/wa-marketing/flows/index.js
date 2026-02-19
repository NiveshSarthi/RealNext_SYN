import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    PencilIcon,
    BoltIcon,
    squares2x2Icon as ViewGridIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
// Adjust path to flowApi based on folder structure
import { flowApi } from '../../../components/wa-marketing/flow-builder/utils/flowApi';
import { useAuth } from '../../../contexts/AuthContext';

export default function FlowList() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlowData, setNewFlowData] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchFlows();
        }
    }, [user]);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const data = await flowApi.getFlows();
            setFlows(data);
        } catch (error) {
            console.error('Failed to fetch flows', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFlow = async (e) => {
        e.preventDefault();
        if (!newFlowData.name.trim()) return;

        setCreating(true);
        try {
            const result = await flowApi.createFlow(newFlowData);
            router.push(`/wa-marketing/flows/${result.flow_id}`);
        } catch (error) {
            console.error('Failed to create flow:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to create flow: ${msg}`);
            setCreating(false);
        }
    };

    const handleDeleteFlow = async (id, e) => {
        e.preventDefault(); // Prevent navigation
        if (!window.confirm('Are you sure you want to delete this flow?')) return;

        try {
            await flowApi.deleteFlow(id);
            setFlows(flows.filter(f => f.id !== id));
        } catch (error) {
            console.error('Failed to delete flow', error);
            alert('Failed to delete flow');
        }
    };

    const filteredFlows = flows.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (flow.description && flow.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Layout>
            <Head>
                <title>Flow Builder | Synditech RealNext</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Flow Builder</h1>
                        <p className="text-muted-foreground">Design and manage your WhatsApp automation flows.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Flow
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border border-border">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search flows..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredFlows.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border border-dashed rounded-xl">
                        <BoltIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No flows found</h3>
                        <p className="text-muted-foreground mt-1">Get started by creating your first flow.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-primary hover:underline"
                        >
                            Create New Flow
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFlows.map((flow) => (
                            <Link href={`/wa-marketing/flows/${flow.id}`} key={flow.id}>
                                <div className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <BoltIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.push(`/wa-marketing/flows/${flow.id}`);
                                                }}
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                                onClick={(e) => handleDeleteFlow(flow.id, e)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                        {flow.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                                        {flow.description || 'No description'}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                                        <span className={`flex items-center ${flow.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                                            <span className={`block h-2 w-2 rounded-full mr-2 ${flow.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                            {flow.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span>
                                            {new Date(flow.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Create New Flow</h2>
                        <form onSubmit={handleCreateFlow}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Flow Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={newFlowData.name}
                                        onChange={(e) => setNewFlowData({ ...newFlowData, name: e.target.value })}
                                        placeholder="e.g. Welcome Series"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
                                        value={newFlowData.description}
                                        onChange={(e) => setNewFlowData({ ...newFlowData, description: e.target.value })}
                                        placeholder="Describe functionality..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Flow'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
