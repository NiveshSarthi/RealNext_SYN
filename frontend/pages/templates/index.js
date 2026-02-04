import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { templatesAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TemplateCard = ({ template, onEdit, onDelete, onPreview, onUse }) => (
  <div className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
          <DocumentTextIcon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
            {template.name}
          </h3>
          <p className="text-sm text-gray-400 capitalize">{template.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {template.is_system && (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            System
          </span>
        )}
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${template.status === 'APPROVED'
          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
          }`}>
          {template.status || 'PENDING'}
        </span>
      </div>
    </div>

    <div className="mb-4">
      <p className="text-sm text-gray-300 line-clamp-3">
        {(() => {
          let contentStr = '';
          if (Array.isArray(template.components)) {
            const bodyComponent = template.components.find(c => c.type === 'BODY');
            contentStr = bodyComponent?.text || '';
          } else if (typeof template.content === 'string') {
            contentStr = template.content;
          }
          return contentStr.length > 150 ? contentStr.substring(0, 150) + '...' : contentStr;
        })()}
      </p>
    </div>

    {template.components && template.components.some(c => c.text?.includes('{{')) && (
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Placeholders Detected</p>
        <div className="flex flex-wrap gap-2">
          {template.components.flatMap(c => c.text?.match(/{{(\d+)}}/g) || []).map((placeholder) => (
            <span
              key={placeholder}
              className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {placeholder}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Language: <span className="text-white font-medium">{template.language}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPreview(template)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-gray-300 bg-muted hover:bg-muted/80 border border-border/50 hover:border-border transition-all"
        >
          <EyeIcon className="h-4 w-4 mr-1.5" />
          Preview
        </button>
        <button
          onClick={() => onDelete(template)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all"
        >
          <TrashIcon className="h-4 w-4 mr-1.5" />
          Delete
        </button>
        <button
          onClick={() => onUse(template)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-black bg-primary hover:bg-primary/90 transition-all shadow-glow-sm"
        >
          Use Template
        </button>
      </div>
    </div>
  </div>
);

const TemplatePreviewModal = ({ template, isOpen, onClose }) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>

        <div className="inline-block align-bottom bg-card border border-border rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-card px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {template.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {Array.isArray(template.components)
                  ? template.components.map((c, i) => (
                    <div key={i} className="mb-2">
                      <span className="text-xs text-primary uppercase font-bold">{c.type}:</span>
                      <p>{c.text}</p>
                    </div>
                  ))
                  : (template.content?.body || JSON.stringify(template.content, null, 2))}
              </div>
            </div>
          </div>
          <div className="bg-muted/20 px-6 py-4 flex justify-end border-t border-border/50">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 transition-all shadow-glow-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchTemplates();
    }
  }, [user, authLoading, searchTerm, categoryFilter]);

  const fetchTemplates = async () => {
    try {
      const params = {
        search: searchTerm,
        category: categoryFilter
      };

      console.log('Fetching templates with params:', params);
      const response = await templatesAPI.getTemplates(params);
      console.log('Templates Response:', response);
      const data = response.data;
      setTemplates(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates details: ' + (error.message || 'Unknown error'));
    } finally {
      console.log('Fetch finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await templatesAPI.deleteTemplate(template.name);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template) => {
    router.push(`/templates/${template.id}/edit`);
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleUse = (template) => {
    const contentStr = typeof template.content === 'string'
      ? template.content
      : (template.content?.body || JSON.stringify(template.content));

    navigator.clipboard.writeText(contentStr).then(() => {
      toast.success('Template content copied to clipboard!');
      router.push('/campaigns/new');
    }).catch(() => {
      toast.error('Failed to copy template content');
    });
  };

  const categories = [
    'general',
    'greeting',
    'follow_up',
    'closing',
    'property_info',
    'negotiation'
  ];

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Message templates</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create and manage your WhatsApp message templates
            </p>
          </div>
          <button
            onClick={() => router.push('/templates/new')}
            className="inline-flex items-center px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all shadow-glow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search templates..."
                className="block w-full pl-10 pr-3 py-2.5 bg-muted border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="block w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={fetchTemplates}
                className="inline-flex items-center px-4 py-2.5 bg-muted border border-border text-white font-medium rounded-lg hover:bg-muted/80 hover:border-border/80 transition-all text-sm"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-6">
          {templates.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
              <p className="text-gray-400 mb-6">
                Get started by creating your first message template.
              </p>
              <button
                onClick={() => router.push('/templates/new')}
                className="inline-flex items-center px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-all shadow-glow-sm"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Template
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
                onUse={handleUse}
              />
            ))
          )}
        </div>

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewTemplate(null);
          }}
        />
      </div>
    </Layout>
  );
}