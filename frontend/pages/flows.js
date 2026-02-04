import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { workflowsAPI } from '../utils/api';
import WorkflowTemplates from '../components/WorkflowTemplates'; // Assuming this component needs to be updated or handled separately if it has white bg
import {
    PlusIcon,
    PlayIcon,
    PauseIcon,
    PencilIcon,
    TrashIcon,
    BoltIcon,
    ArrowTopRightOnSquareIcon,
    squares2x2Icon as ViewGridIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button'; // Using consistent Button component

export default function Flows() {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my_flows'); // 'my_flows' or 'templates'
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user && activeTab === 'my_flows') {
            fetchWorkflows();
        }
    }, [user, authLoading, activeTab]);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const res = await workflowsAPI.getWorkflows();
            // Assuming res.data is the list of workflows in V1
            const data = res.data;
            setWorkflows(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (template) => {
        try {
            // Create a new workflow in n8n via backend
            const res = await workflowsAPI.createWorkflow({
                name: `${template.name} COPY`,
                active: false,
                nodes: [],
                settings: { description: template.description }
            });

            // Switch to my flows and refresh
            setActiveTab('my_flows');
            fetchWorkflows();
            // alert(`Created workflow: ${template.name}`);
        } catch (error) {
            console.error('Failed to create from template:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create workflow from template';
            // alert(`Error: ${msg}`);
        }
    };

    const toggleWorkflowStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'active') {
                await workflowsAPI.deactivateWorkflow(id);
            } else {
                await workflowsAPI.activateWorkflow(id);
            }
            fetchWorkflows();
        } catch (error) {
            console.error('Error toggling status:', error);
            // alert('Failed to update status');
        }
    };

    const openEditor = (n8nId) => {
        if (n8nId && n8nId.toString().startsWith('mock-')) {
            alert('This is a simulated workflow (Mock Mode). Real n8n editor is not available.');
            return;
        }
        const n8nUrl = 'http://localhost:5678/workflow/' + n8nId;
        window.open(n8nUrl, '_blank');
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
            <div className="space-y-8 animate-fade-in content-container">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Automation Flows</h1>
                        <p className="mt-1 text-sm text-gray-400">Design and manage your intelligent WhatsApp automation bots.</p>
                    </div>
                    {activeTab === 'my_flows' && (
                        <Button
                            onClick={() => setActiveTab('templates')}
                            variant="primary"
                            className="shadow-glow-sm"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Flow
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-border/50">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('my_flows')}
                            className={`${activeTab === 'my_flows'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            My Flows
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`${activeTab === 'templates'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Templates Library
                        </button>
                    </nav>
                </div>

                {activeTab === 'templates' ? (
                    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-soft">
                        <WorkflowTemplates onUseTemplate={handleUseTemplate} />
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : workflows.length === 0 ? (
                            <div className="text-center py-20 bg-card/30 border border-white/5 rounded-2xl border-dashed">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BoltIcon className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-medium text-white">No workflows found</h3>
                                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                    Get started by creating your first intelligent automation flow.
                                </p>
                                <div className="mt-8">
                                    <Button
                                        onClick={() => setActiveTab('templates')}
                                        variant="primary"
                                    >
                                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                        Create New Flow
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {workflows.map((flow) => (
                                    <div key={flow.id} className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft hover:border-primary/50 transition-all duration-300 group flex flex-col h-full">
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${flow.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                                                        <BoltIcon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold font-display text-white leading-tight line-clamp-1" title={flow.name}>
                                                            {flow.name}
                                                        </h3>
                                                        <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${flow.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                            }`}>
                                                            {flow.status ? flow.status : 'DRAFT'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                                    {flow.description || 'No description provided.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-[#0E1117] px-6 py-4 flex justify-between items-center border-t border-border/50">
                                            <button
                                                onClick={() => openEditor(flow.n8n_workflow_id)}
                                                className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                                            >
                                                <PencilIcon className="h-4 w-4 mr-1.5" /> Open Editor
                                            </button>

                                            {flow.status === 'active' ? (
                                                <button
                                                    onClick={() => toggleWorkflowStatus(flow.n8n_workflow_id, 'active')}
                                                    className="text-sm font-medium text-yellow-500 hover:text-yellow-400 flex items-center transition-colors"
                                                >
                                                    <PauseIcon className="h-4 w-4 mr-1.5" /> Pause
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => toggleWorkflowStatus(flow.n8n_workflow_id, 'inactive')}
                                                    className="text-sm font-medium text-green-500 hover:text-green-400 flex items-center transition-colors"
                                                >
                                                    <PlayIcon className="h-4 w-4 mr-1.5" /> Activate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
