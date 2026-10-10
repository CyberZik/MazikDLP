export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'security_analyst' | 'manager' | 'employee';
  department: string;
  team: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastActive: string;
  joinDate: string;
  promptsTotal: number;
  promptsBlocked: number;
  promptsMasked: number;
  riskScore: number;
  aiAppsUsed: string[];
  violations: number;
  mfaEnabled: boolean;
  extensionInstalled: boolean;
  extensionVersion: string;
  policyGroupIds: string[];
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  userCount: number;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  granted: boolean;
}

export interface Team {
  id: string;
  name: string;
  department: string;
  lead: string;
  leadEmail: string;
  memberCount: number;
  activeMembers: number;
  riskScore: number;
  totalPrompts: number;
  blockedPrompts: number;
  policies: string[];
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  team: string;
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
}

export const permissionCategories = [
  {
    name: 'Dashboard',
    permissions: [
      { id: 'dash_view', name: 'View Dashboard', description: 'Access main dashboard overview', category: 'Dashboard', granted: true },
      { id: 'dash_analytics', name: 'View Analytics', description: 'Access analytics and reports', category: 'Dashboard', granted: true },
    ]
  },
  {
    name: 'Policies',
    permissions: [
      { id: 'pol_view', name: 'View Policies', description: 'View security policies', category: 'Policies', granted: true },
      { id: 'pol_create', name: 'Create Policies', description: 'Create new security policies', category: 'Policies', granted: false },
      { id: 'pol_edit', name: 'Edit Policies', description: 'Modify existing policies', category: 'Policies', granted: false },
      { id: 'pol_delete', name: 'Delete Policies', description: 'Remove security policies', category: 'Policies', granted: false },
    ]
  },
  {
    name: 'Detection',
    permissions: [
      { id: 'det_view', name: 'View Detection Config', description: 'View detection module settings', category: 'Detection', granted: true },
      { id: 'det_configure', name: 'Configure Detection', description: 'Modify detection engine settings', category: 'Detection', granted: false },
      { id: 'det_patterns', name: 'Manage Patterns', description: 'Add/edit detection patterns', category: 'Detection', granted: false },
    ]
  },
  {
    name: 'Users',
    permissions: [
      { id: 'usr_view', name: 'View Users', description: 'View user list and profiles', category: 'Users', granted: true },
      { id: 'usr_manage', name: 'Manage Users', description: 'Add, edit, suspend users', category: 'Users', granted: false },
      { id: 'usr_roles', name: 'Manage Roles', description: 'Configure roles and permissions', category: 'Users', granted: false },
      { id: 'usr_invite', name: 'Invite Users', description: 'Send user invitations', category: 'Users', granted: false },
    ]
  },
  {
    name: 'AI Apps',
    permissions: [
      { id: 'ai_view', name: 'View AI Apps', description: 'View AI application registry', category: 'AI Apps', granted: true },
      { id: 'ai_manage', name: 'Manage AI Apps', description: 'Whitelist/block AI applications', category: 'AI Apps', granted: false },
      { id: 'ai_approve', name: 'Approve Requests', description: 'Approve AI app access requests', category: 'AI Apps', granted: false },
    ]
  },
  {
    name: 'Logs & Reports',
    permissions: [
      { id: 'log_view', name: 'View Logs', description: 'Access activity logs', category: 'Logs & Reports', granted: true },
      { id: 'log_export', name: 'Export Logs', description: 'Export log data', category: 'Logs & Reports', granted: false },
      { id: 'rpt_generate', name: 'Generate Reports', description: 'Create compliance reports', category: 'Logs & Reports', granted: false },
    ]
  },
  {
    name: 'System',
    permissions: [
      { id: 'sys_settings', name: 'System Settings', description: 'Access system configuration', category: 'System', granted: false },
      { id: 'sys_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'System', granted: false },
      { id: 'sys_audit', name: 'Audit Trail', description: 'View system audit trail', category: 'System', granted: false },
    ]
  },
];

export const roles: Role[] = [
  {
    id: 'role_admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions. Can manage users, policies, detection engines, and system settings.',
    color: '#EF4444',
    userCount: 3,
    isSystem: true,
    createdAt: '2024-01-15',
    permissions: permissionCategories.flatMap(c => c.permissions.map(p => ({ ...p, granted: true }))),
  },
  {
    id: 'role_security',
    name: 'security_analyst',
    displayName: 'Security Analyst',
    description: 'Monitors security events, manages policies and detection rules. Cannot manage users or system settings.',
    color: '#F59E0B',
    userCount: 8,
    isSystem: true,
    createdAt: '2024-01-15',
    permissions: permissionCategories.flatMap(c => c.permissions.map(p => ({
      ...p,
      granted: ['Dashboard', 'Policies', 'Detection', 'AI Apps', 'Logs & Reports'].includes(p.category)
        ? true : false,
    }))),
  },
  {
    id: 'role_manager',
    name: 'manager',
    displayName: 'Team Manager',
    description: 'Can view team activity, logs, and reports. Limited policy and user management within their team.',
    color: '#3B82F6',
    userCount: 15,
    isSystem: true,
    createdAt: '2024-01-15',
    permissions: permissionCategories.flatMap(c => c.permissions.map(p => ({
      ...p,
      granted: ['dash_view', 'dash_analytics', 'pol_view', 'det_view', 'usr_view', 'ai_view', 'log_view', 'log_export'].includes(p.id),
    }))),
  },
  {
    id: 'role_employee',
    name: 'employee',
    displayName: 'Employee',
    description: 'Standard user with basic access. Can view their own activity and protection status.',
    color: '#10B981',
    userCount: 218,
    isSystem: true,
    createdAt: '2024-01-15',
    permissions: permissionCategories.flatMap(c => c.permissions.map(p => ({
      ...p,
      granted: ['dash_view'].includes(p.id),
    }))),
  },
  {
    id: 'role_auditor',
    name: 'auditor',
    displayName: 'Compliance Auditor',
    description: 'Read-only access to all logs, reports, and policies for compliance auditing.',
    color: '#8B5CF6',
    userCount: 4,
    isSystem: false,
    createdAt: '2024-03-20',
    permissions: permissionCategories.flatMap(c => c.permissions.map(p => ({
      ...p,
      granted: ['dash_view', 'dash_analytics', 'pol_view', 'det_view', 'usr_view', 'ai_view', 'log_view', 'log_export', 'rpt_generate', 'sys_audit'].includes(p.id),
    }))),
  },
];

const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'Support', 'Data Science'];
const teams = ['Frontend', 'Backend', 'DevOps', 'Mobile', 'Growth', 'Revenue', 'Analytics', 'Compliance', 'Infrastructure', 'QA'];
const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Karthik', 'Divya', 'Amit', 'Meera', 'Rohit', 'Neha', 'Sanjay', 'Pooja', 'Aditya', 'Kavita', 'Rajesh', 'Swati', 'Manish', 'Deepa', 'Suresh', 'Rekha', 'Vivek', 'Asha', 'Nikhil', 'Sunita', 'Gaurav', 'Pallavi', 'Harsh', 'Tanvi'];
const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Joshi', 'Nair', 'Iyer', 'Desai', 'Mehta', 'Choudhary', 'Verma', 'Rao', 'Mishra', 'Das', 'Agarwal', 'Pillai', 'Banerjee', 'Kapoor'];
const aiApps = ['ChatGPT', 'Gemini', 'Claude', 'Grok', 'Perplexity', 'Copilot', 'GitHub Copilot', 'DeepSeek'];

