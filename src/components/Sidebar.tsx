import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  FileText,
  Users,
  ScrollText,
  BarChart3,
  Settings,
  Globe,
  Search,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  Puzzle,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, group: 'Overview' },
  { path: '/detection', label: 'Detection Engine', icon: Search, group: 'Security' },
  { path: '/policies', label: 'Policies', icon: Shield, group: 'Security' },
  { path: '/ai-apps', label: 'AI Applications', icon: Globe, group: 'Security' },
  { path: '/custom-patterns', label: 'Custom Patterns', icon: Fingerprint, group: 'Security' },
  { path: '/logs', label: 'Activity Logs', icon: ScrollText, group: 'Monitoring' },
  { path: '/users', label: 'Users & Roles', icon: Users, group: 'Management' },
  { path: '/extension', label: 'Browser Extension', icon: Puzzle, group: 'Management' },
  { path: '/reports', label: 'Reports', icon: FileText, group: 'Management' },
  { path: '/settings', label: 'Settings', icon: Settings, group: 'System' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const groups = [...new Set(navItems.map(item => item.group))];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-divider bg-sidebar transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-divider px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-deep">
                Mazik<span className="text-primary">DLP</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
                Enterprise
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
                {group}
              </p>
            )}
            {navItems
              .filter((item) => item.group === group)
              .map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-muted hover:bg-page hover:text-deep'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] flex-shrink-0 ${
                        isActive ? 'text-primary' : 'text-subtle group-hover:text-muted'
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                    {isActive && !collapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-divider p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl bg-primary-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-deep">All Systems Operational</span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Engine v2.4.1 • 34 active policies</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-page hover:text-deep"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
