export interface GeneralSettings {
  organizationName: string;
  organizationDomain: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  language: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  enforcePasswordComplexity: boolean;
  autoLogoutIdle: boolean;
  idleTimeoutMinutes: number;
}

export interface SecuritySettings {
  mfaRequired: boolean;
  mfaMethod: string;
  ssoEnabled: boolean;
  ssoProvider: string;
  ssoEntityId: string;
  ssoLoginUrl: string;
  ssoCertificate: string;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  rateLimitEnabled: boolean;
  rateLimitPerMinute: number;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  auditLogRetentionDays: number;
  dataRetentionDays: number;
  promptStorageEnabled: boolean;
  anonymizeLogsAfterDays: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpTls: boolean;
  slackEnabled: boolean;
  slackWebhookUrl: string;
  slackChannel: string;
  teamsEnabled: boolean;
  teamsWebhookUrl: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  notifyOnBlock: boolean;
  notifyOnHighRisk: boolean;
  notifyOnPolicyViolation: boolean;
  notifyOnNewUser: boolean;
  notifyOnSystemAlert: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  digestRecipients: string[];
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'coming_soon';
  lastSync: string;
  config: Record<string, string>;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdBy: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  permissions: string[];
  usageCount: number;
}

export interface BackupRecord {
  id: string;
  type: 'full' | 'incremental' | 'config_only';
  status: 'completed' | 'in_progress' | 'failed';
  size: string;
  createdAt: string;
  completedAt: string;
  retentionDays: number;
  downloadUrl: string;
}

export const generalSettings: GeneralSettings = {
  organizationName: 'MazikTech Pvt. Ltd.',
  organizationDomain: 'maziktech.com',
  adminEmail: 'admin@maziktech.com',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  language: 'English',
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 12,
  enforcePasswordComplexity: true,
  autoLogoutIdle: true,
  idleTimeoutMinutes: 15,
};

export const securitySettings: SecuritySettings = {
  mfaRequired: true,
  mfaMethod: 'totp',
  ssoEnabled: true,
  ssoProvider: 'Azure AD',
  ssoEntityId: 'https://maziktech.com/sso/saml',
  ssoLoginUrl: 'https://login.microsoftonline.com/maziktech/saml2',
  ssoCertificate: '-----BEGIN CERTIFICATE-----\nMIIDx...truncated...==\n-----END CERTIFICATE-----',
  ipWhitelistEnabled: false,
  ipWhitelist: ['10.0.0.0/8', '172.16.0.0/12', '192.168.1.0/24'],
  rateLimitEnabled: true,
  rateLimitPerMinute: 120,
  encryptionAtRest: true,
  encryptionInTransit: true,
  auditLogRetentionDays: 365,
  dataRetentionDays: 90,
  promptStorageEnabled: false,
  anonymizeLogsAfterDays: 180,
};

export const notificationSettings: NotificationSettings = {
  emailEnabled: true,
  smtpHost: 'smtp.maziktech.com',
  smtpPort: 587,
  smtpUser: 'notifications@maziktech.com',
  smtpPassword: '••••••••••••',
  smtpTls: true,
  slackEnabled: true,
  slackWebhookUrl: 'https://hooks.slack.com/services/T00.../B00.../xxxx',
  slackChannel: '#security-alerts',
  teamsEnabled: false,
  teamsWebhookUrl: '',
  webhookEnabled: false,
  webhookUrl: '',
  webhookSecret: '',
  notifyOnBlock: true,
  notifyOnHighRisk: true,
  notifyOnPolicyViolation: true,
  notifyOnNewUser: false,
  notifyOnSystemAlert: true,
  dailyDigest: true,
  weeklyReport: true,
  digestRecipients: ['security-team@maziktech.com', 'ciso@maziktech.com'],
};

