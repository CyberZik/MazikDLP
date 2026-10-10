// ─── Analytics Module Data ───────────────────────────────────────────────────

export interface DailyTrend {
  date: string;
  prompts: number;
  blocked: number;
  masked: number;
  allowed: number;
  incidents: number;
}

export interface HourlyActivity {
  hour: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

export interface DepartmentStat {
  name: string;
  users: number;
  prompts: number;
  blocked: number;
  masked: number;
  violationRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topApp: string;
  topCategory: string;
}

export interface UserRisk {
  name: string;
  email: string;
  department: string;
  prompts: number;
  violations: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastActive: string;
  topPlatform: string;
}

export interface ModelUsage {
  model: string;
  platform: string;
  prompts: number;
  blocked: number;
  avgTokens: number;
  policyLevel: string;
}

export interface PolicyViolationStat {
  date: string;
  pii: number;
  credentials: number;
  sourceCode: number;
  apiKeys: number;
  dbSchema: number;
}

export interface CategoryTrend {
  date: string;
  coding: number;
  dataAnalysis: number;
  research: number;
  docGen: number;
  business: number;
  learning: number;
}

export interface DetectionTrend {
  date: string;
  email: number;
  pan: number;
  aadhaar: number;
  phone: number;
  sourceCode: number;
  credentials: number;
  apiKeys: number;
}

export interface TopAppStat {
  name: string;
  prompts: number;
  users: number;
  blocked: number;
  avgPerUser: number;
  growth: number;
}

export interface AnalyticsSummary {
  label: string;
  value: string;
  subtext: string;
  change: number;
  icon: string;
}

// ─── Summary KPIs ─────────────────────────────────────────────────────────────

export const analyticsSummary: AnalyticsSummary[] = [
  { label: 'Total AI Sessions', value: '127,843', subtext: 'Last 30 days', change: 14.2, icon: 'sessions' },
  { label: 'Avg Prompts / User / Day', value: '6.8', subtext: 'Across all platforms', change: 3.1, icon: 'average' },
  { label: 'Security Incident Rate', value: '3.8%', subtext: 'Of total prompts', change: -12.4, icon: 'incident' },
  { label: 'Data Exposure Prevented', value: '4,892', subtext: 'Sensitive items caught', change: 8.9, icon: 'prevented' },
  { label: 'Most Active Department', value: 'Engineering', subtext: '42% of all prompts', change: 5.3, icon: 'department' },
  { label: 'Peak Usage Hour', value: '2:00 PM', subtext: 'Weekday average', change: 0, icon: 'clock' },
];

// ─── 30-Day Usage Trend ───────────────────────────────────────────────────────

export const dailyTrends: DailyTrend[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2025, 0, i + 1);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const base = isWeekend ? 1800 + Math.random() * 600 : 3800 + Math.random() * 1400;
  const prompts = Math.round(base + i * 30);
  const blocked = Math.round(prompts * (0.03 + Math.random() * 0.02));
  const masked = Math.round(prompts * (0.08 + Math.random() * 0.04));
  const incidents = Math.round(blocked * (0.3 + Math.random() * 0.3));
  return {
    date: `Jan ${i + 1}`,
    prompts,
    blocked,
    masked,
    allowed: prompts - blocked - masked,
    incidents,
  };
});

// ─── Hourly Heatmap Data ──────────────────────────────────────────────────────

export const hourlyActivity: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => {
  const peakFactor = hour >= 9 && hour <= 17 ? 1 : hour >= 7 && hour <= 20 ? 0.5 : 0.1;
  const lunchBump = hour === 13 || hour === 14 ? 1.3 : 1;
  const gen = () => Math.round((80 + Math.random() * 400) * peakFactor * lunchBump);
  return {
    hour,
    mon: gen(),
    tue: gen(),
    wed: gen(),
    thu: gen(),
    fri: gen(),
    sat: Math.round(gen() * 0.3),
    sun: Math.round(gen() * 0.2),
  };
});

// ─── Department Statistics ────────────────────────────────────────────────────

export const departmentStats: DepartmentStat[] = [
  { name: 'Engineering', users: 680, prompts: 53200, blocked: 2890, masked: 6420, violationRate: 5.4, riskLevel: 'high', topApp: 'ChatGPT', topCategory: 'Coding' },
  { name: 'Data Science', users: 230, prompts: 28400, blocked: 1230, masked: 3980, violationRate: 4.3, riskLevel: 'medium', topApp: 'Claude', topCategory: 'Data Analysis' },
  { name: 'Product', users: 180, prompts: 14200, blocked: 340, masked: 1120, violationRate: 2.4, riskLevel: 'low', topApp: 'ChatGPT', topCategory: 'Business Queries' },
  { name: 'Marketing', users: 150, prompts: 11800, blocked: 210, masked: 890, violationRate: 1.8, riskLevel: 'low', topApp: 'Gemini', topCategory: 'Document Gen' },
  { name: 'Finance', users: 120, prompts: 8900, blocked: 780, masked: 2340, violationRate: 8.8, riskLevel: 'critical', topApp: 'ChatGPT', topCategory: 'Data Analysis' },
];

// ─── Top Users by Risk ────────────────────────────────────────────────────────

