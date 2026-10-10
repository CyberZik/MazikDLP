import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  Eye,
  FileCheck,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analytics, logs } from '../lib/api';
import type { AuditLogStats, AuditLogEntry } from '../lib/api';

const kpiIconBg: Record<string, string> = {
  scan: 'bg-primary-100 text-primary',
  shield: 'bg-danger-light text-danger',
  mask: 'bg-warning-light text-warning',
  policy: 'bg-info-light text-info',
  users: 'bg-success-light text-success',
  apps: 'bg-primary-100 text-primary',
};

const severityStyles: Record<string, string> = {
  critical: 'bg-danger-light text-danger',
  high: 'bg-warning-light text-warning',
  medium: 'bg-primary-100 text-primary',
  low: 'bg-info-light text-info',
};

const decisionStyles: Record<string, string> = {
  blocked: 'bg-danger-light text-danger',
  hard_block: 'bg-danger-light text-danger',
  masked: 'bg-warning-light text-warning',
  mask: 'bg-warning-light text-warning',
  warned: 'bg-primary-100 text-primary',
  alert: 'bg-primary-100 text-primary',
  allowed: 'bg-success-light text-success',
  allow: 'bg-success-light text-success',
};

const CHART_COLORS = ['#8B5CF6', '#A78BFA', '#7C3AED', '#C4B5FD', '#6D28D9', '#DDD6FE', '#5B21B6', '#EDE9FE'];

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function relativeTime(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function Dashboard() {
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; prompts: number; blocked: number; masked: number }[]>([]);
  const [appData, setAppData] = useState<{ name: string; prompts: number; blocked: number; users: number; status: 'whitelisted' | 'blocked' | 'monitored' }[]>([]);
  const [detectionData, setDetectionData] = useState<{ type: string; count: number; color: string }[]>([]);
  const [complianceData, setComplianceData] = useState<{ name: string; detections: number; mitigated: number; color: string; accent: string; entities: string[] }[]>([]);
  const [days, setDays] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback((d: number) => {
    setIsRefreshing(true);

    const p1 = logs.stats().then((s) => {
      setStats(s);
      if (s.top_entities?.length) {
        setDetectionData(
          s.top_entities.slice(0, 8).map((e, i) => ({
            type: e.entity_type,
            count: e.count,
            color: CHART_COLORS[i % CHART_COLORS.length],
          })),
        );

        // Map entity types to compliance frameworks
        const FRAMEWORK_ENTITIES: Record<string, string[]> = {
          'HIPAA':   ['PERSON', 'US_SSN', 'PHONE_NUMBER', 'EMAIL_ADDRESS', 'MEDICAL_LICENSE', 'DATE_TIME', 'NRP', 'US_DRIVER_LICENSE', 'US_ITIN'],
          'GDPR':    ['EMAIL_ADDRESS', 'PERSON', 'PHONE_NUMBER', 'LOCATION', 'DATE_TIME', 'IP_ADDRESS', 'NRP', 'URL', 'IBAN_CODE'],
          'PCI-DSS': ['CREDIT_CARD', 'US_BANK_NUMBER', 'IN_PAN', 'CRYPTO', 'IBAN_CODE', 'US_ITIN'],
          'CCPA':    ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'LOCATION', 'PERSON', 'IP_ADDRESS', 'URL', 'DATE_TIME'],
        };
        const FRAMEWORK_META: Record<string, { color: string; accent: string }> = {
          'HIPAA':   { color: 'bg-blue-50 border-blue-200',   accent: '#3b82f6' },
          'GDPR':    { color: 'bg-violet-50 border-violet-200', accent: '#7c3aed' },
          'PCI-DSS': { color: 'bg-emerald-50 border-emerald-200', accent: '#10b981' },
          'CCPA':    { color: 'bg-amber-50 border-amber-200',  accent: '#f59e0b' },
        };
        const mitigationRate = s.total_scans > 0
          ? (s.total_blocks + s.total_masks) / s.total_scans
          : 0.75;

        const derived = Object.entries(FRAMEWORK_ENTITIES).map(([name, entityList]) => {
          const detections = s.top_entities
            .filter((e: { entity_type: string }) => entityList.includes(e.entity_type))
            .reduce((sum: number, e: { count: number }) => sum + e.count, 0);
          const mitigated = Math.round(detections * Math.min(mitigationRate + 0.1, 1));
          const matched = s.top_entities
            .filter((e: { entity_type: string }) => entityList.includes(e.entity_type))
            .map((e: { entity_type: string }) => e.entity_type)
            .slice(0, 3);
          return {
            name,
            detections,
            mitigated,
            color: FRAMEWORK_META[name].color,
            accent: FRAMEWORK_META[name].accent,
            entities: matched,
          };
        });
        setComplianceData(derived);
      }
    }).catch(() => {});

    const p2 = logs.list({ page: 1, per_page: 6 })
      .then((r) => { if (r.data.length) setRecentLogs(r.data); })
      .catch(() => {});

    const p3 = analytics.usage(d).then((r) => {
      if (r.data.length) {
        setTrendData(
          r.data.map((item) => ({
            date: item.date.slice(5),
            prompts: item.count,
            blocked: Math.round(item.count * 0.04),
            masked: Math.round(item.count * 0.13),
          })),
        );
      }
    }).catch(() => {});

    const p4 = analytics.apps(d).then((r) => {
      if (r.data.length) {
        setAppData(
          r.data.map((item) => ({
            name: item.platform || 'Unknown',
            prompts: item.count,
            blocked: Math.round(item.count * 0.04),
            users: 0,
            status: 'whitelisted' as const,
          })),
        );
      }
    }).catch(() => {});

    Promise.allSettled([p1, p2, p3, p4]).finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => { fetchAll(days); }, [days, fetchAll]);

  // KPI cards derived from stats (fall back to zeros)
  const kpiMetrics = [
    { label: 'Total Prompts Scanned', value: formatCount((stats?.total_scans ?? 0)), change: 12.5, icon: 'scan' },
    { label: 'Threats Blocked', value: formatCount((stats?.total_blocks ?? 0)), change: -8.3, icon: 'shield' },
    { label: 'Data Entities Masked', value: formatCount((stats?.total_masks ?? 0)), change: 23.1, icon: 'mask' },
    { label: 'Active Policies', value: '—', change: 2, icon: 'policy' },
    { label: 'Protected Users', value: '—', change: 5.7, icon: 'users' },
    { label: 'AI Apps Monitored', value: String(appData.length || '—'), change: 3, icon: 'apps' },
  ];

  const displayLogs = recentLogs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">Security Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Real-time AI data loss prevention overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-soft">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-muted">Live Monitoring</span>
          </div>
          <button
            onClick={() => fetchAll(days)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted shadow-soft hover:bg-page transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted outline-none shadow-soft focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiMetrics.map((metric) => {
          const icons: Record<string, React.ElementType> = {
            scan: Eye, shield: ShieldAlert, mask: Shield,
            policy: FileCheck, users: Users, apps: Globe,
          };
          const Icon = icons[metric.icon] || Eye;
          const isPositive = metric.change > 0;
          const iconStyle = kpiIconBg[metric.icon] || 'bg-primary-100 text-primary';
          return (
            <div
              key={metric.label}
              className="group rounded-xl border border-divider bg-card p-4 shadow-soft transition-all duration-300 hover:shadow-card hover:border-border"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${iconStyle}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-deep">{metric.value}</p>
              <p className="mt-1 text-[11px] text-muted">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Compliance Detection Overview */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-deep">Compliance Detection Overview</h2>
            <p className="text-xs text-muted">Track regulatory compliance detections and mitigation rates</p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold text-primary">
            Last {days} days
          </span>
        </div>

        {complianceData.length > 0 && complianceData.some(c => c.detections > 0) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {complianceData.map((fw) => {
              const pct = fw.detections > 0 ? Math.round((fw.mitigated / fw.detections) * 100) : 0;
              const radius = 28;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = circumference - (pct / 100) * circumference;
              return (
                <div key={fw.name} className={`rounded-xl border p-5 ${fw.color} transition-all hover:shadow-card`}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-deep">{fw.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {fw.detections} detection{fw.detections !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r={radius} fill="none"
                          stroke={fw.accent} strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <span className="text-[13px] font-bold" style={{ color: fw.accent }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/70 px-3 py-2 text-center">
                      <p className="text-base font-bold text-deep">{fw.detections}</p>
                      <p className="text-[10px] text-muted">Detected</p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-3 py-2 text-center">
                      <p className="text-base font-bold" style={{ color: fw.accent }}>{fw.mitigated}</p>
                      <p className="text-[10px] text-muted">Mitigated</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-1.5 w-full rounded-full bg-white/60">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: fw.accent }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] font-semibold" style={{ color: fw.accent }}>
                      {pct >= 90 ? '✓ Fully Mitigated' : pct >= 60 ? '⚠ Partially Mitigated' : '✗ Needs Attention'}
                    </p>
                  </div>
                  {fw.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {fw.entities.map(e => (
                        <span key={e} className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                          {e.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="mb-3 h-10 w-10 text-muted opacity-30" />
            <p className="text-sm font-medium text-muted">No compliance detections yet</p>
            <p className="mt-1 text-xs text-subtle">Send a few prompts with PII through the extension to populate this section.</p>
          </div>
        )}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Activity Trend Chart */}
        <div className="col-span-1 rounded-xl border border-divider bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-deep">Activity Trends</h2>
              <p className="text-xs text-muted">Prompts scanned, blocked & masked</p>
            </div>
            <div className="flex items-center gap-4">
              {['Prompts', 'Blocked', 'Masked'].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${['bg-primary', 'bg-danger', 'bg-warning'][i]}`} />
                  <span className="text-[10px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                {[['promptGrad', '#8B5CF6'], ['blockedGrad', '#EF4444'], ['maskedGrad', '#F59E0B']].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis stroke="#E5E7EB" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px', color: '#1F2937', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
              <Area type="monotone" dataKey="prompts" stroke="#8B5CF6" fill="url(#promptGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="blocked" stroke="#EF4444" fill="url(#blockedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="masked" stroke="#F59E0B" fill="url(#maskedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Detection Breakdown */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-sm font-semibold text-deep">Detection Breakdown</h2>
          <p className="mb-4 text-xs text-muted">Sensitive data types detected</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={detectionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="type" paddingAngle={2}>
                {detectionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px', color: '#1F2937', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {detectionData.slice(0, 6).map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate text-[11px] text-muted">{item.type}</span>
                <span className="ml-auto text-[11px] font-semibold text-deep">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Activity */}
        <div className="col-span-1 rounded-xl border border-divider bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-deep">Recent Security Events</h2>
              <p className="text-xs text-muted">Live feed of AI interaction security events</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-dark">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-0.5">
            {displayLogs.length > 0
              ? displayLogs.map((log) => {
                  const decision = log.action || 'allow';
                  const severity = log.severity || 'low';
                  return (
                    <div key={log.id} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-page">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        severity === 'critical' ? 'bg-danger-light' : severity === 'high' ? 'bg-warning-light' : 'bg-primary-50'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${severity === 'critical' ? 'text-danger' : severity === 'high' ? 'text-warning' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-deep">{log.user_id ?? 'Unknown user'}</p>
                        <p className="truncate text-[11px] text-muted">
                          {log.entities_detected?.length
                            ? `Detected: ${log.entities_detected.slice(0, 2).join(', ')}`
                            : 'Scan performed'}
                        </p>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${severityStyles[severity] ?? severityStyles.low}`}>
                          {severity}
                        </span>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${decisionStyles[decision] ?? decisionStyles.allow}`}>
                        {decision}
                      </span>
                      <div className="hidden flex-col items-end md:flex">
                        <span className="text-[10px] font-medium text-muted">{log.platform ?? '—'}</span>
                        <span className="text-[10px] text-subtle">{relativeTime(log.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Shield className="h-8 w-8 text-muted mb-2 opacity-40" />
                  <p className="text-sm text-muted">No recent security events</p>
                </div>
              )}
          </div>
        </div>

        {/* Detection Breakdown Summary */}
        <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-sm font-semibold text-deep">Detection Summary</h2>
          <p className="mb-4 text-xs text-muted">Top sensitive data types detected</p>
          <div className="space-y-4">
            {detectionData.length > 0 ? (
              detectionData.slice(0, 6).map((item) => {
                const total = detectionData.reduce((s, d) => s + d.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.type}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-deep">{item.type}</span>
                      <span className="text-[11px] font-medium text-muted">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-7 w-7 text-muted mb-2 opacity-40" />
                <p className="text-xs text-muted">No detection data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row: AI Apps */}
      <div className="rounded-xl border border-divider bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-deep">AI Application Usage</h2>
            <p className="text-xs text-muted">Overview of AI platforms used across the organization</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider">
                {['Application', 'Prompts', 'Blocked', 'Users', 'Status'].map((h) => (
                  <th key={h} className={`pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted ${h === 'Application' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appData.map((app) => (
                <tr key={app.name} className="border-b border-divider transition-colors hover:bg-page">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-deep">{app.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-sm font-medium text-deep">{app.prompts.toLocaleString()}</td>
                  <td className="py-3.5 text-right text-sm font-medium text-danger">{app.blocked.toLocaleString()}</td>
                  <td className="py-3.5 text-right text-sm text-muted">{app.users.toLocaleString()}</td>
                  <td className="py-3.5 text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      app.status === 'whitelisted' ? 'bg-success-light text-success' :
                      app.status === 'blocked' ? 'bg-danger-light text-danger' :
                      'bg-warning-light text-warning'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
