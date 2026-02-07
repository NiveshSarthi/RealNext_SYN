import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { quickRepliesAPI } from '../../../utils/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

export default function QuickRepliesList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchReplies();
    }
  }, [user, authLoading]);

  const fetchReplies = async () => {
    try {
      const res = await quickRepliesAPI.getReplies();
      const data = res.data;
      setReplies(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      await quickRepliesAPI.deleteReply(id);
      setReplies(replies.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete reply');
    }
  };

  const filteredReplies = filter === 'all'
    ? replies
    : replies.filter(r => r.category === filter);

  const categories = ['all', ...new Set(replies.map(r => r.category))];

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in content-container pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-white">Quick Replies</h1>
            <p className="mt-1 text-sm text-gray-400">Manage pre-defined message templates for faster responses.</p>
          </div>
          <button
            onClick={() => router.push('/quick-replies/new')}
            className="btn btn-primary bg-primary text-black font-bold px-5 py-2.5 rounded-lg flex items-center hover:bg-orange-600 transition-all shadow-glow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Reply
          </button>
        </div>

        {/* Filter Tabs */}
        {replies.length > 0 && (
          <div className="border-b border-white/10">
            <nav className="-mb-px flex space-x-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`${filter === cat
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* List */}
        <div className="bg-[#161B22] border border-white/5 rounded-xl shadow-soft overflow-hidden">
          <ul className="divide-y divide-white/5">
            {filteredReplies.length === 0 ? (
              <li className="p-12 text-center">
                <div className="bg-black/30 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-white font-medium mb-1">No quick replies found</h3>
                <p className="text-gray-500 text-sm">Create one to ge started!</p>
              </li>
            ) : (
              filteredReplies.map((reply) => (
                <li key={reply.id} className="hover:bg-white/5 transition-colors duration-150">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-lg font-bold text-white font-display truncate">{reply.title}</p>
                          <div className="flex-shrink-0 ml-2">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded bg-primary/10 text-primary border border-primary/20 capitalize">
                              {reply.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 truncate mb-2 flex items-center">
                          <ChatBubbleLeftRightIcon className="inline h-4 w-4 mr-2 text-gray-500" />
                          {reply.replyText || reply.reply_text}
                        </div>
                        <div className="flex items-center">
                          <div className="bg-black/40 rounded px-2 py-1 border border-white/5 flex items-center">
                            <BoltIcon className="h-3 w-3 text-yellow-500 mr-1" />
                            <code className="text-xs text-gray-300 font-mono">/{reply.action}</code>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/quick-replies/${reply.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}