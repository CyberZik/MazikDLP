import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  Clock,
  Building2,
  Target,
  Download,
  ChevronDown,
  AlertTriangle,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  departmentStats,
  topRiskUsers,
  policyViolations,
  categoryTrends,
  detectionTrends,
  riskDistribution,
  type AnalyticsSummary,
  type DailyTrend,
  type TopAppStat,
} from '../data/analyticsData';

// ─── Category Stat Type ───────────────────────────────────────────────────────

export interface CategoryStat {
  category: string;
  label: string;
  color: string;
  count: number;
}
import { analytics, logs } from '../lib/api';

// ─── Summary Icon Map ─────────────────────────────────────────────────────────

const summaryIcons: Record<string, React.ElementType> = {
  sessions: Activity,
  average: BarChart3,
  incident: ShieldAlert,
  prevented: Target,
  department: Building2,
  clock: Clock,
};

const summaryIconBg: Record<string, string> = {
  sessions: 'bg-primary-100 text-primary',
  average: 'bg-info-light text-info',
  incident: 'bg-danger-light text-danger',
  prevented: 'bg-success-light text-success',
  department: 'bg-warning-light text-warning',
  clock: 'bg-primary-100 text-primary-700',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#1F2937',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
};

// ─── Risk Level Styles ────────────────────────────────────────────────────────

const riskStyles: Record<string, string> = {
  critical: 'bg-danger-light text-danger',
  high: 'bg-warning-light text-warning',
  medium: 'bg-primary-100 text-primary',
  low: 'bg-success-light text-success',
};

// ─── Heatmap color scale ──────────────────────────────────────────────────────

function heatmapColor(value: number): string {
  if (value < 20) return '#F5F3FF';
  if (value < 60) return '#EDE9FE';
  if (value < 120) return '#DDD6FE';
  if (value < 200) return '#C4B5FD';
  if (value < 300) return '#A78BFA';
  if (value < 400) return '#8B5CF6';
  return '#7C3AED';
}

function heatmapTextColor(value: number): string {
  return value >= 300 ? '#FFFFFF' : '#6B7280';
}

// ─── Format number ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

