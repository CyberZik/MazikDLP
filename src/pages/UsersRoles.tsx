import { useState, useMemo, Fragment, useEffect } from 'react';
import {
  Users, Shield, UserPlus, Search, Filter, ChevronDown, ChevronRight,
  MoreVertical, Mail, Calendar, Activity, AlertTriangle, Check, X,
  Eye, Edit2, Trash2, Lock, Unlock, Copy, Download, RefreshCw,
  Building2, UserCheck, UserX, Clock, ShieldCheck, ShieldAlert,
  Smartphone, Globe, KeyRound, Settings, ChevronUp, Send,
} from 'lucide-react';
import {
  roles as allRoles,
  teamsList,
  invitations as allInvitations,
  permissionCategories,
  type User,
  type Role,
  type Team,
  type Invitation,
} from '../data/usersData';
import { users as usersApi, logs as logsApi } from '../lib/api';
import type { User as ApiUser, AuditLogEntry } from '../lib/api';

function apiToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2),
    role: u.role as User['role'],
    department: u.department ?? '',
    team: u.team ?? '',
    status: u.status as User['status'],
    lastActive: u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never',
    joinDate: u.created_at?.split('T')[0] ?? '',
    promptsTotal: 0,
    promptsBlocked: 0,
    promptsMasked: 0,
    riskScore: 0,
    aiAppsUsed: [],
    violations: 0,
    mfaEnabled: u.mfa_enabled,
    extensionInstalled: u.extension_installed,
    extensionVersion: u.extension_version ?? '',
    policyGroupIds: [],
  };
}

type Tab = 'users' | 'roles' | 'teams' | 'invitations';
type UserView = 'list' | 'detail';

const roleColors: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  security_analyst: 'bg-amber-50 text-amber-700 border-amber-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  auditor: 'bg-purple-50 text-purple-700 border-purple-200',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  security_analyst: 'Security Analyst',
  manager: 'Manager',
  employee: 'Employee',
  auditor: 'Auditor',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
};

const statusDots: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  suspended: 'bg-red-500',
  pending: 'bg-amber-500',
};

function riskColor(score: number) {
  if (score >= 75) return 'text-red-600';
  if (score >= 50) return 'text-amber-600';
  if (score >= 25) return 'text-blue-600';
  return 'text-emerald-600';
}

function riskBg(score: number) {
  if (score >= 75) return 'bg-red-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 25) return 'bg-blue-500';
  return 'bg-emerald-500';
}