export const topRiskUsers: UserRisk[] = [
  { name: 'Vikram Desai', email: 'v.desai@acme.com', department: 'Engineering', prompts: 892, violations: 47, riskScore: 92, riskLevel: 'critical', lastActive: '2 min ago', topPlatform: 'ChatGPT' },
  { name: 'Priya Sharma', email: 'priya.sharma@acme.com', department: 'Finance', prompts: 534, violations: 38, riskScore: 87, riskLevel: 'critical', lastActive: '15 min ago', topPlatform: 'Claude' },
  { name: 'Arjun Kumar', email: 'arjun.k@acme.com', department: 'Engineering', prompts: 1203, violations: 34, riskScore: 78, riskLevel: 'high', lastActive: '1h ago', topPlatform: 'ChatGPT' },
  { name: 'Sneha Reddy', email: 'sneha.r@acme.com', department: 'Data Science', prompts: 678, violations: 28, riskScore: 72, riskLevel: 'high', lastActive: '30 min ago', topPlatform: 'Claude' },
  { name: 'Karthik Nair', email: 'karthik.n@acme.com', department: 'HR', prompts: 345, violations: 22, riskScore: 65, riskLevel: 'high', lastActive: '3h ago', topPlatform: 'Gemini' },
];

// ─── AI Model Usage ───────────────────────────────────────────────────────────

export const modelUsage: ModelUsage[] = [
  { model: 'GPT-4o', platform: 'ChatGPT', prompts: 32400, blocked: 1680, avgTokens: 340, policyLevel: 'Strict' },
  { model: 'GPT-4o Mini', platform: 'ChatGPT', prompts: 18900, blocked: 720, avgTokens: 220, policyLevel: 'Standard' },
  { model: 'Claude 3.5 Sonnet', platform: 'Claude', prompts: 15200, blocked: 890, avgTokens: 410, policyLevel: 'Strict' },
  { model: 'Claude 3 Haiku', platform: 'Claude', prompts: 8400, blocked: 230, avgTokens: 180, policyLevel: 'Standard' },
  { model: 'Gemini 1.5 Pro', platform: 'Gemini', prompts: 12100, blocked: 560, avgTokens: 380, policyLevel: 'Strict' },
  { model: 'Gemini 1.5 Flash', platform: 'Gemini', prompts: 6700, blocked: 190, avgTokens: 150, policyLevel: 'Standard' },
  { model: 'Grok-2', platform: 'Grok', prompts: 4200, blocked: 340, avgTokens: 290, policyLevel: 'Strict' },
  { model: 'Sonar Large', platform: 'Perplexity', prompts: 3800, blocked: 120, avgTokens: 260, policyLevel: 'Standard' },
];

// ─── Top AI Apps Extended ─────────────────────────────────────────────────────

export const topApps: TopAppStat[] = [
  { name: 'ChatGPT', prompts: 51300, users: 1456, blocked: 2400, avgPerUser: 35.2, growth: 12.3 },
  { name: 'Claude', prompts: 23600, users: 987, blocked: 1120, avgPerUser: 23.9, growth: 28.7 },
  { name: 'Gemini', prompts: 18800, users: 876, blocked: 750, avgPerUser: 21.5, growth: 8.4 },
  { name: 'Perplexity', prompts: 3800, users: 432, blocked: 120, avgPerUser: 8.8, growth: 45.2 },
  { name: 'Grok', prompts: 4200, users: 234, blocked: 340, avgPerUser: 17.9, growth: -5.3 },
];

// ─── Policy Violations Over Time ──────────────────────────────────────────────

export const policyViolations: PolicyViolationStat[] = [
  { date: 'Week 1', pii: 420, credentials: 89, sourceCode: 234, apiKeys: 45, dbSchema: 23 },
  { date: 'Week 2', pii: 380, credentials: 102, sourceCode: 198, apiKeys: 52, dbSchema: 18 },
  { date: 'Week 3', pii: 510, credentials: 78, sourceCode: 267, apiKeys: 38, dbSchema: 31 },
  { date: 'Week 4', pii: 340, credentials: 115, sourceCode: 312, apiKeys: 61, dbSchema: 27 },
];

// ─── Prompt Category Trends ───────────────────────────────────────────────────

export const categoryTrends: CategoryTrend[] = [
  { date: 'Week 1', coding: 3800, dataAnalysis: 2100, research: 1500, docGen: 1800, business: 1200, learning: 800 },
  { date: 'Week 2', coding: 4200, dataAnalysis: 2400, research: 1700, docGen: 1900, business: 1100, learning: 900 },
  { date: 'Week 3', coding: 4600, dataAnalysis: 2200, research: 1900, docGen: 2100, business: 1300, learning: 1050 },
  { date: 'Week 4', coding: 4100, dataAnalysis: 2600, research: 2100, docGen: 2300, business: 1400, learning: 1100 },
];

// ─── Detection Type Trends ────────────────────────────────────────────────────

export const detectionTrends: DetectionTrend[] = [
  { date: 'Week 1', email: 580, pan: 120, aadhaar: 89, phone: 230, sourceCode: 340, credentials: 98, apiKeys: 45 },
  { date: 'Week 2', email: 620, pan: 145, aadhaar: 76, phone: 210, sourceCode: 298, credentials: 112, apiKeys: 52 },
  { date: 'Week 3', email: 540, pan: 110, aadhaar: 102, phone: 260, sourceCode: 378, credentials: 87, apiKeys: 38 },
  { date: 'Week 4', email: 680, pan: 160, aadhaar: 95, phone: 240, sourceCode: 412, credentials: 124, apiKeys: 67 },
];

// ─── Risk Distribution ────────────────────────────────────────────────────────

export const riskDistribution = [
  { level: 'Critical', count: 23, color: '#EF4444' },
  { level: 'High', count: 87, color: '#F59E0B' },
  { level: 'Medium', count: 342, color: '#8B5CF6' },
  { level: 'Low', count: 1704, color: '#10B981' },
];
