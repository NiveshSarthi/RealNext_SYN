import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Button from '../../../components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const SYSTEM_PERMISSIONS = [
    { id: 'view:clients', label: 'View Clients' },
    { id: 'manage:clients', label: 'Manage Clients (Create, Update)' },
    { id: 'manage:client_features', label: 'Manage Client Features & Menus' },
    { id: 'view:analytics', label: 'View Analytics' },
    { id: 'manage:plans', label: 'Manage Plans' },
    { id: 'manage:settings', label: 'Manage Global Settings' },
];

export default function AdminRoles() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await axios.get('/api/admin/roles');
            setRoles(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load roles');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await axios.put(`/api/admin/roles/${editingRole.id}`, formData);
                toast.success('Role updated successfully');
            } else {
                await axios.post('/api/admin/roles', formData);
                toast.success('Role created successfully');
            }
            setShowModal(false);
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save role');
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || []
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/admin/roles/${id}`);
            toast.success('Role deleted');
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: perms };
        });
    };

    return (
        <Layout>
            <Head>
                <title>Role Management - Super Admin</title>
            </Head>

            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Roles</h1>
                    <p className="text-gray-400 mt-1">Define roles and permissions for your team</p>
                </div>
                <Button onClick={() => {
                    setEditingRole(null);
                    setFormData({ name: '', description: '', permissions: [] });
                    setShowModal(true);
                }}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Role
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-[#161B22] border border-gray-800 rounded-lg p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-medium text-white">{role.name}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(role)} className="text-gray-400 hover:text-white transition-colors">
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{role.description}</p>

                            <div className="mt-auto">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions.length > 0 ? (
                                        role.permissions.slice(0, 3).map(p => (
                                            <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                                {p}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-600 italic">No permissions</span>
                                    )}
                                    {role.permissions.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-500 border border-gray-700">
                                            +{role.permissions.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Role Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Permissions</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SYSTEM_PERMISSIONS.map((perm) => (
                                        <label key={perm.id} className="flex items-start p-3 bg-[#0d1117] border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-primary border-gray-600 rounded focus:ring-primary bg-gray-800"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <span className="font-medium text-white block">{perm.label}</span>
                                                <span className="text-gray-500 text-xs">{perm.id}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
