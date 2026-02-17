import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    UserGroupIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    EnvelopeIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TeamManagement() {
    const router = useRouter();
    const [teamMembers, setTeamMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        role_id: null,
        department: ''
    });

    // Check user permissions
    useEffect(() => {
        const checkAccess = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const userRole = user?.context?.tenantRole;

                    // Only admin and manager can access team management
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
        fetchTeamMembers();
        fetchRoles();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/api/team`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeamMembers(response.data.data);
        } catch (error) {
            console.error('Error fetching team members:', error);
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/api/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.data.tenant_roles || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(`${API_URL}/api/team/invite`, inviteForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowInviteModal(false);
            setInviteForm({ name: '', email: '', password: '', role: 'user', role_id: null, department: '' });
            fetchTeamMembers();

            // Show appropriate success message
            if (response.data.data.generated_password) {
                toast.success(`Team member created! Password: ${response.data.data.generated_password}`, {
                    duration: 10000, // Show for 10 seconds
                    action: {
                        label: 'Copy',
                        onClick: () => {
                            navigator.clipboard.writeText(response.data.data.generated_password);
                            toast.success('Password copied to clipboard!');
                        }
                    }
                });
            } else {
                toast.success('Team member invited successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to invite member');
        }
    };

    const handleUpdateRole = async (userId, newRoleId) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.patch(`${API_URL}/api/team/${userId}`,
                { role_id: newRoleId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTeamMembers();
            toast.success('Role updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (userId, memberName) => {
        if (!confirm(`Are you sure you want to remove ${memberName}?`)) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_URL}/api/team/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTeamMembers();
            toast.success('Member removed successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
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
                            <UserGroupIcon className="w-8 h-8 text-primary" />
                            Team Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-400">
                            Manage your team members and their roles
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowInviteModal(true)}
                        variant="primary"
                        className="shadow-glow-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Invite Member
                    </Button>
                </div>

                {/* Team Members Table */}
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border/50">
                            <thead className="bg-[#0E1117]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {teamMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <UserGroupIcon className="h-12 w-12 text-gray-600 mb-3" />
                                                <p className="text-gray-400">No team members yet</p>
                                                <p className="text-sm text-gray-500 mt-1">Invite your first team member to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    teamMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white flex items-center gap-2">
                                                            {member.name}
                                                            {member.is_owner && (
                                                                <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
                                                                    Owner
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-400 flex items-center gap-1">
                                                            <EnvelopeIcon className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {member.is_owner ? (
                                                    <span className="text-sm text-white font-medium">Owner</span>
                                                ) : (
                                                    <select
                                                        value={member.role_id || ''}
                                                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value || null)}
                                                        className="text-sm bg-[#161B22] border border-border/50 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                                    >
                                                        <option value="">Select Role</option>
                                                        {roles.map((role) => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-400 flex items-center gap-1">
                                                    {member.department ? (
                                                        <>
                                                            <BriefcaseIcon className="h-3 w-3" />
                                                            {member.department}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${member.status === 'active'
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {new Date(member.joined_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!member.is_owner && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id, member.name)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border/50 rounded-xl shadow-2xl p-8 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Invite Team Member</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="john@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={inviteForm.password}
                                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Leave empty for auto-generated password"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {inviteForm.password
                                        ? "Custom password will be set for the user"
                                        : "If left empty, a temporary password will be generated and shown to you"
                                    }
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                                <select
                                    value={inviteForm.role_id || ''}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role_id: e.target.value || null })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Select Role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Department (Optional)</label>
                                <input
                                    type="text"
                                    value={inviteForm.department}
                                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#161B22] border border-border/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Sales, Marketing, etc."
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
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
                                    {inviteForm.password ? 'Create Member' : 'Generate & Show Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
