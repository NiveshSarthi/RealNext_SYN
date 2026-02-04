import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { paymentsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  CreditCardIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PlanCard = ({ plan, currentPlan, onSelect }) => {
  const isCurrent = currentPlan === plan.tier;
  return (
    <div className={`card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
      {isCurrent && (
        <div className="absolute top-0 right-0 p-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Current Plan
          </span>
        </div>
      )}
      <div className="card-content p-6 flex flex-col h-full">
        <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mb-6">Perfect for scaling your business</p>

        <div className="mb-6">
          {plan.price_monthly ? (
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold text-foreground">₹{plan.price_monthly.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-foreground">Contact Sales</span>
          )}
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          {(Array.isArray(plan.features)
            ? plan.features
            : typeof plan.features === 'object' && plan.features !== null
              ? Object.entries(plan.features).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
              : []
          ).map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrent ? (
          <button
            disabled
            className="btn w-full bg-muted text-muted-foreground cursor-not-allowed"
          >
            Current Plan
          </button>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className="btn btn-primary w-full shadow-md hover:shadow-lg"
          >
            {currentPlan ? 'Upgrade' : 'Subscribe Now'}
          </button>
        )}
      </div>
    </div>
  );
};

const PaymentRow = ({ payment, onDownloadInvoice }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getStatusIcon(payment.status)}
          <div className="ml-4">
            <div className="text-sm font-medium text-foreground capitalize">
              {payment.payment_type}
            </div>
            <div className="text-xs text-muted-foreground">
              {payment.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
        ₹{payment.amount.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
        {payment.gateway}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
        {new Date(payment.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {payment.status === 'completed' && (
          <button
            onClick={() => onDownloadInvoice(payment)}
            className="text-primary hover:text-primary-focus transition-colors"
            title="Download Invoice"
          >
            <DocumentTextIcon className="h-5 w-5" />
          </button>
        )}
      </td>
    </tr>
  );
};

export default function Payments() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      fetchPlans();
      fetchPayments();
      fetchStats();
      fetchSubscription();
    }
  }, [user, authLoading]);

  const fetchPlans = async () => {
    try {
      const response = await paymentsAPI.getPlans();
      setPlans(response.data.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentsAPI.getHistory();
      setPayments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await paymentsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await paymentsAPI.getCurrentSubscription();
      if (response.data.data) {
        setCurrentPlan(response.data.data.plan_tier);
      }
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
    }
  };

  const handlePlanSelect = async (plan) => {
    try {
      const response = await paymentsAPI.createSubscription({
        planId: plan.id,
        gateway: 'razorpay'
      });

      if (response.data.success) {
        toast.success('Subscription created! Redirecting to payment...');
        console.log('Payment order created:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription');
    }
  };

  const handleDownloadInvoice = async (payment) => {
    try {
      const response = await paymentsAPI.getInvoice(payment.id);
      toast.success('Invoice downloaded successfully');
      console.log('Invoice data:', response.data.data);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted"></div>
            <div className="absolute top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in container-custom py-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments & Billing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your subscription and payment history
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-50 rounded-xl">
                    <CurrencyRupeeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Total Revenue
                      </dt>
                      <dd className="text-xl font-bold text-foreground mt-1">
                        ₹{stats.total_amount?.toLocaleString() || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-50 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Completed Payments
                      </dt>
                      <dd className="text-xl font-bold text-foreground mt-1">
                        {stats.completed_payments || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-yellow-50 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Pending Payments
                      </dt>
                      <dd className="text-xl font-bold text-foreground mt-1">
                        {stats.pending_payments || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-xl">
                    <ArrowPathIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Avg Payment Amount
                      </dt>
                      <dd className="text-xl font-bold text-foreground mt-1">
                        ₹{stats.avg_payment_amount ? Math.round(stats.avg_payment_amount).toLocaleString() : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'plans', name: 'Subscription Plans' },
              { id: 'history', name: 'Payment History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'plans' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">Choose the right plan for you</h2>
                <p className="mt-2 text-muted-foreground">Unlock advanced features and scale your business</p>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    currentPlan={currentPlan}
                    onSelect={handlePlanSelect}
                  />
                ))}
              </div>

              {/* Current Subscription Info */}
              {currentPlan && (
                <div className="mt-12 bg-muted/30 border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Current Subscription Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-background rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Active Plan</p>
                      <p className="text-xl font-bold text-primary">
                        {plans.find(p => p.tier === currentPlan)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                      <p className="text-xl font-bold text-foreground">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in">
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground">
                          PAYMENT
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground">
                          STATUS
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground">
                          AMOUNT
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground">
                          GATEWAY
                        </th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground">
                          DATE
                        </th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-muted-foreground">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border/50">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="text-center">
                              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                                <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <h3 className="text-sm font-medium text-foreground">No payments found</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Your payment history will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <PaymentRow
                            key={payment.id}
                            payment={payment}
                            onDownloadInvoice={handleDownloadInvoice}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}