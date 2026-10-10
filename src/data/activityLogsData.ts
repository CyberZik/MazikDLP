export type LogSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LogDecision = 'allowed' | 'blocked' | 'masked' | 'warned' | 'soft_blocked';
export type LogCategory = 'pii' | 'credentials' | 'source_code' | 'api_keys' | 'db_schema' | 'custom' | 'policy' | 'auth' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  user: string;
  email: string;
  department: string;
  role: string;
  platform: string;
  model: string;
  entityType: string;
  entityCategory: LogCategory;
  severity: LogSeverity;
  decision: LogDecision;
  action: string;
  promptPreview: string;
  promptHash: string;
  detectedEntities: { type: string; value: string; confidence: number }[];
  policyMatched: string;
  policyAction: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  responseTime: number;
  masked: boolean;
  maskedText?: string;
}

export interface LogFilter {
  search: string;
  severity: string;
  decision: string;
  platform: string;
  category: string;
  department: string;
  dateRange: string;
  user: string;
}

const users = [
  { name: 'Priya Sharma', email: 'priya.sharma@acme.com', department: 'Engineering', role: 'Developer' },
  { name: 'Raj Patel', email: 'raj.patel@acme.com', department: 'Engineering', role: 'Senior Developer' },
  { name: 'Ananya Singh', email: 'ananya.s@acme.com', department: 'Data Science', role: 'Data Analyst' },
  { name: 'Vikram Desai', email: 'v.desai@acme.com', department: 'Engineering', role: 'DevOps Engineer' },
  { name: 'Meera Joshi', email: 'meera.j@acme.com', department: 'Marketing', role: 'Content Manager' },
  { name: 'Arjun Kumar', email: 'arjun.k@acme.com', department: 'Engineering', role: 'Backend Developer' },
  { name: 'Sneha Reddy', email: 'sneha.r@acme.com', department: 'HR', role: 'HR Manager' },
  { name: 'Karthik Nair', email: 'karthik.n@acme.com', department: 'Finance', role: 'Financial Analyst' },
  { name: 'Deepa Menon', email: 'deepa.m@acme.com', department: 'Legal', role: 'Compliance Officer' },
  { name: 'Aditya Gupta', email: 'aditya.g@acme.com', department: 'Product', role: 'Product Manager' },
  { name: 'Kavita Iyer', email: 'kavita.i@acme.com', department: 'Customer Support', role: 'Support Lead' },
  { name: 'Rohit Verma', email: 'rohit.v@acme.com', department: 'Engineering', role: 'Frontend Developer' },
  { name: 'Nisha Agarwal', email: 'nisha.a@acme.com', department: 'Sales', role: 'Sales Executive' },
  { name: 'Suresh Babu', email: 'suresh.b@acme.com', department: 'Engineering', role: 'QA Engineer' },
  { name: 'Pooja Kapoor', email: 'pooja.k@acme.com', department: 'Design', role: 'UI/UX Designer' },
];

const platforms = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Grok', 'Copilot', 'DeepSeek'];
const models = ['GPT-4o', 'GPT-4', 'Claude 3.5 Sonnet', 'Claude 3 Opus', 'Gemini Pro', 'Gemini Ultra', 'Grok-2', 'Llama 3.1', 'Mistral Large'];

interface LogTemplate {
  entityType: string;
  category: LogCategory;
  severity: LogSeverity;
  decision: LogDecision;
  action: string;
  promptPreview: string;
  detectedEntities: { type: string; value: string; confidence: number }[];
  policyMatched: string;
  policyAction: string;
}

