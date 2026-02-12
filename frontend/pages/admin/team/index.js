import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Button from '../../../components/ui/Button';
import { PlusIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import axios from '../../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminTeam() {
    const [team, setTeam] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', system_role_id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teamRes, rolesRes] = await Promise.all([
                axios.get('/api/admin/team'),
                axios.get('/api/admin/roles')
            ]);
            setTeam(teamRes.data.data);
            setRoles(rolesRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            toast.error('Failed to load team data');
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/team/invite', inviteData);
            toast.success('Team member invited successfully');
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', system_role_id: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to invite member:', error);
            toast.error(error.response?.data?.message || 'Failed to invite member');
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        try {
            await axios.delete(`/api/admin/team/${id}`);
            toast.success('Team member removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    return (
        <Layout>
            <Head>
                <title>Team Management - Super Admin</title>
            </Head>

            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Management</h1>
                    <p className="text-gray-400 mt-1">Manage your internal super admin team</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Invite Member
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {team.map((member) => (
                        <div key={member.id} className="bg-[#161B22] border border-gray-800 rounded-lg p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-white">{member.name}</h3>
                                        <p className="text-sm text-gray-400">{member.email}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    {/* Badge */}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.is_super_admin
                                        ? 'bg-purple-900/50 text-purple-200 border border-purple-700'
                                        : 'bg-blue-900/50 text-blue-200 border border-blue-700'
                                        }`}>
                                        {member.is_super_admin ? 'Root Admin' : member.systemRole?.name || 'No Role'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex justify-end border-t border-gray-800">
                                {!member.is_super_admin && (
                                    <button
                                        onClick={() => handleRemove(member.id)}
                                        className="text-sm text-red-400 hover:text-red-300 flex items-center transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Remove Access
                                    </button>
                                )}
                                {member.is_super_admin && (
                                    <span className="text-xs text-gray-500 italic">Cannot remove root admin</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Invite Team Member</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        value={inviteData.system_role_id}
                                        onChange={(e) => setInviteData({ ...inviteData, system_role_id: e.target.value })}
                                    >
                                        <option value="">Select a role</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <Button variant="ghost" onClick={() => setShowInviteModal(false)} type="button">
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Send Invite
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
