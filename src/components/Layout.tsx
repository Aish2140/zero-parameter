import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Laptop,
  Network,
  AppWindow,
  ShieldCheck,
  Activity,
  ScrollText,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Brain,
  ShieldX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type PageKey =
  | 'dashboard'
  | 'users'
  | 'devices'
  | 'departments'
  | 'applications'
  | 'access-evaluation'
  | 'monitoring'
  | 'logs'
  | 'ai-model';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'User Management', icon: Users, adminOnly: true },
  { key: 'devices', label: 'Device Management', icon: Laptop, adminOnly: true },
  { key: 'departments', label: 'Microsegmentation', icon: Network, adminOnly: true },
  { key: 'applications', label: 'Applications', icon: AppWindow, adminOnly: true },
  { key: 'access-evaluation', label: 'Access Evaluation', icon: ShieldCheck, dividerBefore: true },
  { key: 'monitoring', label: 'Continuous Monitoring', icon: Activity },
  { key: 'logs', label: 'Access Logs', icon: ScrollText },
  { key: 'ai-model', label: 'AI Risk Model', icon: Brain, adminOnly: true, dividerBefore: true },
];

// Pages that require admin role
const ADMIN_ONLY_PAGES: PageKey[] = ['users', 'devices', 'departments', 'applications', 'ai-model'];

interface LayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const visibleNavItems = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);
  const currentLabel = NAV_ITEMS.find((n) => n.key === currentPage)?.label || '';
  const isRestricted = !isAdmin && ADMIN_ONLY_PAGES.includes(currentPage);

  return (
    <div className="min-h-screen flex bg-base-900 grid-bg">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-base-850 border-r border-base-600/50 flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-base-600/50">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <ShieldAlert className="text-accent-400" size={22} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-100 leading-tight">ZeroTrust</h1>
            <p className="text-xs text-gray-500">Microsegmentation Engine</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-3 pb-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isAdmin
                ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                : 'bg-success-500/10 text-success-400 border border-success-500/25'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isAdmin ? 'Admin Access' : 'Employee Access'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <div key={item.key}>
                {item.dividerBefore && (
                  <div className="my-2 border-t border-base-600/40" />
                )}
                <button
                  onClick={() => {
                    onNavigate(item.key);
                    setMobileOpen(false);
                  }}
                  className={`nav-item w-full text-left ${active ? 'nav-item-active' : ''}`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-500 font-medium">
                      ADMIN
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-base-600/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-400">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="nav-item w-full text-left text-danger-400 hover:text-danger-300 hover:bg-danger-500/10"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-base-900/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-8 py-4 bg-base-900/80 backdrop-blur-md border-b border-base-600/50">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-base-700"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-lg font-semibold text-gray-100">{currentLabel}</h2>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-800 border border-base-600/50">
              <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse-glow" />
              <span className="text-xs text-gray-400">System Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {isRestricted ? (
            <AccessDenied onGoHome={() => onNavigate('dashboard')} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function AccessDenied({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mb-6">
        <ShieldX size={40} className="text-danger-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h3>
      <p className="text-gray-400 max-w-sm mb-2">
        You do not have permission to view this page.
      </p>
      <p className="text-sm text-gray-600 mb-8">
        This section requires <span className="text-accent-400 font-medium">Admin</span> privileges.
      </p>
      <button onClick={onGoHome} className="btn-primary flex items-center gap-2">
        <LayoutDashboard size={16} />
        Go to Dashboard
      </button>
    </div>
  );
}