const logTemplates: LogTemplate[] = [
  {
    entityType: 'IN_PAN',
    category: 'pii',
    severity: 'critical',
    decision: 'blocked',
    action: 'PAN number detected in prompt',
    promptPreview: 'Can you verify if PAN ABCDE1234F is valid for tax filing under section...',
    detectedEntities: [{ type: 'IN_PAN', value: 'ABCDE1234F', confidence: 0.99 }],
    policyMatched: 'Block PAN Numbers',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'IN_AADHAAR',
    category: 'pii',
    severity: 'critical',
    decision: 'blocked',
    action: 'Aadhaar number detected in prompt',
    promptPreview: 'Please help me fill this form with Aadhaar 1234 5678 9012 and...',
    detectedEntities: [{ type: 'IN_AADHAAR', value: '1234 5678 9012', confidence: 0.98 }],
    policyMatched: 'Block Aadhaar Numbers',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'EMAIL_ADDRESS',
    category: 'pii',
    severity: 'medium',
    decision: 'masked',
    action: 'Email address detected in prompt',
    promptPreview: 'Send the report to john.smith@internal.acme.com and CC the...',
    detectedEntities: [{ type: 'EMAIL_ADDRESS', value: 'john.smith@internal.acme.com', confidence: 0.97 }],
    policyMatched: 'Mask Email Addresses',
    policyAction: 'MASK',
  },
  {
    entityType: 'SOURCE_CODE',
    category: 'source_code',
    severity: 'high',
    decision: 'blocked',
    action: 'Source code snippet detected',
    promptPreview: 'Debug this function: def process_payment(card_num, cvv, expiry): conn = db.connect(...',
    detectedEntities: [{ type: 'SOURCE_CODE', value: 'def process_payment(card_num...)', confidence: 0.95 }],
    policyMatched: 'Block Source Code',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'API_KEY',
    category: 'api_keys',
    severity: 'critical',
    decision: 'blocked',
    action: 'API key detected in prompt',
    promptPreview: 'Why is my AWS call failing? AKIAIOSFODNN7EXAMPLE with secret...',
    detectedEntities: [{ type: 'AWS_ACCESS_KEY', value: 'AKIAIOSFODNN7EXAMPLE', confidence: 0.99 }],
    policyMatched: 'Block API Keys',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'CREDENTIAL',
    category: 'credentials',
    severity: 'critical',
    decision: 'blocked',
    action: 'Credential pair detected',
    promptPreview: 'Login credentials for staging: username admin, password S3cur3P@ss!...',
    detectedEntities: [
      { type: 'USERNAME', value: 'admin', confidence: 0.88 },
      { type: 'PASSWORD', value: 'S3cur3P@ss!', confidence: 0.96 },
    ],
    policyMatched: 'Block Credentials',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'DB_SCHEMA',
    category: 'db_schema',
    severity: 'high',
    decision: 'blocked',
    action: 'Database schema detected',
    promptPreview: 'Optimize this query: SELECT * FROM users JOIN payments ON users.id = payments.user_id WHERE...',
    detectedEntities: [{ type: 'DB_SCHEMA', value: 'SELECT * FROM users JOIN payments...', confidence: 0.92 }],
    policyMatched: 'Block DB Schema',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'PHONE_NUMBER',
    category: 'pii',
    severity: 'low',
    decision: 'masked',
    action: 'Phone number detected in prompt',
    promptPreview: 'Contact the vendor at +91 98765 43210 for the updated pricing...',
    detectedEntities: [{ type: 'PHONE_NUMBER', value: '+91 98765 43210', confidence: 0.94 }],
    policyMatched: 'Mask Phone Numbers',
    policyAction: 'MASK',
  },
  {
    entityType: 'IN_GSTIN',
    category: 'pii',
    severity: 'medium',
    decision: 'warned',
    action: 'GSTIN detected in prompt',
    promptPreview: 'Verify GSTIN 27AAPFU0939F1ZV for the Maharashtra branch tax...',
    detectedEntities: [{ type: 'IN_GSTIN', value: '27AAPFU0939F1ZV', confidence: 0.97 }],
    policyMatched: 'Warn GSTIN Sharing',
    policyAction: 'SOFT_BLOCK',
  },
  {
    entityType: 'CREDIT_CARD',
    category: 'pii',
    severity: 'critical',
    decision: 'blocked',
    action: 'Credit card number detected',
    promptPreview: 'Process refund for card ending in 4532 0151 2345 6789 with...',
    detectedEntities: [{ type: 'CREDIT_CARD', value: '4532 0151 2345 6789', confidence: 0.99 }],
    policyMatched: 'Block Credit Cards',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'PERSON',
    category: 'pii',
    severity: 'low',
    decision: 'masked',
    action: 'Person name detected in prompt',
    promptPreview: 'Draft an email to Rajesh Krishnamurthy regarding the Q4 performance...',
    detectedEntities: [{ type: 'PERSON', value: 'Rajesh Krishnamurthy', confidence: 0.87 }],
    policyMatched: 'Mask Person Names',
    policyAction: 'MASK',
  },
  {
    entityType: 'CUSTOM_SECRET',
    category: 'custom',
    severity: 'high',
    decision: 'blocked',
    action: 'Internal project name detected',
    promptPreview: 'Help me write docs for Project Phoenix internal API gateway...',
    detectedEntities: [{ type: 'CUSTOM_SECRET', value: 'Project Phoenix', confidence: 0.91 }],
    policyMatched: 'Block Internal Project Names',
    policyAction: 'HARD_BLOCK',
  },
  {
    entityType: 'IN_IFSC',
    category: 'pii',
    severity: 'medium',
    decision: 'masked',
    action: 'IFSC code detected in prompt',
    promptPreview: 'Transfer to SBIN0001234 branch for vendor payment processing...',
    detectedEntities: [{ type: 'IN_IFSC', value: 'SBIN0001234', confidence: 0.96 }],
    policyMatched: 'Mask IFSC Codes',
    policyAction: 'MASK',
  },
  {
    entityType: 'EMAIL_ADDRESS',
    category: 'pii',
    severity: 'low',
    decision: 'allowed',
    action: 'General inquiry — no sensitive data',
    promptPreview: 'Explain how quicksort algorithm works with time complexity analysis...',
    detectedEntities: [],
    policyMatched: 'None',
    policyAction: 'ALLOW',
  },
  {
    entityType: 'SOURCE_CODE',
    category: 'source_code',
    severity: 'high',
    decision: 'soft_blocked',
    action: 'Proprietary code pattern detected',
    promptPreview: 'Review this authentication middleware: class AcmeAuthHandler extends BaseAuth {...',
    detectedEntities: [{ type: 'SOURCE_CODE', value: 'class AcmeAuthHandler extends...', confidence: 0.89 }],
    policyMatched: 'Warn Source Code Sharing',
    policyAction: 'SOFT_BLOCK',
  },
];