export const integrations: Integration[] = [
  {
    id: 'int_01',
    name: 'Azure Active Directory',
    description: 'User identity and SSO provider for enterprise authentication',
    icon: '🔵',
    category: 'Identity',
    status: 'connected',
    lastSync: '2025-01-10T14:30:00',
    config: { tenantId: 'maziktech-tenant-id', directory: 'maziktech.onmicrosoft.com' },
  },
  {
    id: 'int_02',
    name: 'Slack',
    description: 'Real-time security alerts and notifications to Slack channels',
    icon: '💬',
    category: 'Communication',
    status: 'connected',
    lastSync: '2025-01-10T15:00:00',
    config: { workspace: 'MazikTech', channel: '#security-alerts' },
  },
  {
    id: 'int_03',
    name: 'Microsoft Teams',
    description: 'Notifications and alerts to Microsoft Teams channels',
    icon: '🟣',
    category: 'Communication',
    status: 'disconnected',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_04',
    name: 'Jira',
    description: 'Automatic ticket creation for security incidents and violations',
    icon: '🔷',
    category: 'Ticketing',
    status: 'connected',
    lastSync: '2025-01-10T12:00:00',
    config: { project: 'SEC', baseUrl: 'https://maziktech.atlassian.net' },
  },
  {
    id: 'int_05',
    name: 'Splunk',
    description: 'Forward security logs and events to Splunk SIEM',
    icon: '🟢',
    category: 'SIEM',
    status: 'connected',
    lastSync: '2025-01-10T15:15:00',
    config: { endpoint: 'https://splunk.maziktech.com:8088', index: 'mazikdlp' },
  },
  {
    id: 'int_06',
    name: 'ServiceNow',
    description: 'ITSM integration for incident management workflows',
    icon: '🟩',
    category: 'Ticketing',
    status: 'disconnected',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_07',
    name: 'PagerDuty',
    description: 'Critical incident alerting and on-call management',
    icon: '🟡',
    category: 'Alerting',
    status: 'error',
    lastSync: '2025-01-09T08:00:00',
    config: { serviceKey: 'pd-service-***' },
  },
  {
    id: 'int_08',
    name: 'Okta',
    description: 'Identity provider and SSO integration',
    icon: '🔵',
    category: 'Identity',
    status: 'coming_soon',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_09',
    name: 'Google Workspace',
    description: 'User directory sync and Google SSO authentication',
    icon: '🔴',
    category: 'Identity',
    status: 'coming_soon',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_10',
    name: 'Datadog',
    description: 'Application performance monitoring and log aggregation',
    icon: '🐕',
    category: 'Monitoring',
    status: 'coming_soon',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_11',
    name: 'Elastic SIEM',
    description: 'Forward security events to Elastic Security',
    icon: '🔶',
    category: 'SIEM',
    status: 'coming_soon',
    lastSync: '',
    config: {},
  },
  {
    id: 'int_12',
    name: 'AWS CloudWatch',
    description: 'Send metrics and logs to AWS CloudWatch',
    icon: '☁️',
    category: 'Monitoring',
    status: 'disconnected',
    lastSync: '',
    config: {},
  },
];

