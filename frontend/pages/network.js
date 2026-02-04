import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { networkAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';

const AgentCard = ({ agent, onConnect, onViewProfile, connectionStatus }) => (
  <div className="bg-[#161B22] border border-white/5 overflow-hidden shadow-soft rounded-xl hover:border-primary/30 transition-all duration-300">
    <div className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary/20 to-orange-600/20 border border-primary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {agent.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-bold text-white font-display">{agent.name}</h3>
          <p className="text-sm text-gray-400">{agent.business_name}</p>
          <p className="text-sm text-gray-500">{agent.location}</p>
          <div className="mt-2 flex items-center">
            <div className="flex items-center text-sm text-gray-400">
              <UserIcon className="h-4 w-4 mr-1 text-primary" />
              {agent.total_deals || 0} deals
            </div>
            <div className="ml-4 flex items-center text-sm text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${agent.trust_score >= 4 ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                agent.trust_score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
              Trust: {agent.trust_score || 0}/5
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500 max-w-[60%] truncate">
          {agent.specializations?.slice(0, 2).map((spec, i) => (
            <span key={i} className="inline-block bg-white/5 rounded px-2 py-0.5 text-xs mr-2 mb-1">{spec}</span>
          ))}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(agent)}
            className="inline-flex items-center px-3 py-1.5 border border-white/10 text-sm leading-4 font-medium rounded-md text-gray-300 bg-black/20 hover:bg-white/5 hover:text-white transition-colors focus:outline-none"
          >
            Profile
          </button>
          {connectionStatus === 'none' && (
            <button
              onClick={() => onConnect(agent)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-black bg-primary hover:bg-orange-600 focus:outline-none shadow-glow-sm transition-all"
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Connect
            </button>
          )}
          {connectionStatus === 'pending' && (
            <span className="inline-flex items-center px-3 py-1 text-sm leading-4 font-medium text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <ClockIcon className="h-4 w-4 mr-1" />
              Pending
            </span>
          )}
          {connectionStatus === 'connected' && (
            <span className="inline-flex items-center px-3 py-1 text-sm leading-4 font-medium text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Connected
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ConnectionRequest = ({ request, onAccept, onReject }) => (
  <div className="bg-[#161B22] border border-white/5 shadow-soft rounded-xl mb-3">
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/20 to-orange-600/20 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {request.requesting_agent_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-bold text-white font-display">
              {request.requesting_agent_name}
            </h3>
            <p className="text-sm text-gray-500">
              {request.business_name} • {request.location}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onAccept(request.connectionId)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-black bg-green-500 hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Accept
          </button>
          <button
            onClick={() => onReject(request.connectionId)}
            className="inline-flex items-center px-3 py-1.5 border border-white/10 text-sm leading-4 font-medium rounded-md text-gray-400 bg-black/20 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all"
          >
            <XCircleIcon className="h-4 w-4 mr-1" />
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function Network() {
  const [activeTab, setActiveTab] = useState('network');
  const [network, setNetwork] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchNetwork();
      fetchRequests();
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchNetwork = async () => {
    try {
      const response = await networkAPI.getNetwork();
      setNetwork(response.data.data);
    } catch (error) {
      console.error('Failed to fetch network:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await networkAPI.getRequests();
      setRequests(response.data.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await networkAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await networkAPI.searchAgents({ q: searchTerm });
      setSearchResults(response.data.data);
      setShowSearch(true);
    } catch (error) {
      console.error('Failed to search agents:', error);
      toast.error('Failed to search agents');
    }
  };

  const handleConnect = async (agent) => {
    try {
      await networkAPI.connect(agent.id, {
        connectionType: 'professional',
        notes: 'Connected via SyndiTech network'
      });
      toast.success('Connection request sent!');
      // Refresh search results to update connection status
      handleSearch();
    } catch (error) {
      console.error('Failed to send connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    try {
      await networkAPI.acceptRequest(connectionId);
      toast.success('Connection request accepted!');
      fetchRequests();
      fetchNetwork();
      fetchStats();
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept connection request');
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      await networkAPI.rejectRequest(connectionId);
      toast.success('Connection request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject connection request');
    }
  };

  const handleViewProfile = (agent) => {
    router.push(`/network/${agent.id}`);
  };

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-white">Agent Network</h1>
            <p className="mt-1 text-sm text-gray-400">
              Connect with other real estate professionals and collaborate.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Connections', value: stats.total_connections || 0, icon: UserGroupIcon },
              { label: 'Collaborations', value: stats.completed_collaborations || 0, icon: null, emoji: '🤝' },
              { label: 'Avg Trust Level', value: `${stats.avg_trust_level ? stats.avg_trust_level.toFixed(1) : 0}/5`, icon: null, emoji: '⭐' },
              { label: 'Pending Requests', value: stats.pending_requests || 0, icon: HandRaisedIcon }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#161B22] border border-white/5 rounded-xl p-5 shadow-soft hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-black/30 rounded-lg text-primary">
                    {stat.icon ? <stat.icon className="h-6 w-6" /> : <span className="text-xl">{stat.emoji}</span>}
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-400 truncate">{stat.label}</dt>
                      <dd className="text-2xl font-bold text-white font-display mt-1">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-white/10">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'network', name: 'My Network', count: network.length },
              { id: 'requests', name: 'Connection Requests', count: requests.length },
              { id: 'discover', name: 'Discover Agents', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'network' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white font-display mb-4">My Network</h2>
              {network.length === 0 ? (
                <div className="text-center py-20 bg-[#161B22]/50 rounded-xl border border-white/5 border-dashed">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-4 text-sm font-medium text-gray-300">No connections yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start building your professional network by discovering agents.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-glow-sm text-sm font-medium rounded-md text-black bg-primary hover:bg-orange-600 focus:outline-none transition-all"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                      Discover Agents
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {network.map((connection) => (
                    <AgentCard
                      key={connection.id}
                      agent={connection}
                      connectionStatus="connected"
                      onConnect={handleConnect}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white font-display mb-4">Connection Requests</h2>
              {requests.length === 0 ? (
                <div className="text-center py-20 bg-[#161B22]/50 rounded-xl border border-white/5 border-dashed">
                  <HandRaisedIcon className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-4 text-sm font-medium text-gray-300">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connection requests from other agents will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <ConnectionRequest
                      key={request.connectionId}
                      request={request}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white font-display mb-4">Discover Agents</h2>

              {/* Search */}
              <div className="mb-8">
                <div className="flex max-w-2xl">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search agents by name, business, or location..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-l-lg leading-5 bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-6 py-2.5 border border-l-0 border-white/10 rounded-r-lg bg-[#161B22] text-gray-300 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {showSearch && (
                <div>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-20 bg-[#161B22]/50 rounded-xl border border-white/5 border-dashed">
                      <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-600" />
                      <h3 className="mt-4 text-sm font-medium text-gray-300">No agents found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search terms.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {searchResults.map((agent) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          connectionStatus="none" // Assume no connection for search results for now
                          onConnect={handleConnect}
                          onViewProfile={handleViewProfile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!showSearch && (
                <div className="text-center py-20 bg-[#161B22]/50 rounded-xl border border-white/5 border-dashed">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-4 text-sm font-medium text-gray-300">Search for agents</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a name, business name, or location to find agents to connect with.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}