function generateHash(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateSessionId(): string {
  return `sess_${Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join('')}`;
}

function generateIP(): string {
  return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

const userAgents = [
  'Chrome/120.0 (Windows NT 10.0; Win64)',
  'Chrome/121.0 (Macintosh; Intel Mac OS X)',
  'Firefox/122.0 (Windows NT 10.0; Win64)',
  'Safari/17.2 (Macintosh; Intel Mac OS X)',
  'Edge/120.0 (Windows NT 10.0; Win64)',
  'Chrome/120.0 (Linux; Android 14)',
];

function generateTimestamp(index: number): { display: string; iso: string } {
  const now = new Date();
  const minutesAgo = index * 3 + Math.floor(Math.random() * 5);
  const ts = new Date(now.getTime() - minutesAgo * 60000);
  const display = minutesAgo < 60
    ? `${minutesAgo} min ago`
    : minutesAgo < 1440
      ? `${Math.floor(minutesAgo / 60)}h ago`
      : `${Math.floor(minutesAgo / 1440)}d ago`;
  return { display, iso: ts.toISOString() };
}

export function generateLogs(count: number = 50): LogEntry[] {
  const logs: LogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const template = logTemplates[i % logTemplates.length];
    const user = users[i % users.length];
    const platform = platforms[i % platforms.length];
    const model = models[i % models.length];
    const { display, iso } = generateTimestamp(i);

    logs.push({
      id: `LOG-${String(10000 + i).padStart(6, '0')}`,
      timestamp: display,
      isoTimestamp: iso,
      user: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      platform,
      model,
      entityType: template.entityType,
      entityCategory: template.category,
      severity: template.severity,
      decision: template.decision,
      action: template.action,
      promptPreview: template.promptPreview,
      promptHash: `sha256:${generateHash()}${generateHash()}`,
      detectedEntities: template.detectedEntities,
      policyMatched: template.policyMatched,
      policyAction: template.policyAction,
      sessionId: generateSessionId(),
      ipAddress: generateIP(),
      userAgent: userAgents[i % userAgents.length],
      responseTime: Math.floor(Math.random() * 80) + 10,
      masked: template.decision === 'masked',
      maskedText: template.decision === 'masked'
        ? template.promptPreview.replace(/[\w.+]+@[\w.]+/g, '<EMAIL_MASKED>').replace(/\+?\d[\d\s-]{8,}/g, '<PHONE_MASKED>')
        : undefined,
    });
  }

  return logs;
}

export const logStatsData = {
  totalLogs: 48293,
  todayLogs: 1847,
  blockedToday: 312,
  maskedToday: 891,
  warnedToday: 156,
  allowedToday: 488,
  avgResponseTime: 34,
  peakHour: '10:00 - 11:00 AM',
  topUser: 'Priya Sharma',
  topPlatform: 'ChatGPT',
  criticalEvents: 67,
  activeUsers: 234,
};

export const hourlyActivity = [
  { hour: '00:00', count: 12 }, { hour: '01:00', count: 5 },
  { hour: '02:00', count: 3 }, { hour: '03:00', count: 2 },
  { hour: '04:00', count: 4 }, { hour: '05:00', count: 8 },
  { hour: '06:00', count: 23 }, { hour: '07:00', count: 56 },
  { hour: '08:00', count: 134 }, { hour: '09:00', count: 198 },
  { hour: '10:00', count: 245 }, { hour: '11:00', count: 231 },
  { hour: '12:00', count: 178 }, { hour: '13:00', count: 201 },
  { hour: '14:00', count: 223 }, { hour: '15:00', count: 189 },
  { hour: '16:00', count: 167 }, { hour: '17:00', count: 145 },
  { hour: '18:00', count: 89 }, { hour: '19:00', count: 56 },
  { hour: '20:00', count: 34 }, { hour: '21:00', count: 28 },
  { hour: '22:00', count: 19 }, { hour: '23:00', count: 14 },
];

export const decisionDistribution = [
  { decision: 'Allowed', count: 34210, color: '#10B981' },
  { decision: 'Masked', count: 8920, color: '#8B5CF6' },
  { decision: 'Blocked', count: 3847, color: '#EF4444' },
  { decision: 'Warned', count: 1156, color: '#F59E0B' },
  { decision: 'Soft Blocked', count: 160, color: '#F97316' },
];

export const departmentBreakdown = [
  { department: 'Engineering', logs: 18420, blocked: 892, percentage: 38.1 },
  { department: 'Data Science', logs: 8900, blocked: 412, percentage: 18.4 },
  { department: 'Product', logs: 6200, blocked: 201, percentage: 12.8 },
  { department: 'Marketing', logs: 4100, blocked: 89, percentage: 8.5 },
  { department: 'Finance', logs: 3800, blocked: 312, percentage: 7.9 },
  { department: 'HR', logs: 2900, blocked: 198, percentage: 6.0 },
  { department: 'Sales', logs: 2100, blocked: 56, percentage: 4.3 },
  { department: 'Legal', logs: 1200, blocked: 145, percentage: 2.5 },
  { department: 'Design', logs: 673, blocked: 12, percentage: 1.4 },
];

export const filterOptions = {
  severities: ['all', 'low', 'medium', 'high', 'critical'],
  decisions: ['all', 'allowed', 'blocked', 'masked', 'warned', 'soft_blocked'],
  platforms: ['all', 'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Grok', 'Copilot', 'DeepSeek'],
  categories: ['all', 'pii', 'credentials', 'source_code', 'api_keys', 'db_schema', 'custom', 'policy', 'auth', 'system'],
  departments: ['all', 'Engineering', 'Data Science', 'Product', 'Marketing', 'Finance', 'HR', 'Sales', 'Legal', 'Design', 'Customer Support'],
  dateRanges: ['all', 'last_hour', 'last_24h', 'last_7d', 'last_30d', 'custom'],
};