export const apiKeys: ApiKey[] = [
  {
    id: 'key_01',
    name: 'Production API',
    key: 'mzk_prod_a1b2c3d4e5f6g7h8i9j0',
    createdBy: 'Priya Patel',
    createdAt: '2024-06-15',
    lastUsed: '2025-01-10T15:30:00',
    expiresAt: '2025-06-15',
    status: 'active',
    permissions: ['scan', 'restore', 'policies:read'],
    usageCount: 142580,
  },
  {
    id: 'key_02',
    name: 'Extension Auth Key',
    key: 'mzk_ext_k1l2m3n4o5p6q7r8s9t0',
    createdBy: 'Arjun Sharma',
    createdAt: '2024-08-01',
    lastUsed: '2025-01-10T15:28:00',
    expiresAt: '2025-08-01',
    status: 'active',
    permissions: ['scan', 'restore', 'auth'],
    usageCount: 89340,
  },
  {
    id: 'key_03',
    name: 'CI/CD Pipeline',
    key: 'mzk_ci_u1v2w3x4y5z6a7b8c9d0',
    createdBy: 'Vikram Singh',
    createdAt: '2024-09-10',
    lastUsed: '2025-01-09T22:00:00',
    expiresAt: '2025-03-10',
    status: 'active',
    permissions: ['scan', 'policies:read', 'logs:read'],
    usageCount: 34200,
  },
  {
    id: 'key_04',
    name: 'Analytics Dashboard',
    key: 'mzk_dash_e1f2g3h4i5j6k7l8m9n0',
    createdBy: 'Sneha Patel',
    createdAt: '2024-04-20',
    lastUsed: '2024-12-01T10:00:00',
    expiresAt: '2024-12-20',
    status: 'expired',
    permissions: ['analytics:read', 'logs:read', 'reports:read'],
    usageCount: 12400,
  },
  {
    id: 'key_05',
    name: 'Staging Test Key',
    key: 'mzk_stg_o1p2q3r4s5t6u7v8w9x0',
    createdBy: 'Rahul Gupta',
    createdAt: '2024-10-15',
    lastUsed: '2024-11-20T08:00:00',
    expiresAt: '2025-10-15',
    status: 'revoked',
    permissions: ['scan', 'restore'],
    usageCount: 5600,
  },
];

export const backupRecords: BackupRecord[] = [
  { id: 'bk_01', type: 'full', status: 'completed', size: '2.4 GB', createdAt: '2025-01-10T02:00:00', completedAt: '2025-01-10T02:45:00', retentionDays: 90, downloadUrl: '#' },
  { id: 'bk_02', type: 'incremental', status: 'completed', size: '180 MB', createdAt: '2025-01-09T02:00:00', completedAt: '2025-01-09T02:08:00', retentionDays: 30, downloadUrl: '#' },
  { id: 'bk_03', type: 'config_only', status: 'completed', size: '12 MB', createdAt: '2025-01-08T14:00:00', completedAt: '2025-01-08T14:01:00', retentionDays: 365, downloadUrl: '#' },
  { id: 'bk_04', type: 'full', status: 'completed', size: '2.3 GB', createdAt: '2025-01-03T02:00:00', completedAt: '2025-01-03T02:42:00', retentionDays: 90, downloadUrl: '#' },
  { id: 'bk_05', type: 'incremental', status: 'failed', size: '0 MB', createdAt: '2025-01-02T02:00:00', completedAt: '2025-01-02T02:05:00', retentionDays: 30, downloadUrl: '#' },
  { id: 'bk_06', type: 'full', status: 'completed', size: '2.2 GB', createdAt: '2024-12-27T02:00:00', completedAt: '2024-12-27T02:40:00', retentionDays: 90, downloadUrl: '#' },
];

export const systemInfo = {
  version: '2.4.1',
  buildNumber: '2025.01.10.1847',
  releaseDate: '2025-01-08',
  environment: 'Production',
  region: 'ap-south-1 (Mumbai)',
  serverNodes: 3,
  uptime: '99.97%',
  lastRestart: '2025-01-05T03:00:00',
  databaseVersion: 'PostgreSQL 16.1',
  redisVersion: 'Redis 7.2',
  pythonVersion: '3.11.7',
  presidioVersion: '2.2.354',
  storageUsed: '48.2 GB',
  storageTotal: '200 GB',
  totalUsers: 244,
  totalPolicies: 15,
  totalPatterns: 22,
  totalScans: 1284930,
  license: {
    type: 'Enterprise',
    seats: 500,
    usedSeats: 244,
    expiresAt: '2026-01-15',
    features: ['Unlimited Policies', 'Custom Patterns', 'SSO/SAML', 'API Access', 'Priority Support', 'Advanced Analytics', 'Image Redaction', 'Multi-region'],
  },
};

export const timezones = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney',
  'Pacific/Auckland',
];

export const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'];

export const languages = ['English', 'Hindi', 'Japanese', 'German', 'French', 'Spanish'];