function pickRandom<T>(arr: T[], count?: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count || Math.floor(Math.random() * arr.length) + 1);
}

export const users: User[] = Array.from({ length: 5 }, (_, i) => {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const dept = departments[i % departments.length];
  const roleIndex = i < 3 ? 0 : i < 8 ? 1 : i < 15 ? 2 : 3;
  const roleNames: Array<'admin' | 'security_analyst' | 'manager' | 'employee'> = ['admin', 'security_analyst', 'manager', 'employee'];
  const role = roleNames[roleIndex];
  const status: Array<'active' | 'inactive' | 'suspended' | 'pending'> = ['active', 'active', 'active', 'active', 'active', 'inactive', 'suspended', 'pending'];
  const totalPrompts = Math.floor(Math.random() * 2000) + 50;
  const blockedPct = Math.random() * 0.15;
  const maskedPct = Math.random() * 0.3;

  return {
    id: `usr_${String(i + 1).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maziktech.com`,
    avatar: `${firstName[0]}${lastName[0]}`,
    role,
    department: dept,
    team: teams[i % teams.length],
    status: status[i % status.length],
    lastActive: i % 8 === 7 ? '2024-11-01' : i % 6 === 5 ? '2024-12-15' : '2025-01-10',
    joinDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    promptsTotal: totalPrompts,
    promptsBlocked: Math.floor(totalPrompts * blockedPct),
    promptsMasked: Math.floor(totalPrompts * maskedPct),
    riskScore: Math.floor(Math.random() * 100),
    aiAppsUsed: pickRandom(aiApps, Math.floor(Math.random() * 4) + 1),
    violations: Math.floor(Math.random() * 30),
    mfaEnabled: Math.random() > 0.2,
    extensionInstalled: Math.random() > 0.1,
    extensionVersion: Math.random() > 0.3 ? '2.4.1' : '2.3.0',
    policyGroupIds: [`pg_${dept.toLowerCase()}`],
  };
});

