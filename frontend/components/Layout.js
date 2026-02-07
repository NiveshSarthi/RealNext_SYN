import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ChatBubbleBottomCenterTextIcon,
  BoltIcon,
  QueueListIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const userNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  {
    name: 'LMS',
    icon: AcademicCapIcon,
    children: [
      { name: 'Leads', href: '/wa-marketing/leads', icon: UsersIcon },
      { name: 'LMS', href: '/lms', icon: AcademicCapIcon },
      { name: 'Network', href: '/network', icon: UserGroupIcon },
    ]
  },
  {
    name: 'WA Marketing',
    icon: ChatBubbleLeftRightIcon,
    children: [
      { name: 'Campaigns', href: '/wa-marketing/campaigns', icon: ChatBubbleLeftRightIcon },
      { name: 'Flows', href: '/wa-marketing/flows', icon: BoltIcon },
      { name: 'Templates', href: '/wa-marketing/templates', icon: DocumentTextIcon },
      { name: 'Quick Replies', href: '/wa-marketing/quick-replies', icon: ChatBubbleBottomCenterTextIcon },
      { name: 'Meta Ads', href: '/wa-marketing/meta-ads', icon: MegaphoneIcon },
    ]
  },
  {
    name: 'Inventory',
    icon: ShoppingBagIcon,
    children: [
      { name: 'Catalog', href: '/inventory', icon: ShoppingBagIcon },
    ]
  },
  { name: 'Drip Matrix', href: '/drip-sequences', icon: QueueListIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  {
    name: 'Team',
    icon: UserGroupIcon,
    children: [
      { name: 'Members', href: '/team', icon: UsersIcon },
      { name: 'Roles', href: '/team/roles', icon: Cog6ToothIcon },
    ]
  },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const adminNavigation = [
  { name: 'Overview', href: '/admin', icon: HomeIcon },
  { name: 'Partners', href: '/admin/partners', icon: UserGroupIcon },
  { name: 'Plans', href: '/admin/plans', icon: CreditCardIcon },
  { name: 'Tenants', href: '/admin/tenants', icon: BuildingStorefrontIcon },
  { name: 'Features', href: '/admin/features', icon: BoltIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

const partnerNavigation = [
  { name: 'Dashboard', href: '/partner', icon: HomeIcon },
  { name: 'Tenants', href: '/partner/tenants', icon: BuildingStorefrontIcon },
  { name: 'Analytics', href: '/partner/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/partner/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const { user, router } = useAuth();

  let navigation = userNavigation; // Default for Tenant Users

  if (user?.is_super_admin) {
    navigation = adminNavigation;
  } else if (user?.context?.partner) {
    navigation = partnerNavigation;
  } else {
    // For tenant users, filter navigation based on role and features
    const userRole = user?.context?.tenantRole || 'user';

    // Feature Check Helper
    const hasFeature = (featureCode) => {
      if (!user?.context?.features) return true; // Allow access if features not configured
      return user.context.features.includes(featureCode);
    };

    // Filter by Role
    let filteredNav = userNavigation;
    if (userRole !== 'admin' && userRole !== 'manager') {
      filteredNav = filteredNav.filter(item => item.name !== 'Team');
    }

    // Filter by Features
    navigation = filteredNav.filter(item => {
      if (item.name === 'LMS') return hasFeature('lms');
      if (item.name === 'Inventory') return hasFeature('inventory') || hasFeature('catalog');
      if (item.name === 'WA Marketing') return hasFeature('wa_marketing') || hasFeature('campaigns'); // Fallback to campaigns if main flag missing
      return true;
    });
  }

  // Auto-expand menus that have an active child
  useEffect(() => {
    if (!router || !router.pathname) return;

    const newExpanded = { ...expandedMenus };
    let changed = false;
    navigation.forEach(item => {
      if (item.children?.some(child => router.pathname === child.href)) {
        if (!newExpanded[item.name]) {
          newExpanded[item.name] = true;
          changed = true;
        }
      }
    });
    if (changed) {
      setExpandedMenus(newExpanded);
    }
  }, [router?.pathname]);

  // Handle screen resize to auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(false); // Mobile handles visibility via sidebarOpen
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const NavItem = ({ item, isCollapsed, isSubItem = false }) => {
    const isActive = router?.pathname === item.href;
    const isChildActive = item.children?.some(child => router?.pathname === child.href);
    const isExpanded = expandedMenus[item.name];

    if (item.children && !isCollapsed) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`
              w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
              ${isChildActive
                ? 'bg-primary/5 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            <div className="flex items-center">
              <item.icon
                className={`
                  h-5 w-5 flex-shrink-0 transition-colors duration-200 mr-3
                  ${isChildActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                `}
              />
              <span className="truncate">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="pl-10 space-y-1">
              {item.children.map((child) => (
                <NavItem key={child.name} item={child} isCollapsed={false} isSubItem={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className={`
          group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
          ${isActive
            ? 'bg-primary/10 text-primary shadow-[0_0_10px_rgba(249,115,22,0.1)] border border-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
          }
          ${isCollapsed ? 'justify-center' : ''}
          ${isSubItem ? 'py-2 opacity-80 hover:opacity-100' : ''}
        `}
        title={isCollapsed ? item.name : ''}
      >
        <item.icon
          className={`
            h-5 w-5 flex-shrink-0 transition-colors duration-200
            ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
            ${isCollapsed ? '' : 'mr-3'}
          `}
        />
        {!isCollapsed && (
          <span className="truncate">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-bold font-display tracking-tight text-white flex items-center">
                RealNex<span className="text-4xl text-primary -ml-0.5">T</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase -mt-1 ml-0.5">By Syndicate</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} isCollapsed={false} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`
          hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-border bg-card transition-all duration-300 ease-in-out z-30
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-border/50 bg-card/50 backdrop-blur-md">
          {!isCollapsed ? (
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold font-display tracking-tight text-white animate-fade-in truncate flex items-center">
                RealNex<span className="text-3xl text-primary -ml-0.5">T</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase -mt-1 ml-0.5 animate-fade-in">By Syndicate</span>
            </div>
          ) : (
            <span className="text-xl font-bold font-display text-primary mx-auto">R</span>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide py-4">
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} isCollapsed={isCollapsed} />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 p-4 border-t border-border/50 bg-card/50 backdrop-blur-md">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <div className="flex items-center w-full">
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">Collapse Sidebar</span>
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Topbar */}
        <div className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-background/80 backdrop-blur-md border-b border-border shadow-soft">
          <button
            type="button"
            className="px-4 border-r border-border text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Search or Page Title could go here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Profile Dropdown could go here */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-bold shadow-glow">
                JD
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

