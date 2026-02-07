import { useState, useEffect } from 'react';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { quickRepliesAPI } from '../../../../utils/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditQuickReply() {
    const { user } = useAuth();
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        category: 'greeting',
        action: '',
        replyText: '',
        displayOrder: 0
    });

    useEffect(() => {
        if (id && user) {
            fetchReply();
        }
    }, [id, user]);

    const fetchReply = async () => {
        try {
            const res = await quickRepliesAPI.getReply(id);
            const reply = res.data.data || res.data; // Handle potential wrapper differences

            setFormData({
                title: reply.title,
                category: reply.category,
                action: reply.action,
                replyText: reply.replyText || reply.reply_text, // Fallback if snake_case leaks
                displayOrder: reply.displayOrder || reply.display_order || 0
            });
        } catch (error) {
            console.error('Fetch failed:', error);
            alert('Failed to load quick reply');
            router.push('/quick-replies');
        } finally {
            setDataLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await quickRepliesAPI.updateReply(id, formData);
            router.push('/quick-replies');
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update quick reply');
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <Layout>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Quick Reply</h1>
                </div>

                <div className="bg-white shadow sm:rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Welcome Message"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="greeting">Greeting</option>
                                <option value="property">Property</option>
                                <option value="schedule">Schedule</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Action / ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Shortcut / Action ID
                                <span className="ml-1 text-xs text-gray-400 font-normal">(Used for internal mapping, e.g. /welcome)</span>
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    /
                                </span>
                                <input
                                    type="text"
                                    name="action"
                                    required
                                    value={formData.action}
                                    onChange={handleChange}
                                    placeholder="welcome"
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border"
                                />
                            </div>
                        </div>

                        {/* Reply Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message Text</label>
                            <textarea
                                name="replyText"
                                required
                                rows={4}
                                value={formData.replyText}
                                onChange={handleChange}
                                placeholder="Enter the message content..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        {/* Display Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Order</label>
                            <input
                                type="number"
                                name="displayOrder"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>


                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Update Reply'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
