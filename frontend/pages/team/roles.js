import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ShieldCheckIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function RoleManagement() {
    const router = useRouter();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: []
    });

    // Check user permissions
    useEffect(() => {
        const checkAccess = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const userRole = user?.context?.tenantRole;

                    // Only admin and manager can access role management
                    if (userRole !== 'admin' && userRole !== 'manager') {
                        toast.error('You do not have permission to access this page');
                        router.push('/analytics');
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        };

        checkAccess();
    }, [router]);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/api/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.data.tenant_roles || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/api/roles/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPermissions(response.data.data.grouped || {});
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            if (editingRole) {
                await axios.patch(`${API_URL}/api/roles/${editingRole.id}`, roleForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Role updated successfully!');
            } else {
                await axios.post(`${API_URL}/api/roles`, roleForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Role created successfully!');
            }
            setShowCreateModal(false);
            setEditingRole(null);
            setRoleForm({ name: '', description: '', permissions: [] });
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save role');
        }
    };

    const handleDeleteRole = async (roleId, roleName) => {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_URL}/api/roles/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRoles();
            toast.success('Role deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete role');
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description,
            permissions: role.permissions || []
        });
        setShowCreateModal(true);
    };

    const togglePermission = (permCode) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permCode)
                ? prev.permissions.filter(p => p !== permCode)
                : [...prev.permissions, permCode]
        }));
    };

    const selectAllInCategory = (category) => {
        const categoryPerms = permissions[category].map(p => p.code);
        const allSelected = categoryPerms.every(code => roleForm.permissions.includes(code));

        if (allSelected) {
            setRoleForm(prev => ({
                ...prev,
                permissions: prev.permissions.filter(p => !categoryPerms.includes(p))
            }));
        } else {
            setRoleForm(prev => ({
                ...prev,
                permissions: [...new Set([...prev.permissions, ...categoryPerms])]
            }));
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in content-container">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <ShieldCheckIcon className="w-8 h-8 text-primary" />
                            Role Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-400">
                            Create and manage custom roles with specific permissions
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingRole(null);
                            setRoleForm({ name: '', description: '', permissions: [] });
                            setShowCreateModal(true);
                        }}
                        variant="primary"
                        className="shadow-glow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Role
                    </Button>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.length === 0 ? (
                        <div className="col-span-full">
                            <div className="text-center py-20 bg-card/30 border border-white/5 rounded-2xl border-dashed">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheckIcon className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-medium text-white">No custom roles yet</h3>
                                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                    Create your first custom role to manage team permissions effectively.
                                </p>
                                <div className="mt-8">
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        variant="primary"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Create First Role
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        roles.map((role) => (
                            <div key={role.id} className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 shadow-soft group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-1">{role.name}</h3>
                                        {role.is_system && (
                                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                                System Role
                                            </span>
                                        )}
                                    </div>
                                    {!role.is_system && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditRole(role)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Edit role"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRole(role.id, role.name)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Delete role"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {role.description || 'No description provided'}
                                </p>
                                <div className="border-t border-border/50 pt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-400">Permissions</p>
                                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full border border-primary/20">
                                            {role.permissions?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Role Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-card border border-border/50 rounded-xl shadow-2xl p-8 max-w-4xl w-full my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., Sales Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Brief description of this role..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-4">Permissions</label>
                                <div className="space-y-6 max-h-96 overflow-y-auto bg-[#0E1117] rounded-lg p-4 border border-border/50">
                                    {Object.entries(permissions).map(([category, perms]) => (
                                        <div key={category} className="border-b border-border/50 pb-4 last:border-b-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-white capitalize">{category}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => selectAllInCategory(category)}
                                                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    {perms.every(p => roleForm.permissions.includes(p.code)) ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {perms.map((perm) => (
                                                    <label key={perm.code} className="flex items-center space-x-2 cursor-pointer group">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={roleForm.permissions.includes(perm.code)}
                                                                onChange={() => togglePermission(perm.code)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-5 h-5 border-2 border-border/50 rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                                                {roleForm.permissions.includes(perm.code) && (
                                                                    <CheckIcon className="w-3 h-3 text-black" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                            {perm.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {roleForm.permissions.length} permission{roleForm.permissions.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                >
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
