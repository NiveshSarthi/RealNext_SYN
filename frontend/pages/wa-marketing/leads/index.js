import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { leadsAPI } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/ui/Button';

const LeadRow = ({ lead, onEdit, onDelete, onView }) => (
  <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-sm font-semibold text-primary">
              {lead.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-semibold text-white">{lead.name || 'Unknown'}</div>
          <div className="text-xs text-gray-400 flex items-center mt-1">
            <PhoneIcon className="h-3 w-3 mr-1" />
            {lead.phone}
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${lead.status === 'qualified' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
        lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          lead.status === 'interested' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
            lead.status === 'closed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
              lead.status === 'lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
        {lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'New'}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
      <div className="flex items-center">
        <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-500" />
        {lead.location || 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
      {lead.budget_min ? (
        <div className="flex items-center text-xs">
          <CurrencyRupeeIcon className="h-3 w-3 mr-1 text-gray-500" />
          {lead.budget_min.toLocaleString()} - {lead.budget_max ? lead.budget_max.toLocaleString() : '...'}
        </div>
      ) : (
        <span className="text-gray-500 text-xs">Not set</span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm">
      <div className="flex items-center">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mr-2">
          <div
            className={`h-full rounded-full ${lead.lead_score > 70 ? 'bg-green-500' : lead.lead_score > 40 ? 'bg-orange-500' : 'bg-gray-500'}`}
            style={{ width: `${Math.min(lead.lead_score || 0, 100)}%` }}
          ></div>
        </div>
        <span className="text-xs font-medium text-gray-300">{lead.lead_score || 0}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
      <div className="flex items-center text-xs">
        <CalendarDaysIcon className="h-3 w-3 mr-1.5 opacity-70" />
        {lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : 'Never'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div className="flex items-center justify-end space-x-1">
        <button
          onClick={() => onView(lead)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="View Details"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(lead)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Edit Lead"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(lead)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </td>
  </tr>
);

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchLeads();
    }
  }, [user, authLoading, searchTerm, statusFilter, currentPage]);

  const fetchLeads = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        tag: statusFilter // V1 doc uses 'tag' for filtering
      };

      const response = await leadsAPI.getLeads(params);
      const data = response.data;
      setLeads(data.data || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      // Fallback data for demo if API fails
      setLeads([
        { _id: '1', name: 'Michael Wilson', phone: '910000000025', status: 'new', location: 'Mumbai', budget_min: 5000000, budget_max: 7500000, lead_score: 10, last_contact: null },
        { _id: '2', name: 'Alice Johnson', phone: '910000000024', status: 'qualified', location: 'Bangalore', budget_min: 12000000, budget_max: 15000000, lead_score: 85, last_contact: '2023-10-25' },
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Are you sure you want to delete the lead "${lead.name || lead.phone}"?`)) {
      return;
    }

    try {
      await leadsAPI.deleteLead(lead.id);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleEdit = (lead) => {
    router.push(`/leads/${lead.id}/edit`);
  };

  const handleView = (lead) => {
    router.push(`/leads/${lead.id}`);
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Leads command center</h1>
            <p className="mt-1 text-sm text-gray-400">
              Track, score, and convert your high-value prospects.
            </p>
          </div>
          <Button
            onClick={() => router.push('/leads/new')}
            variant="primary"
            className="shadow-glow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Lead
          </Button>
        </div>

        {/* Filters & Search - Glassmorphic */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search leads by name or phone..."
                className="block w-full pl-10 pr-3 py-2.5 bg-[#0E1117] border border-border/50 rounded-lg leading-5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="block w-full pl-3 pr-10 py-2.5 bg-[#0E1117] border border-border/50 rounded-lg text-gray-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 sm:text-sm appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="interested">Interested</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <FunnelIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex justify-start sm:justify-end">
              <Button
                onClick={fetchLeads}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/50">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    LEAD PROFILE
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    LOCATION
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    BUDGET RANGE
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    AI SCORE
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400">
                    LAST CONTACT
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-[#161B22]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                          <UsersIcon className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white">No leads found</h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                          Get started by adding your first lead to the system.
                        </p>
                        <div className="mt-6">
                          <Button
                            onClick={() => router.push('/leads/new')}
                            variant="primary"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add First Lead
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-card px-4 py-4 flex items-center justify-between border-t border-border/50 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="text-xs"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-border/50 bg-[#0E1117] text-sm font-medium text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-border/50 bg-[#0E1117] text-sm font-medium text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}