function riskLabel(score: number) {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

export function UsersRoles() {
  const [tab, setTab] = useState<Tab>('users');
  const [userView, setUserView] = useState<UserView>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'prompts' | 'violations'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee', department: '', team: '' });
  const [addUserError, setAddUserError] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [userDetailTab, setUserDetailTab] = useState<'overview' | 'activity' | 'security'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [userLogs, setUserLogs] = useState<AuditLogEntry[]>([]);
  const [userLogsLoading, setUserLogsLoading] = useState(false);

  useEffect(() => {
    usersApi.list({ per_page: 100 }).then((r) => {
      if (r.data.length > 0) {
        setUsers(r.data.map(apiToUser));
      } else {
        setUsers([]);
      }
    }).catch(() => {
      setUsers([]);
    });
  }, []);
  const [invitations] = useState<Invitation[]>(allInvitations);
  const [roles] = useState<Role[]>(allRoles);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const perPage = 12;

  const departments = useMemo(() => [...new Set(users.map(u => u.department))], [users]);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    if (filterRole !== 'all') result = result.filter(u => u.role === filterRole);
    if (filterStatus !== 'all') result = result.filter(u => u.status === filterStatus);
    if (filterDept !== 'all') result = result.filter(u => u.department === filterDept);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'risk') cmp = a.riskScore - b.riskScore;
      else if (sortBy === 'prompts') cmp = a.promptsTotal - b.promptsTotal;
      else if (sortBy === 'violations') cmp = a.violations - b.violations;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [users, search, filterRole, filterStatus, filterDept, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pending: users.filter(u => u.status === 'pending').length,
    mfaEnabled: users.filter(u => u.mfaEnabled).length,
    extInstalled: users.filter(u => u.extensionInstalled).length,
    highRisk: users.filter(u => u.riskScore >= 70).length,
    avgRisk: Math.round(users.reduce((s, u) => s + u.riskScore, 0) / users.length),
  }), [users]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const DEPARTMENTS = ['Engineering', 'Finance', 'Marketing', 'HR', 'Legal', 'Product', 'Sales', 'Operations', 'Security', 'Executive'];

  const handleAddUser = async () => {
    setAddUserError('');
    const { firstName, lastName, email, password, role, department, team } = newUser;
    if (!firstName.trim() || !email.trim() || !password.trim()) {
      setAddUserError('First name, email and password are required.');
      return;
    }
    setAddUserLoading(true);
    try {
      const created = await usersApi.create({
        email,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        password,
        role,
        department: department || undefined,
        team: team || undefined,
      });
      setUsers(prev => [apiToUser(created), ...prev]);
      setShowAddUser(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'employee', department: '', team: '' });
    } catch (e: unknown) {
      setAddUserError(e instanceof Error ? e.message : 'Failed to create user.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronDown className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'users', label: 'All Users', icon: <Users className="h-4 w-4" />, count: users.length },
    { key: 'roles', label: 'Roles & Permissions', icon: <Shield className="h-4 w-4" />, count: roles.length },
    { key: 'teams', label: 'Teams', icon: <Building2 className="h-4 w-4" />, count: teamsList.length },
    { key: 'invitations', label: 'Invitations', icon: <Mail className="h-4 w-4" />, count: invitations.filter(i => i.status === 'pending').length },
  ];

  // --- User Detail View ---
  if (userView === 'detail' && selectedUser) {
    return (
      <div className="space-y-6">
        {/* Back */}
        <button onClick={() => { setUserView('list'); setSelectedUser(null); }} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Users
        </button>

        {/* Header Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 text-primary text-2xl font-bold ring-2 ring-primary-200">
              {selectedUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-deep">{selectedUser.name}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[selectedUser.role]}`}>
                  <Shield className="h-3 w-3" /> {roleLabels[selectedUser.role]}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedUser.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDots[selectedUser.status]}`} /> {selectedUser.status}
                </span>
              </div>
              <p className="text-sm text-muted">{selectedUser.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {selectedUser.department}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selectedUser.team}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {selectedUser.joinDate}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last active {selectedUser.lastActive}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              {selectedUser.status === 'active' ? (
                <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Suspend
                </button>
              ) : (
                <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
                  <Unlock className="h-3.5 w-3.5" /> Activate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(['overview', 'activity', 'security'] as const).map(t => (
            <button key={t} onClick={() => {
              setUserDetailTab(t);
              if (t === 'activity' && selectedUser) {
                setUserLogsLoading(true);
                logsApi.list({ user_id: selectedUser.id, per_page: 50 })
                  .then(r => setUserLogs(r.data))
                  .catch(() => setUserLogs([]))
                  .finally(() => setUserLogsLoading(false));
              }
            }}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${userDetailTab === t ? 'text-primary' : 'text-muted hover:text-deep'}`}>
              {t}
              {userDetailTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {userDetailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Prompts', value: selectedUser.promptsTotal.toLocaleString(), icon: <Activity className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
                  { label: 'Blocked', value: selectedUser.promptsBlocked.toLocaleString(), icon: <ShieldAlert className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
                  { label: 'Masked', value: selectedUser.promptsMasked.toLocaleString(), icon: <ShieldCheck className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Violations', value: selectedUser.violations.toString(), icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${s.color} mb-2`}>
                      {s.icon}
                    </div>
                    <p className="text-xl font-bold text-deep">{s.value}</p>
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Apps Used */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3">AI Applications Used</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.aiAppsUsed.map(app => (
                    <span key={app} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary border border-primary-200">
                      <Globe className="h-3 w-3" /> {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Prompt scanned', platform: 'ChatGPT', result: 'Allowed', time: '2 min ago', color: 'bg-emerald-500' },
                    { action: 'Sensitive data masked', platform: 'Claude', result: 'Masked', time: '15 min ago', color: 'bg-amber-500' },
                    { action: 'PAN number detected', platform: 'ChatGPT', result: 'Blocked', time: '1 hr ago', color: 'bg-red-500' },
                    { action: 'Prompt scanned', platform: 'Gemini', result: 'Allowed', time: '2 hrs ago', color: 'bg-emerald-500' },
                    { action: 'Source code detected', platform: 'GitHub Copilot', result: 'Masked', time: '3 hrs ago', color: 'bg-amber-500' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-deep font-medium">{a.action}</p>
                        <p className="text-xs text-muted">{a.platform} · {a.time}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.result === 'Blocked' ? 'bg-red-50 text-red-600' :
                        a.result === 'Masked' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>{a.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Profile & Risk */}
            <div className="space-y-6">
              {/* Risk Score */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-4">Risk Assessment</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={selectedUser.riskScore >= 75 ? '#EF4444' : selectedUser.riskScore >= 50 ? '#F59E0B' : selectedUser.riskScore >= 25 ? '#3B82F6' : '#10B981'}
                        strokeWidth="10" strokeDasharray={`${selectedUser.riskScore * 3.14} 314`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${riskColor(selectedUser.riskScore)}`}>{selectedUser.riskScore}</span>
                      <span className="text-xs text-muted">/ 100</span>
                    </div>
                  </div>
                  <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedUser.riskScore >= 75 ? 'bg-red-50 text-red-600' :
                    selectedUser.riskScore >= 50 ? 'bg-amber-50 text-amber-600' :
                    selectedUser.riskScore >= 25 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <AlertTriangle className="h-3 w-3" /> {riskLabel(selectedUser.riskScore)} Risk
                  </span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3">Profile Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'User ID', value: selectedUser.id },
                    { label: 'Department', value: selectedUser.department },
                    { label: 'Team', value: selectedUser.team },
                    { label: 'Join Date', value: selectedUser.joinDate },
                    { label: 'Last Active', value: selectedUser.lastActive },
                    { label: 'Policy Group', value: selectedUser.policyGroupIds[0] },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{d.label}</span>
                      <span className="text-deep font-medium text-right">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {userDetailTab === 'activity' && (
          <div className="space-y-6">
            {userLogsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted text-sm">Loading activity…</div>
            ) : userLogs.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-deep">No activity found</p>
                <p className="text-xs text-muted mt-1">This user hasn't submitted any prompts yet.</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Scans', value: userLogs.length, color: 'text-primary' },
                    { label: 'Blocked', value: userLogs.filter(l => l.decision === 'hard_block' || l.decision === 'soft_block').length, color: 'text-red-600' },
                    { label: 'Masked', value: userLogs.filter(l => l.decision === 'mask').length, color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-soft">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent log entries */}
                <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-deep">Recent Prompts ({userLogs.length})</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {userLogs.slice(0, 20).map(log => (
                      <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          log.decision === 'hard_block' ? 'bg-red-500' :
                          log.decision === 'soft_block' ? 'bg-orange-500' :
                          log.decision === 'mask' ? 'bg-amber-500' :
                          log.decision === 'alert' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-deep">{log.platform || 'Unknown'}</span>
                            {log.entities_detected?.length > 0 && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                                {log.entities_detected.length} entities
                              </span>
                            )}
                            {log.policy_name && (
                              <span className="text-[10px] bg-primary-50 text-primary px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                {log.policy_name}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted mt-0.5">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          log.decision === 'hard_block' ? 'bg-red-50 text-red-600' :
                          log.decision === 'soft_block' ? 'bg-orange-50 text-orange-600' :
                          log.decision === 'mask' ? 'bg-amber-50 text-amber-600' :
                          log.decision === 'alert' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-600'
                        }`}>{log.decision || 'allow'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Security Tab */}
        {userDetailTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Security Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Multi-Factor Auth', enabled: selectedUser.mfaEnabled, icon: <KeyRound className="h-4 w-4" /> },
                  { label: 'Browser Extension', enabled: selectedUser.extensionInstalled, icon: <Smartphone className="h-4 w-4" /> },
                  { label: 'Email Verified', enabled: true, icon: <Mail className="h-4 w-4" /> },
                  { label: 'Password Strength', enabled: true, icon: <Lock className="h-4 w-4" /> },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {s.icon}
                    </div>
                    <span className="flex-1 text-sm text-deep">{s.label}</span>
                    {s.enabled ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> Enabled</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-500"><X className="h-3.5 w-3.5" /> Disabled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Extension Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Installed', value: selectedUser.extensionInstalled ? 'Yes' : 'No' },
                  { label: 'Version', value: selectedUser.extensionVersion },
                  { label: 'Latest Version', value: '2.4.1' },
                  { label: 'Auto-Update', value: 'Enabled' },
                  { label: 'Last Check-in', value: selectedUser.lastActive },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-divider last:border-0">
                    <span className="text-muted">{d.label}</span>
                    <span className="text-deep font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
              {selectedUser.extensionVersion !== '2.4.1' && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Update Available</p>
                    <p className="text-xs text-amber-600 mt-0.5">Extension v2.4.1 is available. Current: {selectedUser.extensionVersion}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Recent Security Events</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Event</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Platform</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Entity</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Action</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { event: 'PAN Number Detected', platform: 'ChatGPT', entity: 'IN_PAN', action: 'Blocked', time: '1 hour ago' },
                      { event: 'Email Address Found', platform: 'Claude', entity: 'EMAIL', action: 'Masked', time: '3 hours ago' },
                      { event: 'Source Code Paste', platform: 'ChatGPT', entity: 'SOURCE_CODE', action: 'Blocked', time: '5 hours ago' },
                      { event: 'Phone Number Detected', platform: 'Gemini', entity: 'PHONE', action: 'Masked', time: 'Yesterday' },
                      { event: 'API Key Detected', platform: 'ChatGPT', entity: 'API_KEY', action: 'Blocked', time: 'Yesterday' },
                    ].map((e, i) => (
                      <tr key={i} className="border-b border-divider last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-deep">{e.event}</td>
                        <td className="py-2.5 px-3 text-muted">{e.platform}</td>
                        <td className="py-2.5 px-3"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-deep">{e.entity}</span></td>
                        <td className="py-2.5 px-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.action === 'Blocked' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{e.action}</span>
                        </td>
                        <td className="py-2.5 px-3 text-muted text-xs">{e.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Role Detail View ---
  if (selectedRole) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedRole(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Roles
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: `${selectedRole.color}15`, color: selectedRole.color }}>
              <Shield className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-deep">{selectedRole.displayName}</h1>
                {selectedRole.isSystem && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted font-medium">System Role</span>}
              </div>
              <p className="text-sm text-muted mt-1">{selectedRole.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selectedRole.userCount} users</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {selectedRole.createdAt}</span>
              </div>
            </div>
            <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit Role
            </button>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-deep mb-5">Permissions</h2>
          <div className="space-y-6">
            {permissionCategories.map(cat => {
              const rolePerms = selectedRole.permissions.filter(p => p.category === cat.name);
              return (
                <div key={cat.name}>
                  <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rolePerms.map(p => (
                      <div key={p.id} className={`rounded-lg border p-3 flex items-start gap-3 ${p.granted ? 'border-emerald-200 bg-emerald-50/50' : 'border-divider bg-gray-50/50'}`}>
                        <div className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${p.granted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {p.granted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${p.granted ? 'text-deep' : 'text-muted'}`}>{p.name}</p>
                          <p className="text-xs text-muted mt-0.5">{p.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users in Role */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-deep mb-4">Users with this Role ({users.filter(u => u.role === selectedRole.name).length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.filter(u => u.role === selectedRole.name).slice(0, 9).map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedRole(null); setSelectedUser(u); setUserView('detail'); setTab('users'); }}>
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary text-xs font-bold flex items-center justify-center">{u.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep truncate">{u.name}</p>
                  <p className="text-xs text-muted truncate">{u.department}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${statusDots[u.status]}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Team Detail View ---
  if (selectedTeam) {
    const teamMembers = users.filter(u => u.team === selectedTeam.name.split(' ').pop() || u.department === selectedTeam.department).slice(0, selectedTeam.memberCount);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTeam(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Teams
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-deep">{selectedTeam.name}</h1>
              <p className="text-sm text-muted">{selectedTeam.department} Department</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selectedTeam.memberCount} members ({selectedTeam.activeMembers} active)</span>
                <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Lead: {selectedTeam.lead}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Prompts', value: selectedTeam.totalPrompts.toLocaleString(), icon: <Activity className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
            { label: 'Blocked', value: selectedTeam.blockedPrompts.toLocaleString(), icon: <ShieldAlert className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
            { label: 'Risk Score', value: selectedTeam.riskScore.toString(), icon: <AlertTriangle className="h-4 w-4" />, color: `${riskColor(selectedTeam.riskScore)} ${selectedTeam.riskScore >= 50 ? 'bg-amber-50' : 'bg-emerald-50'}` },
            { label: 'Active Policies', value: selectedTeam.policies.length.toString(), icon: <Shield className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-xl font-bold text-deep">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Assigned Policies */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-deep mb-3">Assigned Policies</h3>
          <div className="flex flex-wrap gap-2">
            {selectedTeam.policies.map(p => (
              <span key={p} className="rounded-lg bg-primary-50 border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary">{p}</span>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-deep mb-4">Team Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamMembers.map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 cursor-pointer transition-colors"
                onClick={() => { setSelectedTeam(null); setSelectedUser(u); setUserView('detail'); setTab('users'); }}>
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary text-xs font-bold flex items-center justify-center">{u.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep truncate">{u.name}</p>
                  <p className="text-xs text-muted">{roleLabels[u.role]}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${statusDots[u.status]}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===================== MAIN VIEW =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep">Users & Access Management</h1>
          <p className="text-sm text-muted mt-1">Manage users, roles, teams, and access control across your organization</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-deep shadow-soft hover:bg-gray-50 transition-colors">
            <Send className="h-4 w-4" /> Invite
          </button>
          <button onClick={() => setShowAddUser(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary-dark transition-colors">
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Users', value: stats.total, icon: <Users className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'Active', value: stats.active, icon: <UserCheck className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, icon: <UserX className="h-4 w-4" />, color: 'text-gray-500 bg-gray-100' },
          { label: 'Suspended', value: stats.suspended, icon: <Lock className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
          { label: 'Pending', value: stats.pending, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'MFA Enabled', value: stats.mfaEnabled, icon: <KeyRound className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Extension', value: stats.extInstalled, icon: <Smartphone className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'High Risk', value: stats.highRisk, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 shadow-soft text-center">
            <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${s.color} mb-1.5`}>{s.icon}</div>
            <p className="text-lg font-bold text-deep">{s.value}</p>
            <p className="text-[10px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.key ? 'text-primary' : 'text-muted hover:text-deep'}`}>
            {t.icon} {t.label}
            {t.count > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === t.key ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-muted'}`}>{t.count}</span>}
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* ===================== USERS TAB ===================== */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, email, department, team..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-soft transition-colors ${showFilters ? 'border-primary bg-primary-50 text-primary' : 'border-border bg-card text-muted hover:bg-gray-50'}`}>
              <Filter className="h-4 w-4" /> Filters
              {(filterRole !== 'all' || filterStatus !== 'all' || filterDept !== 'all') && (
                <span className="h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {[filterRole, filterStatus, filterDept].filter(f => f !== 'all').length}
                </span>
              )}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted shadow-soft hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-muted mb-1">Role</label>
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="security_analyst">Security Analyst</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-muted mb-1">Status</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-muted mb-1">Department</label>
                <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={() => { setFilterRole('all'); setFilterStatus('all'); setFilterDept('all'); setPage(1); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('name')}>
                        User <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Role</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Department</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('risk')}>
                        Risk <SortIcon col="risk" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('prompts')}>
                        Prompts <SortIcon col="prompts" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('violations')}>
                        Violations <SortIcon col="violations" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Security</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u.id} className="border-b border-divider last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedUser(u); setUserView('detail'); setUserDetailTab('overview'); setUserLogs([]); }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{u.avatar}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-deep truncate">{u.name}</p>
                            <p className="text-xs text-muted truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleColors[u.role]}`}>
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-sm text-deep">{u.department}</p>
                          <p className="text-xs text-muted">{u.team}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[u.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDots[u.status]}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-gray-100">
                            <div className={`h-full rounded-full ${riskBg(u.riskScore)}`} style={{ width: `${u.riskScore}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${riskColor(u.riskScore)}`}>{u.riskScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-deep">{u.promptsTotal.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`text-sm font-medium ${u.violations > 15 ? 'text-red-600' : u.violations > 5 ? 'text-amber-600' : 'text-deep'}`}>
                          {u.violations}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-5 w-5 rounded flex items-center justify-center ${u.mfaEnabled ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-300'}`} title={u.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}>
                            <KeyRound className="h-3 w-3" />
                          </div>
                          <div className={`h-5 w-5 rounded flex items-center justify-center ${u.extensionInstalled ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-300'}`} title={u.extensionInstalled ? 'Extension Installed' : 'No Extension'}>
                            <Smartphone className="h-3 w-3" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenu === u.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
                                {[
                                  { icon: <Eye className="h-3.5 w-3.5" />, label: 'View Profile', action: () => { setSelectedUser(u); setUserView('detail'); setActionMenu(null); }, danger: false },
                                  { icon: <Edit2 className="h-3.5 w-3.5" />, label: 'Edit User', action: () => setActionMenu(null), danger: false },
                                  { icon: <Copy className="h-3.5 w-3.5" />, label: 'Copy Email', action: () => { navigator.clipboard.writeText(u.email); setActionMenu(null); }, danger: false },
                                  { icon: <Shield className="h-3.5 w-3.5" />, label: 'Change Role', action: () => setActionMenu(null), danger: false },
                                  { icon: u.status === 'active' ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />, label: u.status === 'active' ? 'Suspend User' : 'Activate User', action: () => setActionMenu(null), danger: false },
                                  { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Remove User', action: () => setActionMenu(null), danger: true },
                                ].map((a, i) => (
                                  <button key={i} onClick={a.action}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${a.danger ? 'text-red-600 hover:bg-red-50' : 'text-deep hover:bg-gray-50'} transition-colors`}>
                                    {a.icon} {a.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
                <p className="text-xs text-muted">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'text-muted border border-border hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== ROLES TAB ===================== */}
      {tab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{roles.length} roles configured</p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary-dark transition-colors">
              <Shield className="h-4 w-4" /> Create Role
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {roles.map(role => {
              const grantedCount = role.permissions.filter(p => p.granted).length;
              const totalPerms = role.permissions.length;
              return (
                <div key={role.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => setSelectedRole(role)}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}15`, color: role.color }}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-deep">{role.displayName}</h3>
                        {role.isSystem && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-muted font-medium">System</span>}
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{role.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Users className="h-3.5 w-3.5" /> {role.userCount} users
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <ShieldCheck className="h-3.5 w-3.5" /> {grantedCount}/{totalPerms} permissions
                        </div>
                      </div>
                      {/* Permission bar */}
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(grantedCount / totalPerms) * 100}%`, backgroundColor: role.color }} />
                        </div>
                      </div>
                      {/* Permission category badges */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {permissionCategories.map(cat => {
                          const catPerms = role.permissions.filter(p => p.category === cat.name);
                          const catGranted = catPerms.filter(p => p.granted).length;
                          if (catGranted === 0) return null;
                          return (
                            <span key={cat.name} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                              {cat.name} ({catGranted}/{catPerms.length})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permission Matrix */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-base font-semibold text-deep mb-4">Permission Comparison Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Permission</th>
                    {roles.map(r => (
                      <th key={r.id} className="text-center py-2.5 px-3 text-xs font-semibold" style={{ color: r.color }}>{r.displayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionCategories.map(cat => (
                    <Fragment key={cat.name}>
                      <tr>
                        <td colSpan={roles.length + 1} className="py-2 px-3 text-xs font-bold text-deep bg-gray-50">{cat.name}</td>
                      </tr>
                      {cat.permissions.map(perm => (
                        <tr key={perm.id} className="border-b border-divider last:border-0">
                          <td className="py-2 px-3 text-xs text-muted">{perm.name}</td>
                          {roles.map(r => {
                            const rp = r.permissions.find(p => p.id === perm.id);
                            return (
                              <td key={r.id} className="text-center py-2 px-3">
                                {rp?.granted ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <Check className="h-3 w-3" />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                                    <X className="h-3 w-3" />
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TEAMS TAB ===================== */}
      {tab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{teamsList.length} teams across the organization</p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary-dark transition-colors">
              <Building2 className="h-4 w-4" /> Create Team
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {teamsList.map(team => (
              <div key={team.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
                onClick={() => setSelectedTeam(team)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-deep">{team.name}</h3>
                      <p className="text-xs text-muted">{team.department} · Led by {team.lead}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Members', value: team.memberCount },
                    { label: 'Prompts', value: team.totalPrompts.toLocaleString() },
                    { label: 'Blocked', value: team.blockedPrompts.toLocaleString() },
                    { label: 'Risk', value: team.riskScore },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-sm font-bold ${i === 3 ? riskColor(Number(s.value)) : 'text-deep'}`}>{s.value}</p>
                      <p className="text-[10px] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Risk Bar */}
                <div className="mb-3">
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${riskBg(team.riskScore)}`} style={{ width: `${team.riskScore}%` }} />
                  </div>
                </div>

                {/* Policies */}
                <div className="flex flex-wrap gap-1">
                  {team.policies.map(p => (
                    <span key={p} className="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary-100">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Department Summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-base font-semibold text-deep mb-4">Department Overview</h3>
            <div className="space-y-3">
              {Array.from(new Set(teamsList.map(t => t.department))).map(dept => {
                const deptTeams = teamsList.filter(t => t.department === dept);
                const totalMembers = deptTeams.reduce((s, t) => s + t.memberCount, 0);
                const totalPrompts = deptTeams.reduce((s, t) => s + t.totalPrompts, 0);
                const totalBlocked = deptTeams.reduce((s, t) => s + t.blockedPrompts, 0);
                const avgRisk = Math.round(deptTeams.reduce((s, t) => s + t.riskScore, 0) / deptTeams.length);
                return (
                  <div key={dept} className="flex items-center gap-4 rounded-lg border border-divider p-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 text-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-deep">{dept}</p>
                      <p className="text-xs text-muted">{deptTeams.length} teams · {totalMembers} members</p>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-sm font-semibold text-deep">{totalPrompts.toLocaleString()}</p>
                        <p className="text-[10px] text-muted">Prompts</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-600">{totalBlocked.toLocaleString()}</p>
                        <p className="text-[10px] text-muted">Blocked</p>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${riskColor(avgRisk)}`}>{avgRisk}</p>
                        <p className="text-[10px] text-muted">Avg Risk</p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${riskBg(avgRisk)}`} style={{ width: `${avgRisk}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== INVITATIONS TAB ===================== */}
      {tab === 'invitations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{invitations.filter(i => i.status === 'pending').length} pending invitations</p>
            <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary-dark transition-colors">
              <Send className="h-4 w-4" /> Send Invitation
            </button>
          </div>

          {/* Pending */}
          <div>
            <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Invitations
            </h3>
            <div className="space-y-3">
              {invitations.filter(i => i.status === 'pending').map(inv => (
                <div key={inv.id} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-deep">{inv.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${roleColors[inv.role] || 'bg-gray-100 text-muted border-gray-200'}`}>
                          {roleLabels[inv.role] || inv.role}
                        </span>
                        <span>·</span>
                        <span>{inv.team}</span>
                        <span>·</span>
                        <span>Invited by {inv.invitedBy}</span>
                        <span>·</span>
                        <span>Expires {inv.expiresAt}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Resend
                      </button>
                      <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1">
                        <X className="h-3 w-3" /> Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved */}
          <div>
            <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" /> Resolved Invitations
            </h3>
            <div className="space-y-3">
              {invitations.filter(i => i.status !== 'pending').map(inv => (
                <div key={inv.id} className={`rounded-xl border p-4 shadow-soft ${inv.status === 'accepted' ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                      {inv.status === 'accepted' ? <UserCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-deep">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                          {inv.status}
                        </span>
                        <span>· {inv.team} · Invited {inv.invitedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD USER MODAL ===================== */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Add New User</h2>
              <button onClick={() => setShowAddUser(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">First Name *</label>
                  <input type="text" placeholder="e.g. Arjun" value={newUser.firstName} onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Last Name</label>
                  <input type="text" placeholder="e.g. Sharma" value={newUser.lastName} onChange={e => setNewUser(p => ({ ...p, lastName: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email Address *</label>
                <input type="email" placeholder="user@company.com" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Temporary Password *</label>
                <input type="password" placeholder="Min. 8 characters" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="security_analyst">Security Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Department</label>
                  <select value={newUser.department} onChange={e => setNewUser(p => ({ ...p, department: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Team (optional)</label>
                <input type="text" placeholder="e.g. Backend, Growth" value={newUser.team} onChange={e => setNewUser(p => ({ ...p, team: e.target.value }))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              {addUserError && <p className="text-xs text-danger bg-danger-light rounded-lg px-3 py-2">{addUserError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => { setShowAddUser(false); setAddUserError(''); }} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAddUser} disabled={addUserLoading} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-60">
                {addUserLoading ? 'Creating…' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== INVITE MODAL ===================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Send Invitation</h2>
              <button onClick={() => setShowInviteModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email Addresses</label>
                <textarea placeholder={"Enter email addresses (one per line)\nuser1@maziktech.com\nuser2@maziktech.com"}
                  rows={3} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                <p className="text-xs text-muted mt-1">Separate multiple emails with new lines</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Role</label>
                  <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Employee</option>
                    <option>Manager</option>
                    <option>Security Analyst</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Team</label>
                  <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {teamsList.map(t => <option key={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Personal Message (optional)</label>
                <textarea placeholder="Add a message to include in the invitation email..."
                  rows={2} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
              <div className="rounded-lg border border-divider p-3 bg-gray-50">
                <div className="flex items-start gap-2">
                  <Settings className="h-4 w-4 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-deep">Invitation expires in 7 days</p>
                    <p className="text-xs text-muted">Recipients must accept before the link expires</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowInviteModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowInviteModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
