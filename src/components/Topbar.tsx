import { Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Security Admin',
  security_analyst: 'Security Analyst',
  manager: 'Manager',
  employee: 'Employee',
};

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, text: 'Critical: 3 PAN numbers blocked in last hour', time: '5m ago', severity: 'critical' as const },
    { id: 2, text: 'New policy "Block GSTIN" activated', time: '1h ago', severity: 'info' as const },
    { id: 3, text: 'Source code leak attempt detected', time: '2h ago', severity: 'high' as const },
    { id: 4, text: 'Weekly report is ready for download', time: '4h ago', severity: 'info' as const },
  ];

  const severityColors: Record<string, string> = {
    critical: 'bg-danger',
    high: 'bg-warning',
    info: 'bg-info',
  };

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  async function handleLogout() {
    setShowUserMenu(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header
      className={`fixed right-0 top-0 z-30 flex h-16 items-center border-b border-divider bg-white/80 backdrop-blur-xl transition-all duration-300 ${
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      <div className="flex w-full items-center justify-between px-6">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Search policies, users, logs..."
            className="w-full rounded-lg border border-border bg-page py-2 pl-10 pr-4 text-sm text-deep placeholder-subtle outline-none transition-all focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="hidden items-center gap-2 rounded-full bg-success-light px-3 py-1.5 md:flex">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Protected</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative rounded-lg p-2 text-muted transition-colors hover:bg-page hover:text-deep"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-dropdown">
                  <div className="border-b border-divider p-4">
                    <h3 className="text-sm font-semibold text-deep">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 border-b border-divider p-4 transition-colors hover:bg-page"
                      >
                        <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${severityColors[n.severity]}`} />
                        <div className="flex-1">
                          <p className="text-xs text-deep">{n.text}</p>
                          <p className="mt-1 text-[10px] text-subtle">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-divider p-3">
                    <button className="w-full rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="hidden h-8 w-px bg-divider md:block" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-page cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-200 text-xs font-bold text-primary-800">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-deep">{user?.name || 'User'}</p>
                <p className="text-[10px] text-muted">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-subtle md:block" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-card shadow-dropdown overflow-hidden">
                  <div className="border-b border-divider px-4 py-3">
                    <p className="text-xs font-semibold text-deep truncate">{user?.name}</p>
                    <p className="text-[10px] text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger transition-colors hover:bg-danger-light"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
