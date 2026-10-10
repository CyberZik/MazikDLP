export interface KPIMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  email: string;
  action: string;
  platform: string;
  entityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  decision: 'allowed' | 'blocked' | 'masked' | 'warned';
}

export interface PolicySummary {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  violations: number;
  dataType: string;
  action: string;
}

export interface AIAppUsage {
  name: string;
  prompts: number;
  blocked: number;
  users: number;
  status: 'whitelisted' | 'blocked' | 'monitored';
}

export interface TrendPoint {
  date: string;
  prompts: number;
  blocked: number;
  masked: number;
}

export interface PromptCategory {
  name: string;
  count: number;
  percentage: number;
}

export interface DetectionBreakdown {
  type: string;
  count: number;
  color: string;
}

export const kpiMetrics: KPIMetric[] = [
  { label: 'Total Prompts Scanned', value: '48,293', change: 12.5, changeLabel: 'vs last week', icon: 'scan' },
  { label: 'Threats Blocked', value: '1,847', change: -8.3, changeLabel: 'vs last week', icon: 'shield' },
  { label: 'Data Entities Masked', value: '6,421', change: 23.1, changeLabel: 'vs last week', icon: 'mask' },
  { label: 'Active Policies', value: '34', change: 2, changeLabel: 'new this week', icon: 'policy' },
  { label: 'Protected Users', value: '2,156', change: 5.7, changeLabel: 'vs last week', icon: 'users' },
  { label: 'AI Apps Monitored', value: '12', change: 3, changeLabel: 'new this week', icon: 'apps' },
];

export const recentActivity: ActivityLog[] = [
  { id: '1', user: 'Priya Sharma', email: 'priya.sharma@acme.com', action: 'Pasted PAN number in prompt', platform: 'ChatGPT', entityType: 'IN_PAN', severity: 'critical', timestamp: '2 min ago', decision: 'blocked' },
  { id: '2', user: 'Raj Patel', email: 'raj.patel@acme.com', action: 'Shared source code snippet', platform: 'Claude', entityType: 'SOURCE_CODE', severity: 'high', timestamp: '5 min ago', decision: 'blocked' },
  { id: '3', user: 'Ananya Singh', email: 'ananya.s@acme.com', action: 'Email address in prompt', platform: 'Gemini', entityType: 'EMAIL_ADDRESS', severity: 'medium', timestamp: '8 min ago', decision: 'masked' },
  { id: '4', user: 'Vikram Desai', email: 'v.desai@acme.com', action: 'API key detected in prompt', platform: 'ChatGPT', entityType: 'API_KEY', severity: 'critical', timestamp: '12 min ago', decision: 'blocked' },
  { id: '5', user: 'Meera Joshi', email: 'meera.j@acme.com', action: 'Phone number in prompt', platform: 'Perplexity', entityType: 'PHONE_NUMBER', severity: 'low', timestamp: '15 min ago', decision: 'masked' },
];

export const policyData: PolicySummary[] = [
  { id: '1', name: 'Block PAN Numbers', status: 'active', violations: 234, dataType: 'IN_PAN', action: 'BLOCK' },
  { id: '2', name: 'Mask Email Addresses', status: 'active', violations: 1089, dataType: 'EMAIL_ADDRESS', action: 'MASK' },
  { id: '3', name: 'Block Source Code', status: 'active', violations: 456, dataType: 'SOURCE_CODE', action: 'BLOCK' },
  { id: '4', name: 'Block Aadhaar Numbers', status: 'active', violations: 167, dataType: 'IN_AADHAAR', action: 'BLOCK' },
  { id: '5', name: 'Mask Phone Numbers', status: 'active', violations: 892, dataType: 'PHONE_NUMBER', action: 'MASK' },
  { id: '6', name: 'Block API Keys', status: 'active', violations: 78, dataType: 'API_KEY', action: 'BLOCK' },
  { id: '7', name: 'Block Credentials', status: 'active', violations: 312, dataType: 'CREDENTIAL', action: 'BLOCK' },
  { id: '8', name: 'Warn GSTIN Sharing', status: 'active', violations: 45, dataType: 'IN_GSTIN', action: 'WARN' },
];

export const aiAppUsage: AIAppUsage[] = [
  { name: 'ChatGPT', prompts: 18420, blocked: 892, users: 1456, status: 'whitelisted' },
  { name: 'Claude', prompts: 12300, blocked: 534, users: 987, status: 'whitelisted' },
  { name: 'Gemini', prompts: 9870, blocked: 234, users: 876, status: 'whitelisted' },
  { name: 'Perplexity', prompts: 4560, blocked: 112, users: 432, status: 'monitored' },
  { name: 'Grok', prompts: 2100, blocked: 67, users: 234, status: 'monitored' },
  { name: 'DeepSeek', prompts: 1043, blocked: 8, users: 89, status: 'blocked' },
];

export const trendData: TrendPoint[] = [
  { date: 'Mon', prompts: 6200, blocked: 280, masked: 890 },
  { date: 'Tue', prompts: 7100, blocked: 310, masked: 1020 },
  { date: 'Wed', prompts: 6800, blocked: 265, masked: 940 },
  { date: 'Thu', prompts: 7900, blocked: 345, masked: 1150 },
  { date: 'Fri', prompts: 8200, blocked: 390, masked: 1280 },
  { date: 'Sat', prompts: 5100, blocked: 120, masked: 540 },
  { date: 'Sun', prompts: 4800, blocked: 95, masked: 480 },
];

export const promptCategories: PromptCategory[] = [
  { name: 'Coding', count: 14520, percentage: 30.1 },
  { name: 'Data Analysis', count: 8740, percentage: 18.1 },
  { name: 'Document Generation', count: 7230, percentage: 15.0 },
  { name: 'Research', count: 6120, percentage: 12.7 },
  { name: 'Business Queries', count: 4890, percentage: 10.1 },
  { name: 'Summarization', count: 3640, percentage: 7.5 },
  { name: 'Learning', count: 3153, percentage: 6.5 },
];

export const detectionBreakdown: DetectionBreakdown[] = [
  { type: 'Email Address', count: 2340, color: '#8B5CF6' },
  { type: 'Source Code', count: 1890, color: '#A78BFA' },
  { type: 'PAN Number', count: 1230, color: '#7C3AED' },
  { type: 'Phone Number', count: 980, color: '#C4B5FD' },
  { type: 'Credentials', count: 670, color: '#6D28D9' },
  { type: 'API Keys', count: 450, color: '#DDD6FE' },
  { type: 'Aadhaar', count: 380, color: '#5B21B6' },
  { type: 'GSTIN', count: 120, color: '#EDE9FE' },
];

export const organizationInfo = {
  name: 'Acme Corporation',
  plan: 'Enterprise',
  users: 2156,
  teams: 24,
  since: 'January 2024',
};
