import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Button from '../../../components/ui/Button';
import axios from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { UsersIcon, PlusIcon, ArrowUpTrayIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function WAMarketingContacts() {
    const [contacts, setContacts] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Contact Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingContact, setAddingContact] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', phone: '', tags: '' });

    // Upload CSV
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContacts();
        }, 300); // debounce search
        return () => clearTimeout(timer);
    }, [meta.page, searchTerm]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/wa-marketing/contacts', {
                params: {
                    page: meta.page,
                    limit: 20,
                    search: searchTerm || undefined
                }
            });
            // Handle pagination vs flat list depending on WFB API format
            const data = res.data?.data || {};
            setContacts(data.contacts || (Array.isArray(data) ? data : []));
            setMeta({
                total: data.total || data.length || 0,
                page: data.page || 1,
                pages: data.pages || 1
            });
        } catch (error) {
            console.error('Failed to fetch WA contacts:', error);
            toast.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddingContact(true);
        try {
            // Convert comma-separated tags to array
            const tagsArray = addForm.tags.split(',').map(t => t.trim()).filter(Boolean);
            await axios.post('/api/wa-marketing/contacts', {
                name: addForm.name,
                phone: addForm.phone,
                tags: tagsArray
            });
            toast.success('Contact added successfully');
            setShowAddModal(false);
            setAddForm({ name: '', phone: '', tags: '' });
            fetchContacts();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to add contact';
            toast.error(msg);
        } finally {
            setAddingContact(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contact from WhatsApp marketing?')) return;
        try {
            await axios.delete(`/api/wa-marketing/contacts/${id}`);
            toast.success('Contact deleted');
            setContacts(contacts.filter(c => c._id !== id && c.id !== id));
            setMeta(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
            toast.error('Failed to delete contact');
        }
    };

    const handleFileUploadChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/wa-marketing/contacts/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Successfully uploaded ${res.data?.data?.imported || 'csv'} contacts`);
            setMeta({ ...meta, page: 1 });
            fetchContacts();
        } catch (error) {
            console.error('Upload Error:', error);
            const msg = error.response?.data?.message || 'Failed to upload CSV';
            toast.error(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Layout>
            <Head>
                <title>Audience & Contacts | WA Marketing</title>
            </Head>

            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UsersIcon className="w-8 h-8 text-primary-600" />
                        WhatsApp Audience
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage your synced WhatsApp connections. These are available directly for campaign targeting and flows.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-3">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUploadChange}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        icon={ArrowUpTrayIcon}
                        isLoading={uploading}
                    >
                        Upload CSV
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} icon={PlusIcon}>
                        Add Contact
                    </Button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg px-4 py-5 border border-gray-200 sm:px-6">
                <div className="flex border-b border-gray-200 pb-4 mb-4 gap-4 items-center">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by phone or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading && contacts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-12">
                            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new contact or uploading a CSV.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tags
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {contacts.map((contact) => (
                                    <tr key={contact._id || contact.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{contact.name || 'Unnamed'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {contact.phone || contact.number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-1 flex-wrap">
                                                {(contact.tags || []).map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {(!contact.tags || contact.tags.length === 0) && (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(contact._id || contact.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors"
                                                title="Delete Contact"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination (if applicable) */}
                {meta.pages > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{meta.page}</span> of <span className="font-medium">{meta.pages}</span> ({meta.total} total)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={meta.page <= 1}
                                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={meta.page >= meta.pages}
                                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleAddSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                        Add WhatsApp Contact
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                value={addForm.name}
                                                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number (with Country Code) *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 919876543210"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                                                value={addForm.phone}
                                                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                                            <input
                                                type="text"
                                                placeholder="VIP, FollowUp"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                value={addForm.tags}
                                                onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <Button type="submit" isLoading={addingContact} className="w-full sm:ml-3 sm:w-auto">
                                        Add Contact
                                    </Button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
