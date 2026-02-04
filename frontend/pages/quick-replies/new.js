import { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { quickRepliesAPI } from '../../utils/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewQuickReply() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'greeting',
        action: '',
        replyText: '',
        displayOrder: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await quickRepliesAPI.createReply(formData);
            router.push('/quick-replies');
        } catch (error) {
            console.error('Create failed:', error);
            alert('Failed to create quick reply');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in content-container pb-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold font-display text-white">New Quick Reply</h1>
                </div>

                <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Welcome Message"
                                className="block w-full rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-white/10 bg-black/30 text-white focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            >
                                <option value="greeting">Greeting</option>
                                <option value="property">Property</option>
                                <option value="schedule">Schedule</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Action / ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Shortcut / Action ID
                                <span className="ml-2 text-xs text-gray-500 font-normal">(Used for internal mapping, e.g. /welcome)</span>
                            </label>
                            <div className="flex rounded-lg shadow-sm">
                                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-white/10 bg-white/5 text-gray-400 sm:text-sm">
                                    /
                                </span>
                                <input
                                    type="text"
                                    name="action"
                                    required
                                    value={formData.action}
                                    onChange={handleChange}
                                    placeholder="welcome"
                                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-lg border border-white/10 bg-black/30 text-white placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                />
                            </div>
                        </div>

                        {/* Reply Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Message Text</label>
                            <textarea
                                name="replyText"
                                required
                                rows={6}
                                value={formData.replyText}
                                onChange={handleChange}
                                placeholder="Enter the message content..."
                                className="block w-full rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            />
                        </div>

                        {/* Display Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Order</label>
                            <input
                                type="number"
                                name="displayOrder"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                className="block w-32 rounded-lg border border-white/10 bg-black/30 text-white focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm p-3 transition-colors"
                            />
                        </div>


                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-5 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 border border-transparent rounded-lg shadow-glow-sm text-sm font-bold text-black bg-primary hover:bg-orange-600 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? 'Saving...' : 'Create Reply'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
