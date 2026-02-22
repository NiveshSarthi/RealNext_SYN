import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { templatesAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

const templateTypes = [
  { id: 'text', name: 'Text Message', icon: ChatBubbleLeftRightIcon },
  { id: 'image', name: 'Image Message', icon: PhotoIcon },
  { id: 'document', name: 'Document Message', icon: DocumentTextIcon },
];

const categories = [
  'marketing', 'utility', 'authentication', 'transactional'
];

const languages = [
  { code: 'en_US', name: 'English (US)' },
  { code: 'es_ES', name: 'Spanish (Spain)' },
  { code: 'fr_FR', name: 'French (France)' },
  { code: 'de_DE', name: 'German (Germany)' },
  { code: 'it_IT', name: 'Italian (Italy)' },
  { code: 'pt_BR', name: 'Portuguese (Brazil)' },
  { code: 'hi_IN', name: 'Hindi (India)' },
];

export default function NewTemplate() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    category: 'marketing',
    language: 'en_US',
    content: '',
    header: '',
    footer: '',
    variables: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Construct components array as required by API
      const components = [];

      // Header (optional)
      if (formData.header) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: formData.header
        });
      }

      // Body (required)
      components.push({
        type: 'BODY',
        text: formData.content
      });

      // Footer (optional)
      if (formData.footer) {
        components.push({
          type: 'FOOTER',
          text: formData.footer
        });
      }

      await templatesAPI.createTemplate({
        name: formData.name,
        category: formData.category.toUpperCase(), // Ensure uppercase
        language: formData.language, // e.g. 'en_US' if needed, or 'en'
        components: components
      });

      toast.success('Template created successfully!');
      router.push('/templates');
    } catch (error) {
      console.error('Create template error:', error);
      toast.error(error.response?.data?.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content) => {
    // Extract variables like {{name}}, {{1}}, {{2}} etc.
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    setFormData(prev => ({
      ...prev,
      content,
      variables
    }));
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-card hover:bg-card/80 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Template</h1>
            <p className="text-gray-400 mt-1">Design a WhatsApp message template for your campaigns</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-primary" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setFormData(prev => ({ ...prev, name: val }));
                  }}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., welcome_message"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Only lowercase letters, numbers, and underscores are allowed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-background">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-background">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Template Type */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Template Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templateTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.type === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <type.icon className={`h-8 w-8 mx-auto mb-2 ${formData.type === type.id ? 'text-primary' : 'text-gray-400'
                    }`} />
                  <div className="text-sm font-medium text-white">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
              Message Content
            </h2>

            <div className="space-y-6">
              {/* Header */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Header (Optional)
                </label>
                <input
                  type="text"
                  value={formData.header}
                  onChange={(e) => setFormData(prev => ({ ...prev, header: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Welcome to our service!"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message Body *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Enter your message content. Use {{variable}} for dynamic content."
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use {'{{variable}}'} syntax for dynamic content. Variables found: {formData.variables.join(', ')}
                </p>
              </div>

              {/* Footer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Footer (Optional)
                </label>
                <input
                  type="text"
                  value={formData.footer}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Reply STOP to unsubscribe"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Preview</h2>

            <div className="bg-[#0E1117] border border-border rounded-lg p-4 max-w-sm mx-auto">
              <div className="space-y-2">
                {formData.header && (
                  <div className="text-white font-medium">{formData.header}</div>
                )}
                <div className="text-white whitespace-pre-wrap">{formData.content}</div>
                {formData.footer && (
                  <div className="text-gray-400 text-sm">{formData.footer}</div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4" />
                  Create Template
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}