export function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'users' | 'models'>('overview');
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [topApps, setTopApps] = useState<TopAppStat[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

    // Fetch security breakdown (action counts)
    analytics.categories(days).then(r => {
      if (r.data.length) setCategoryData(r.data);
    }).catch(() => {});

    Promise.all([
      logs.stats(),
      analytics.usage(days),
      analytics.apps(days),
    ]).then(([stats, usageData, appsData]) => {
      // Build summary KPIs from real stats
      const blockRate = stats.total_scans > 0
        ? ((stats.total_blocks / stats.total_scans) * 100).toFixed(1) + '%'
        : '0%';
      setAnalyticsSummary([
        { label: 'Total Scans', value: stats.total_scans.toLocaleString(), icon: 'sessions', change: 0, subtext: `Last ${days} days` },
        { label: 'Avg per Day', value: Math.round(stats.total_scans / days).toLocaleString(), icon: 'average', change: 0, subtext: 'Scans per day' },
        { label: 'Block Rate', value: blockRate, icon: 'incident', change: 0, subtext: 'Of total scans' },
        { label: 'Items Prevented', value: (stats.total_blocks + stats.total_masks).toLocaleString(), icon: 'prevented', change: 0, subtext: 'Sensitive items caught' },
        { label: 'Platforms Active', value: (appsData.data.length || 0).toString(), icon: 'department', change: 0, subtext: 'AI platforms used' },
        { label: 'Avg Response', value: ((stats as unknown as Record<string, number>).avg_response_ms ?? 0) + 'ms', icon: 'clock', change: 0, subtext: 'Detection latency' },
      ]);

      // Update daily trends from usage data
      if (usageData.data.length > 0) {
        setDailyTrends(usageData.data.map(d => ({
          date: d.date.slice(5),
          prompts: d.count,
          blocked: Math.round(d.count * (stats.total_blocks / Math.max(stats.total_scans, 1))),
          masked: Math.round(d.count * (stats.total_masks / Math.max(stats.total_scans, 1))),
          allowed: Math.round(d.count * (stats.total_allows / Math.max(stats.total_scans, 1))),
          incidents: Math.round(d.count * 0.012),
        })));
      }

      // Update top apps
      if (appsData.data.length > 0) {
        setTopApps(appsData.data.slice(0, 6).map(a => ({
          name: a.platform ?? 'Unknown',
          prompts: a.count,
          users: 0,
          blocked: Math.round(a.count * 0.04),
          avgPerUser: 0,
          growth: 0,
        })));
      }
    }).catch(() => {});
  }, [timeRange]);

  const tabs = [
    { key: 'overview' as const, label: 'Usage Overview', icon: BarChart3 },
    { key: 'security' as const, label: 'Security Insights', icon: ShieldAlert },
    { key: 'users' as const, label: 'User Analytics', icon: Users },
    { key: 'models' as const, label: 'Model & App Analysis', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            Deep insights into AI usage patterns, security events, and organizational trends
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-xs font-medium text-muted outline-none shadow-soft focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="finance">Finance</option>
              <option value="marketing">Marketing</option>
              <option value="hr">HR</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-subtle" />
          </div>
          <div className="flex items-center rounded-lg border border-border bg-card shadow-soft">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-primary text-white rounded-lg shadow-sm'
                    : 'text-muted hover:text-deep'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted shadow-soft transition-colors hover:bg-page hover:text-deep">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Summary KPIs ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {analyticsSummary.map((item) => {
          const Icon = summaryIcons[item.icon] || Activity;
          const iconBg = summaryIconBg[item.icon] || 'bg-primary-100 text-primary';
          return (
            <div
              key={item.label}
              className="rounded-xl border border-divider bg-card p-4 shadow-soft transition-all hover:shadow-card hover:border-border"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {item.change !== 0 && (
                  <div
                    className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                      item.change > 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {item.change > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(item.change)}%
                  </div>
                )}
              </div>
              <p className="mt-3 text-xl font-bold text-deep">{item.value}</p>
              <p className="mt-0.5 text-[11px] text-muted">{item.label}</p>
              <p className="text-[10px] text-subtle">{item.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl border border-divider bg-card p-1 shadow-soft">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:bg-page hover:text-deep'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && <OverviewTab dailyTrends={dailyTrends} topApps={topApps} />}
      {activeTab === 'security' && <SecurityTab dailyTrends={dailyTrends} />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'models' && <ModelsTab topApps={topApps} categoryData={categoryData} />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OVERVIEW TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function OverviewTab({ dailyTrends, topApps }: { dailyTrends: DailyTrend[]; topApps: TopAppStat[] }) {
  return (
    <div className="space-y-6">
      {/* AI Usage Over Time */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-deep">AI Usage Trend</h2>
            <p className="text-xs text-muted">Daily prompt volume with breakdown over 30 days</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Total Prompts', color: '#8B5CF6' },
              { label: 'Allowed', color: '#10B981' },
              { label: 'Masked', color: '#F59E0B' },
              { label: 'Blocked', color: '#EF4444' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={dailyTrends}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              stroke="#E5E7EB"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              interval={2}
            />
            <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="prompts"
              stroke="#8B5CF6"
              fill="url(#areaGrad)"
              strokeWidth={2}
              name="Total Prompts"
            />
            <Line
              type="monotone"
              dataKey="allowed"
              stroke="#10B981"
              strokeWidth={1.5}
              dot={false}
              name="Allowed"
            />
            <Line
              type="monotone"
              dataKey="masked"
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
              name="Masked"
            />
            <Line
              type="monotone"
              dataKey="blocked"
              stroke="#EF4444"
              strokeWidth={1.5}
              dot={false}
              name="Blocked"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row: Category Trends + Top Apps */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Prompt Category Trends */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Prompt Category Trends</h2>
            <p className="text-xs text-muted">How AI usage types evolve week over week</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={categoryTrends}>
              <defs>
                {[
                  { key: 'coding', color: '#8B5CF6' },
                  { key: 'dataAnalysis', color: '#3B82F6' },
                  { key: 'research', color: '#10B981' },
                  { key: 'docGen', color: '#F59E0B' },
                  { key: 'business', color: '#EF4444' },
                  { key: 'learning', color: '#6D28D9' },
                ].map((item) => (
                  <linearGradient key={item.key} id={`cat-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="coding" stroke="#8B5CF6" fill="url(#cat-coding)" strokeWidth={2} name="Coding" />
              <Area type="monotone" dataKey="dataAnalysis" stroke="#3B82F6" fill="url(#cat-dataAnalysis)" strokeWidth={2} name="Data Analysis" />
              <Area type="monotone" dataKey="research" stroke="#10B981" fill="url(#cat-research)" strokeWidth={2} name="Research" />
              <Area type="monotone" dataKey="docGen" stroke="#F59E0B" fill="url(#cat-docGen)" strokeWidth={2} name="Doc Gen" />
              <Area type="monotone" dataKey="business" stroke="#EF4444" fill="url(#cat-business)" strokeWidth={1.5} name="Business" />
              <Area type="monotone" dataKey="learning" stroke="#6D28D9" fill="url(#cat-learning)" strokeWidth={1.5} name="Learning" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top AI Applications */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Top AI Applications</h2>
            <p className="text-xs text-muted">Prompt volume and growth by platform</p>
          </div>
          <div className="space-y-4">
            {topApps.map((app, i) => {
              const maxPrompts = topApps[0].prompts;
              const barWidth = (app.prompts / maxPrompts) * 100;
              return (
                <div key={app.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium text-deep">{app.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-deep">{fmt(app.prompts)}</span>
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-medium ${
                          app.growth > 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {app.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(app.growth)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-primary-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-400 transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-subtle">
                    <span>{app.users.toLocaleString()} users</span>
                    <span>•</span>
                    <span>{app.blocked.toLocaleString()} blocked</span>
                    <span>•</span>
                    <span>{app.avgPerUser} avg/user</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SECURITY TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SecurityTab({ dailyTrends }: { dailyTrends: DailyTrend[] }) {
  return (
    <div className="space-y-6">
      {/* Policy Violations + Detection Trends */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Policy Violations by Category */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Policy Violations by Category</h2>
            <p className="text-xs text-muted">Weekly breakdown of violation types</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={policyViolations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#6B7280' }}
              />
              <Bar dataKey="pii" name="PII" fill="#8B5CF6" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="credentials" name="Credentials" fill="#EF4444" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="sourceCode" name="Source Code" fill="#F59E0B" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="apiKeys" name="API Keys" fill="#3B82F6" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="dbSchema" name="DB Schema" fill="#10B981" radius={[2, 2, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detection Type Trends */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Detection Trends</h2>
            <p className="text-xs text-muted">Sensitive data type detections over time</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={detectionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#6B7280' }}
              />
              <Line type="monotone" dataKey="email" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Email" />
              <Line type="monotone" dataKey="sourceCode" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Source Code" />
              <Line type="monotone" dataKey="pan" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="PAN" />
              <Line type="monotone" dataKey="phone" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2 }} name="Phone" />
              <Line type="monotone" dataKey="credentials" stroke="#10B981" strokeWidth={1.5} dot={{ r: 2 }} name="Credentials" />
              <Line type="monotone" dataKey="aadhaar" stroke="#6D28D9" strokeWidth={1.5} dot={{ r: 2 }} name="Aadhaar" />
              <Line type="monotone" dataKey="apiKeys" stroke="#EC4899" strokeWidth={1.5} dot={{ r: 2 }} name="API Keys" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution + Incidents Timeline */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Risk Distribution Donut */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">User Risk Distribution</h2>
            <p className="text-xs text-muted">How users are classified by risk</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="count"
                nameKey="level"
                paddingAngle={3}
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {riskDistribution.map((item) => (
              <div key={item.level} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted">{item.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-deep">{item.count}</span>
                  <span className="text-[10px] text-subtle">
                    ({((item.count / 2156) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Incidents Timeline */}
        <div className="col-span-1 rounded-xl border border-divider bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Incident Volume Over Time</h2>
            <p className="text-xs text-muted">Daily security incidents detected across the organization</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyTrends}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 10 }} interval={2} />
              <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#EF4444"
                fill="url(#incidentGrad)"
                strokeWidth={2}
                name="Incidents"
              />
              <Bar dataKey="blocked" fill="#FCA5A5" radius={[2, 2, 0, 0]} name="Blocked" barSize={8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Security Table */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-deep">Department Security Overview</h2>
            <p className="text-xs text-muted">Security posture and violation metrics by department</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-warning-light px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-[11px] font-medium text-warning">2 departments need attention</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider">
                {['Department', 'Users', 'Prompts', 'Blocked', 'Masked', 'Violation Rate', 'Risk Level', 'Top App'].map((h) => (
                  <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept) => (
                <tr key={dept.name} className="border-b border-divider transition-colors hover:bg-page">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-deep">{dept.name}</span>
                        <p className="text-[10px] text-subtle">{dept.topCategory}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-sm text-muted">{dept.users}</td>
                  <td className="py-3.5 text-sm font-medium text-deep">{dept.prompts.toLocaleString()}</td>
                  <td className="py-3.5 text-sm font-medium text-danger">{dept.blocked.toLocaleString()}</td>
                  <td className="py-3.5 text-sm text-warning">{dept.masked.toLocaleString()}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-divider">
                        <div
                          className={`h-full rounded-full ${
                            dept.violationRate > 7
                              ? 'bg-danger'
                              : dept.violationRate > 4
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${Math.min(dept.violationRate * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-deep">{dept.violationRate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${riskStyles[dept.riskLevel]}`}>
                      {dept.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-muted">{dept.topApp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  USERS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function UsersTab() {
  const radarData = departmentStats.map((d) => ({
    department: d.name,
    prompts: Math.round(d.prompts / 500),
    violations: Math.round(d.violationRate * 10),
    users: Math.round(d.users / 10),
  }));

  return (
    <div className="space-y-6">
      {/* Top Risk Users + Department Radar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Top Risk Users */}
        <div className="col-span-1 rounded-xl border border-divider bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-deep">Highest Risk Users</h2>
              <p className="text-xs text-muted">Users with the most policy violations and risk exposure</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-danger-light px-3 py-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-danger" />
              <span className="text-[11px] font-medium text-danger">2 critical risk users</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  {['User', 'Department', 'Prompts', 'Violations', 'Risk Score', 'Risk Level', 'Last Active', 'Platform'].map(
                    (h) => (
                      <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {topRiskUsers.map((user) => (
                  <tr key={user.email} className="border-b border-divider transition-colors hover:bg-page">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-200 text-[10px] font-bold text-primary-800">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-deep">{user.name}</p>
                          <p className="text-[10px] text-subtle">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted">{user.department}</td>
                    <td className="py-3 text-xs font-medium text-deep">{user.prompts.toLocaleString()}</td>
                    <td className="py-3 text-xs font-medium text-danger">{user.violations}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 rounded-full bg-divider">
                          <div
                            className={`h-full rounded-full transition-all ${
                              user.riskScore > 80
                                ? 'bg-danger'
                                : user.riskScore > 60
                                ? 'bg-warning'
                                : user.riskScore > 30
                                ? 'bg-primary'
                                : 'bg-success'
                            }`}
                            style={{ width: `${user.riskScore}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-deep">{user.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${riskStyles[user.riskLevel]}`}>
                        {user.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-subtle">{user.lastActive}</td>
                    <td className="py-3 text-xs text-muted">{user.topPlatform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Radar */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Department Comparison</h2>
            <p className="text-xs text-muted">Multi-dimensional view of department activity</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="department" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} />
              <Radar name="Prompts" dataKey="prompts" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Violations" dataKey="violations" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#6B7280' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Activity Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Active Users', value: '2,156', sub: 'Last 30 days', color: 'bg-primary-100 text-primary', icon: Users },
          { label: 'Users with Violations', value: '487', sub: '22.6% of active users', color: 'bg-danger-light text-danger', icon: ShieldAlert },
          { label: 'Avg Risk Score', value: '28.4', sub: 'Out of 100', color: 'bg-warning-light text-warning', icon: Target },
          { label: 'New Users This Month', value: '134', sub: '+6.6% growth', color: 'bg-success-light text-success', icon: TrendingUp },
        ].map((card) => {
          const CardIcon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-divider bg-card p-4 shadow-soft">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.color}`}>
                <CardIcon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-deep">{card.value}</p>
              <p className="mt-0.5 text-xs text-muted">{card.label}</p>
              <p className="text-[10px] text-subtle">{card.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MODELS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  coding: ['python', 'debug', 'function', 'api', 'deploy'],
  writing: ['write', 'draft', 'essay', 'blog', 'email'],
  research: ['explain', 'research', 'compare', 'study', 'overview'],
  data_analysis: ['analyze', 'dataset', 'csv', 'statistics', 'chart'],
  financial: ['invoice', 'budget', 'revenue', 'tax', 'payroll'],
  legal: ['contract', 'compliance', 'gdpr', 'nda', 'clause'],
  hr_recruitment: ['resume', 'interview', 'onboarding', 'okr', 'appraisal'],
  customer_support: ['ticket', 'refund', 'complaint', 'escalate', 'faq'],
  healthcare: ['patient', 'diagnosis', 'clinical', 'prescription', 'symptom'],
  miscellaneous: ['other', 'general', 'mixed'],
};

function ModelsTab({ topApps, categoryData }: { topApps: TopAppStat[]; categoryData: CategoryStat[] }) {
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const platformAgg = topApps.map((app) => ({
    name: app.name,
    value: app.prompts,
  }));
  const totalPlatformPrompts = platformAgg.reduce((s, p) => s + p.value, 0);

  const PLATFORM_COLORS = ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

  // Category pie data (from API or empty)
  const catPieData = categoryData.length > 0
    ? categoryData.filter(c => c.count > 0)
    : [];
  const totalCatCount = catPieData.reduce((s, c) => s + c.count, 0);

  // Unique platforms for filter dropdown
  const uniquePlatforms = Array.from(new Set(topApps.map(a => a.name)));

  // Filtered app rows
  const filteredApps = platformFilter === 'all' ? topApps : topApps.filter(a => a.name === platformFilter);

  // Top category for a platform row (mock: pick from categoryData by index if available)
  function getTopCategoryLabel(index: number): { label: string; color: string } | null {
    if (categoryData.length === 0) return null;
    const cat = categoryData[index % categoryData.length];
    return cat ? { label: cat.label, color: cat.color } : null;
  }

  return (
    <div className="space-y-6">
      {/* Top section: two side-by-side donut charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* AI App Distribution */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">AI App Distribution</h2>
            <p className="text-xs text-muted">Prompt volume share across AI platforms</p>
          </div>
          {platformAgg.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformAgg}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {platformAgg.map((_, index) => (
                      <Cell key={`cell-app-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {platformAgg.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS[i % PLATFORM_COLORS.length] }} />
                      <span className="text-xs text-muted">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-deep">
                      {totalPlatformPrompts > 0 ? ((item.value / totalPlatformPrompts) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-subtle">No platform data available</div>
          )}
        </div>

        {/* Prompt Category Distribution */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-deep">Prompt Category Distribution</h2>
            <p className="text-xs text-muted">How prompts are classified by usage type</p>
          </div>
          {catPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={catPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="label"
                    paddingAngle={3}
                  >
                    {catPieData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {catPieData.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-deep">
                      {totalCatCount > 0 ? ((item.count / totalCatCount) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-subtle">No category data yet — data populates as prompts are scanned</div>
          )}
        </div>
      </div>

      {/* App Usage Table with platform filter */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-deep">App Usage Details</h2>
            <p className="text-xs text-muted">Prompt volume, block rates, and top category per platform</p>
          </div>
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-8 text-xs font-medium text-muted outline-none shadow-soft focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Platforms</option>
              {uniquePlatforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-subtle" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider">
                {['Platform', 'Total Prompts', 'Blocked', 'Masked', 'Block Rate', 'Top Category'].map((h) => (
                  <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app, i) => {
                const blockRate = app.prompts > 0 ? ((app.blocked / app.prompts) * 100) : 0;
                const topCat = getTopCategoryLabel(i);
                return (
                  <tr key={app.name} className="border-b border-divider transition-colors hover:bg-page">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-deep">{app.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-sm font-medium text-deep">{app.prompts.toLocaleString()}</td>
                    <td className="py-3.5 text-sm font-medium text-danger">{app.blocked.toLocaleString()}</td>
                    <td className="py-3.5 text-xs text-warning">{Math.round(app.prompts * 0.08).toLocaleString()}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-divider">
                          <div
                            className={`h-full rounded-full ${
                              blockRate > 5 ? 'bg-danger' : blockRate > 3 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${Math.min(blockRate * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-deep">{blockRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      {topCat ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: topCat.color }}
                        >
                          {topCat.label}
                        </span>
                      ) : (
                        <span className="text-xs text-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-deep">Category Breakdown</h2>
          <p className="text-xs text-muted">Prompt count and share by usage category</p>
        </div>
        {categoryData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  {['Category', 'Count', 'Share', 'Keywords', 'Distribution'].map((h) => (
                    <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryData.filter(c => c.count > 0).map((cat) => {
                  const share = totalCatCount > 0 ? (cat.count / totalCatCount) * 100 : 0;
                  const keywords = CATEGORY_KEYWORDS[cat.category] ?? [];
                  return (
                    <tr key={cat.category} className="border-b border-divider transition-colors hover:bg-page">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium text-deep">{cat.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-sm font-semibold text-deep">{cat.count.toLocaleString()}</td>
                      <td className="py-3.5 text-xs font-medium text-muted">{share.toFixed(1)}%</td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: cat.color + '20', color: cat.color }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 w-40">
                        <div className="h-2 rounded-full bg-divider">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${share}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-subtle">
            No category data yet — categories are assigned as prompts are scanned through the extension
          </div>
        )}
      </div>
    </div>
  );
}