export const teamsList: Team[] = [
  { id: 'team_01', name: 'Frontend Engineering', department: 'Engineering', lead: 'Arjun Sharma', leadEmail: 'arjun.sharma@maziktech.com', memberCount: 12, activeMembers: 11, riskScore: 42, totalPrompts: 4520, blockedPrompts: 180, policies: ['Source Code Protection', 'API Key Detection'], createdAt: '2024-01-20' },
  { id: 'team_02', name: 'Backend Engineering', department: 'Engineering', lead: 'Rahul Gupta', leadEmail: 'rahul.gupta@maziktech.com', memberCount: 15, activeMembers: 14, riskScore: 55, totalPrompts: 6800, blockedPrompts: 340, policies: ['Source Code Protection', 'Database Schema Protection', 'Credential Detection'], createdAt: '2024-01-20' },
  { id: 'team_03', name: 'DevOps', department: 'Engineering', lead: 'Vikram Singh', leadEmail: 'vikram.singh@maziktech.com', memberCount: 6, activeMembers: 6, riskScore: 68, totalPrompts: 3200, blockedPrompts: 290, policies: ['API Key Detection', 'Credential Detection', 'Infrastructure Secrets'], createdAt: '2024-02-01' },
  { id: 'team_04', name: 'Data Science', department: 'Data Science', lead: 'Sneha Patel', leadEmail: 'sneha.patel@maziktech.com', memberCount: 10, activeMembers: 9, riskScore: 48, totalPrompts: 5100, blockedPrompts: 210, policies: ['PII Protection', 'Indian PII Protection', 'Database Schema Protection'], createdAt: '2024-02-15' },
  { id: 'team_05', name: 'Growth Marketing', department: 'Marketing', lead: 'Ananya Kumar', leadEmail: 'ananya.kumar@maziktech.com', memberCount: 8, activeMembers: 7, riskScore: 25, totalPrompts: 2800, blockedPrompts: 70, policies: ['PII Protection', 'Email Address Masking'], createdAt: '2024-03-01' },
  { id: 'team_06', name: 'Sales Operations', department: 'Sales', lead: 'Karthik Reddy', leadEmail: 'karthik.reddy@maziktech.com', memberCount: 14, activeMembers: 12, riskScore: 35, totalPrompts: 3900, blockedPrompts: 120, policies: ['PII Protection', 'GSTIN Protection'], createdAt: '2024-03-10' },
  { id: 'team_07', name: 'Compliance', department: 'Legal', lead: 'Divya Joshi', leadEmail: 'divya.joshi@maziktech.com', memberCount: 5, activeMembers: 5, riskScore: 12, totalPrompts: 1200, blockedPrompts: 15, policies: ['PII Protection'], createdAt: '2024-04-01' },
  { id: 'team_08', name: 'Finance & Accounting', department: 'Finance', lead: 'Amit Nair', leadEmail: 'amit.nair@maziktech.com', memberCount: 7, activeMembers: 6, riskScore: 38, totalPrompts: 1800, blockedPrompts: 95, policies: ['PII Protection', 'PAN Protection', 'Credit Card Detection'], createdAt: '2024-04-15' },
];

export const invitations: Invitation[] = [
  { id: 'inv_01', email: 'new.hire1@maziktech.com', role: 'employee', team: 'Frontend Engineering', invitedBy: 'Arjun Sharma', invitedAt: '2025-01-08', status: 'pending', expiresAt: '2025-01-15' },
  { id: 'inv_02', email: 'new.analyst@maziktech.com', role: 'security_analyst', team: 'DevOps', invitedBy: 'Priya Patel', invitedAt: '2025-01-07', status: 'pending', expiresAt: '2025-01-14' },
  { id: 'inv_03', email: 'consultant@external.com', role: 'auditor', team: 'Compliance', invitedBy: 'Divya Joshi', invitedAt: '2025-01-05', status: 'pending', expiresAt: '2025-01-12' },
  { id: 'inv_04', email: 'dev.senior@maziktech.com', role: 'employee', team: 'Backend Engineering', invitedBy: 'Rahul Gupta', invitedAt: '2024-12-28', status: 'accepted', expiresAt: '2025-01-04' },
  { id: 'inv_05', email: 'expired.user@maziktech.com', role: 'employee', team: 'Sales Operations', invitedBy: 'Karthik Reddy', invitedAt: '2024-12-01', status: 'expired', expiresAt: '2024-12-08' },
];

export const rolePermissionMatrix = {
  admin: { dashboard: true, analytics: true, policies: true, detection: true, users: true, aiApps: true, logs: true, reports: true, settings: true },
  security_analyst: { dashboard: true, analytics: true, policies: true, detection: true, users: false, aiApps: true, logs: true, reports: true, settings: false },
  manager: { dashboard: true, analytics: true, policies: false, detection: false, users: false, aiApps: false, logs: true, reports: true, settings: false },
  employee: { dashboard: true, analytics: false, policies: false, detection: false, users: false, aiApps: false, logs: false, reports: false, settings: false },
  auditor: { dashboard: true, analytics: true, policies: true, detection: true, users: true, aiApps: true, logs: true, reports: true, settings: false },
};
