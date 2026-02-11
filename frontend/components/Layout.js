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

import { USER_NAVIGATION, ADMIN_NAVIGATION } from '../utils/navigationConfig';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const { user, router } = useAuth();

  let navigation = [];

  if (user?.is_super_admin || user?.context?.tenantRole === 'admin') {
    // Super Admin or Client Admin: Use Admin Navigation
    // For client admins, the backend will restrict data access to their client only
    navigation = ADMIN_NAVIGATION;
  } else if (user?.context?.partner) {
    // Partner: Hide or separate logic (Legacy)
    navigation = [];
  } else {
    // Tenant User: Filter based on Role, Features, and Menu Access
    const userRole = user?.context?.tenantRole || 'user';
    const menuAccess = user?.client?.settings?.menu_access || {};
    const features = user?.subscription?.features || [];

    // Recursive helper to filter navigation items
    const filterNavItems = (items) => {
      return items.filter(item => {
        // 1. Check Granular Menu Access (Explicit Disable)
        if (menuAccess[item.id] === false) return false;

        // 2. Check Feature Dependencies (Legacy Feature Flags)
        if (item.id === 'lms' && !features.includes('lms')) return false;
        if (item.id === 'inventory' && (!features.includes('inventory') && !features.includes('catalog'))) return false;
        if (item.id === 'wa_marketing' && (!features.includes('wa_marketing') && !features.includes('campaigns'))) return false;

        // 3. Check Role (Hide Team for non-admins)
        if (item.id === 'team' && (userRole !== 'admin' && userRole !== 'manager')) return false;

        // 4. Process Children recursively
        if (item.children) {
          const filteredChildren = filterNavItems(item.children);
          if (filteredChildren.length === 0) return false; // Hide parent if all children are hidden
          item.children = filteredChildren; // Update children with filtered list (Clone to avoid mutation issues if strict)
          // Note: In React we should not mutate constants. ideally we map.
          // Let's do a map-filter approach below for safety.
          return true;
        }

        return true;
      });
    };

    // Safe Map-Filter implementation to avoid mutating the constant
    const processNavigation = (items) => {
      return items.reduce((acc, item) => {
        // 1. Check Granular Menu Access (Explicit Disable)
        if (menuAccess[item.id] === false) return acc;

        // 2. Check Feature Dependencies
        // LMS
        if (item.id === 'lms' && (!features.includes('lms') && menuAccess[item.id] !== true)) return acc;
        // Inventory
        if (item.id === 'inventory' && (!features.includes('inventory') && !features.includes('catalog') && menuAccess[item.id] !== true)) return acc;
        // WA Marketing
        if (item.id === 'wa_marketing' && (!features.includes('wa_marketing') && !features.includes('campaigns') && menuAccess[item.id] !== true)) return acc;

        // 3. Check Role
        if (item.id === 'team' && (userRole !== 'admin' && userRole !== 'manager')) return acc;

        const newItem = { ...item };

        if (item.children) {
          const processedChildren = processNavigation(item.children);
          if (processedChildren.length === 0) return acc; // Hide parent if no children visible
          newItem.children = processedChildren;
        }

        acc.push(newItem);
        return acc;
      }, []);
    };

    navigation = processNavigation(USER_NAVIGATION);
  }

  // Auto-expand menus that have an active child
  useEffect(() => {
    if (!router || !router.pathname) return;

    const newExpanded = { ...expandedMenus };
    let changed = false;
    navigation.forEach(item => {
      if (item.children?.some(child => router.pathname === child.href)) {
        if (!newExpanded[item.id]) {
          newExpanded[item.id] = true;
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

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const NavItem = ({ item, isCollapsed, isSubItem = false }) => {
    const isActive = router?.pathname === item.href;
    const isChildActive = item.children?.some(child => router?.pathname === child.href);
    const isExpanded = expandedMenus[item.id];

    if (item.children && !isCollapsed) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu(item.id)}
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
              <span className="truncate">{item.label}</span>
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
                <NavItem key={child.id} item={child} isCollapsed={false} isSubItem={true} />
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
        title={isCollapsed ? item.label : ''}
      >
        <item.icon
          className={`
            h-5 w-5 flex-shrink-0 transition-colors duration-200
            ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
            ${isCollapsed ? '' : 'mr-3'}
          `}
        />
        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
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
                <NavItem key={item.id} item={item} isCollapsed={false} />
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
              <NavItem key={item.id} item={item} isCollapsed={isCollapsed} />
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

