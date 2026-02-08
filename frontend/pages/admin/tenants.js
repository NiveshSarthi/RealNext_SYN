import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Button from '../../components/ui/Button';
import {
    BuildingOfficeIcon,
    ListBulletIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';
import axios from '../../utils/api';
import { toast } from 'react-hot-toast';
import { USER_NAVIGATION } from '../../utils/navigationConfig';

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [menuAccess, setMenuAccess] = useState({});
    const [clientFeatures, setClientFeatures] = useState({});
    const [expandedNodes, setExpandedNodes] = useState({});

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await axios.get('/api/admin/tenants');
            setClients(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load clients');
            setLoading(false);
        }
    };

    // --- Menu Control Logic ---
    const openMenuModal = (client) => {
        setSelectedClient(client);
        setMenuAccess(client.settings?.menu_access || {});
        setShowMenuModal(true);
    };

    const toggleMenuAccess = (id, checked) => {
        setMenuAccess(prev => {
            const newAccess = { ...prev, [id]: checked };

            const disableChildren = (items) => {
                items.forEach(item => {
                    if (item.children) {
                        item.children.forEach(child => {
                            newAccess[child.id] = checked;
                            if (child.children) disableChildren(child.children);
                        });
                    }
                });
            };

            const findItem = (items) => {
                for (const item of items) {
                    if (item.id === id) {
                        if (!checked && item.children) disableChildren(item.children);
                        return true;
                    }
                    if (item.children && findItem(item.children)) return true;
                }
                return false;
            };

            findItem(USER_NAVIGATION);
            return newAccess;
        });
    };

    const saveMenuAccess = async () => {
        try {
            await axios.put(`/api/admin/tenants/${selectedClient.id}/override`, {
                settings: { menu_access: menuAccess }
            });
            toast.success('Menu access updated');
            setShowMenuModal(false);
            fetchClients();
        } catch (error) {
            toast.error('Failed to update menu access');
        }
    };

    const toggleNode = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderMenuTree = (items, level = 0) => {
        return items.map(item => {
            const isExpanded = expandedNodes[item.id];
            const isChecked = menuAccess[item.id] !== false;

            return (
                <div key={item.id} className="select-none">
                    <div
                        className={`flex items-center py-2 px-2 hover:bg-gray-800 rounded transition-colors ${level > 0 ? 'ml-6 border-l border-gray-700' : ''}`}
                    >
                        {item.children ? (
                            <button onClick={() => toggleNode(item.id)} className="p-1 mr-1 text-gray-400 hover:text-white">
                                {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                            </button>
                        ) : <span className="w-6" />}

                        <input
                            type="checkbox"
                            className="h-4 w-4 text-primary border-gray-600 rounded bg-gray-700 focus:ring-primary mr-3"
                            checked={isChecked}
                            onChange={(e) => toggleMenuAccess(item.id, e.target.checked)}
                        />

                        <item.icon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className={`text-sm ${isChecked ? 'text-white' : 'text-gray-500 line-through'}`}>
                            {item.label}
                        </span>
                    </div>

                    {item.children && isExpanded && (
                        <div className="ml-2">
                            {renderMenuTree(item.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // --- Feature Control Logic ---
    const openFeatureModal = (client) => {
        setSelectedClient(client);
        setClientFeatures(client.settings?.features || {});
        setShowFeatureModal(true);
    };

    const toggleFeature = (code, checked) => {
        setClientFeatures(prev => ({ ...prev, [code]: checked }));
    };

    const saveFeatures = async () => {
        try {
            await axios.put(`/api/admin/tenants/${selectedClient.id}/override`, {
                settings: { features: clientFeatures }
            });
            toast.success('Features updated');
            setShowFeatureModal(false);
            fetchClients();
        } catch (error) {
            toast.error('Failed to update features');
        }
    };

    return (
        <Layout>
            <Head>
                <title>Client Management</title>
            </Head>

            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clients</h1>
                    <p className="text-gray-400 mt-1">Manage your clients and their access</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
                <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-[#0d1117]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-[#161B22]">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{client.name}</div>
                                                <div className="text-sm text-gray-500">{client.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-200 border border-blue-800">
                                            {client.subscriptions?.[0]?.plan?.name || 'No Plan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active'
                                            ? 'bg-green-900/30 text-green-200 border border-green-800'
                                            : 'bg-red-900/30 text-red-200 border border-red-800'
                                            }`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button
                                            onClick={() => openFeatureModal(client)}
                                            className="text-gray-400 hover:text-white inline-flex items-center"
                                            title="Manage Features"
                                        >
                                            <CpuChipIcon className="h-4 w-4 mr-1" />
                                            Features
                                        </button>
                                        <button
                                            onClick={() => openMenuModal(client)}
                                            className="text-primary hover:text-primary-hover inline-flex items-center"
                                            title="Manage Menu Access"
                                        >
                                            <ListBulletIcon className="h-4 w-4 mr-1" />
                                            Menu Access
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Menu Access Modal */}
            {showMenuModal && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                Menu Access: <span className="text-primary">{selectedClient.name}</span>
                            </h2>
                            <button onClick={() => setShowMenuModal(false)} className="text-gray-400 hover:text-white">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                {renderMenuTree(USER_NAVIGATION)}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-800 mt-4">
                            <Button variant="ghost" onClick={() => setShowMenuModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveMenuAccess}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Modal */}
            {showFeatureModal && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">
                            Feature Controls: <span className="text-primary">{selectedClient.name}</span>
                        </h2>

                        <div className="space-y-4">
                            {['lms', 'inventory', 'wa_marketing'].map(feature => (
                                <div key={feature} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-gray-700">
                                    <span className="capitalize font-medium text-white">{feature.replace('_', ' ')}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={clientFeatures[feature] !== false} // Default to true if not explicitly false
                                            onChange={(e) => toggleFeature(feature, e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-800 mt-6">
                            <Button variant="ghost" onClick={() => setShowFeatureModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveFeatures}>
                                Save Features
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
