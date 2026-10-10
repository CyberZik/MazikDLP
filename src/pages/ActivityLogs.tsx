import { useState, useMemo, useEffect } from 'react';
import {
  ScrollText, Search, Filter, Download, RefreshCw,
  X, Eye, Copy, Clock, Shield, AlertTriangle, CheckCircle, XCircle, Info,
  User, Globe, Cpu, Hash, FileText, ChevronLeft, ChevronRight, BarChart3,
  Activity, Zap, ArrowUpDown, ExternalLink, AlertOctagon
} from 'lucide-react';
import {
  logStatsData, hourlyActivity, decisionDistribution,
  departmentBreakdown, filterOptions, LogEntry
} from '../data/activityLogsData';
import { logs as logsApi } from '../lib/api';
import type { AuditLogEntry } from '../lib/api';

type TabType = 'logs' | 'timeline' | 'insights';

function apiToLogEntry(e: AuditLogEntry): LogEntry {
  const decision = (e.action === 'hard_block' || e.action === 'soft_block')
    ? (e.action === 'hard_block' ? 'blocked' : 'soft_blocked')
    : e.action === 'mask' ? 'masked'
    : e.action === 'alert' ? 'warned'
    : 'allowed';
  const entityType = e.entities_detected?.[0] ?? 'UNKNOWN';
  return {
    id: e.id,
    timestamp: new Date(e.created_at).toLocaleString(),
    isoTimestamp: e.created_at,
    user: e.user_id ?? 'Unknown',
    email: '',
    department: '',
    role: '',
    platform: e.platform ?? 'Unknown',
    model: e.model ?? '',
    entityType,
    entityCategory: 'pii',
    severity: (e.severity as LogEntry['severity']) ?? 'low',
    decision: decision as LogEntry['decision'],
    action: e.action,
    promptPreview: '',
    promptHash: '',
    detectedEntities: (e.entities_detected ?? []).map((t) => ({ type: t, value: '', confidence: 1 })),
    policyMatched: e.policy_name ?? '',
    policyAction: e.action,
    sessionId: e.session_id ?? '',
    ipAddress: e.ip_address ?? '',
    userAgent: '',
    responseTime: e.response_time_ms ?? 0,
    masked: e.action === 'mask',
  };
}

export function ActivityLogs() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    logsApi.list({ page: 1, per_page: 200 })
      .then((r) => {
        setAllLogs(r.data.length > 0 ? r.data.map(apiToLogEntry) : []);
      })
      .catch(() => { setAllLogs([]); })
      .finally(() => setIsLoading(false));
  };

  const [isLive, setIsLive] = useState(true);
  
  useEffect(() => {
    fetchLogs();
    let interval: ReturnType<typeof setInterval>;
    if (isLive) {
      interval = setInterval(() => {
        fetchLogs();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedDecision, setSelectedDecision] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const pageSize = 15;

  const filteredLogs = useMemo(() => {
    let result = [...allLogs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.user.toLowerCase().includes(q) ||
        log.email.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        log.platform.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.promptPreview.toLowerCase().includes(q)
      );
    }

    if (selectedSeverity !== 'all') result = result.filter(l => l.severity === selectedSeverity);
    if (selectedDecision !== 'all') result = result.filter(l => l.decision === selectedDecision);
    if (selectedPlatform !== 'all') result = result.filter(l => l.platform === selectedPlatform);
    if (selectedCategory !== 'all') result = result.filter(l => l.entityCategory === selectedCategory);
    if (selectedDepartment !== 'all') result = result.filter(l => l.department === selectedDepartment);

    if (sortField === 'severity') {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      result.sort((a, b) => sortDirection === 'desc'
        ? order[b.severity] - order[a.severity]
        : order[a.severity] - order[b.severity]);
    } else if (sortField === 'responseTime') {
      result.sort((a, b) => sortDirection === 'desc'
        ? b.responseTime - a.responseTime
        : a.responseTime - b.responseTime);
    }

    return result;
  }, [allLogs, searchQuery, selectedSeverity, selectedDecision, selectedPlatform, selectedCategory, selectedDepartment, selectedDateRange, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = [selectedSeverity, selectedDecision, selectedPlatform, selectedCategory, selectedDepartment, selectedDateRange]
    .filter(f => f !== 'all').length;

  const clearFilters = () => {
    setSelectedSeverity('all');
    setSelectedDecision('all');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedDateRange('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const severityConfig: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    low: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    info: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  };

  const decisionConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    allowed: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
    blocked: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
    masked: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Shield },
    warned: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: AlertTriangle },
    soft_blocked: { bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertOctagon },
  };

  const categoryLabels: Record<string, string> = {
    pii: 'PII', credentials: 'Credentials', source_code: 'Source Code',
    api_keys: 'API Keys', db_schema: 'DB Schema', custom: 'Custom',
    policy: 'Policy', auth: 'Auth', system: 'System',
  };

  const tabs: { id: TabType; label: string; icon: typeof ScrollText }[] = [
    { id: 'logs', label: 'Event Logs', icon: ScrollText },
    { id: 'timeline', label: 'Activity Timeline', icon: Activity },
    { id: 'insights', label: 'Log Insights', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">Activity Logs</h1>
          <p className="mt-1 text-sm text-muted">Comprehensive audit trail of all AI interactions and security events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isLive ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-white text-muted ring-1 ring-border'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-muted ring-1 ring-border hover:bg-page transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={fetchLogs} disabled={isLoading} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-muted ring-1 ring-border hover:bg-page transition-colors disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Total Events', value: logStatsData.totalLogs.toLocaleString(), icon: ScrollText, color: 'text-primary', bg: 'bg-primary-50' },
          { label: 'Today', value: logStatsData.todayLogs.toLocaleString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Blocked', value: logStatsData.blockedToday.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Masked', value: logStatsData.maskedToday.toString(), icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Critical', value: logStatsData.criticalEvents.toString(), icon: AlertOctagon, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg Response', value: `${logStatsData.avgResponseTime}ms`, icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-card ring-1 ring-divider">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-deep">{stat.value}</p>
                <p className="text-[11px] text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-divider">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-deep'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="Search by user, action, entity, platform, or log ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-deep placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-subtle hover:text-muted" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ring-1 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-50 text-primary ring-primary-200'
                  : 'bg-white text-muted ring-border hover:bg-page'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="rounded-xl bg-white p-4 shadow-card ring-1 ring-divider">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-deep">Advanced Filters</h3>
                <button onClick={clearFilters} className="text-xs text-primary hover:text-primary-dark font-medium">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {/* Severity */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Severity</label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    {filterOptions.severities.map(s => (
                      <option key={s} value={s}>{s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                {/* Decision */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Decision</label>
                  <select
                    value={selectedDecision}
                    onChange={(e) => { setSelectedDecision(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    {filterOptions.decisions.map(d => (
                      <option key={d} value={d}>{d === 'all' ? 'All Decisions' : d.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                {/* Platform */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => { setSelectedPlatform(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    {filterOptions.platforms.map(p => (
                      <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p}</option>
                    ))}
                  </select>
                </div>
                {/* Category */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    {filterOptions.categories.map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'All Categories' : categoryLabels[c] || c}</option>
                    ))}
                  </select>
                </div>
                {/* Department */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    {filterOptions.departments.map(d => (
                      <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                    ))}
                  </select>
                </div>
                {/* Date Range */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted uppercase tracking-wider">Date Range</label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => { setSelectedDateRange(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-100"
                  >
                    <option value="all">All Time</option>
                    <option value="last_hour">Last Hour</option>
                    <option value="last_24h">Last 24 Hours</option>
                    <option value="last_7d">Last 7 Days</option>
                    <option value="last_30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-divider pt-3">
                  {selectedSeverity !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
                      Severity: {selectedSeverity}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSeverity('all')} />
                    </span>
                  )}
                  {selectedDecision !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
                      Decision: {selectedDecision}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDecision('all')} />
                    </span>
                  )}
                  {selectedPlatform !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
                      Platform: {selectedPlatform}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedPlatform('all')} />
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
                      Category: {categoryLabels[selectedCategory]}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                    </span>
                  )}
                  {selectedDepartment !== 'all' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
                      Dept: {selectedDepartment}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDepartment('all')} />
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing <span className="font-medium text-deep">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredLogs.length)}</span> of{' '}
              <span className="font-medium text-deep">{filteredLogs.length}</span> events
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Sort by:</span>
              <button
                onClick={() => handleSort('timestamp')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${sortField === 'timestamp' ? 'bg-primary-50 text-primary' : 'text-muted hover:text-deep'}`}
              >
                Time <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleSort('severity')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${sortField === 'severity' ? 'bg-primary-50 text-primary' : 'text-muted hover:text-deep'}`}
              >
                Severity <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleSort('responseTime')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${sortField === 'responseTime' ? 'bg-primary-50 text-primary' : 'text-muted hover:text-deep'}`}
              >
                Response <ArrowUpDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Log Table */}
          <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-divider">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-divider bg-page">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Event</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">User</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Platform</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Entity</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Severity</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Decision</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Response</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Time</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, idx) => {
                    const sev = severityConfig[log.severity] ?? severityConfig.info;
                    const dec = decisionConfig[log.decision] ?? decisionConfig.allowed;
                    const DecIcon = dec.icon;
                    return (
                      <tr
                        key={log.id}
                        className={`border-b border-divider transition-colors hover:bg-page/60 cursor-pointer ${
                          idx === 0 && isLive ? 'animate-pulse-once' : ''
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono text-subtle">{log.id}</span>
                            <span className="text-sm font-medium text-deep mt-0.5 max-w-[220px] truncate">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                              {log.user.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-deep">{log.user}</p>
                              <p className="text-[11px] text-subtle">{log.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-deep">{log.platform}</span>
                          <p className="text-[11px] text-subtle">{log.model}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-page px-2 py-0.5 text-xs font-mono font-medium text-deep ring-1 ring-divider">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sev.bg} ${sev.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${dec.bg} ${dec.text}`}>
                            <DecIcon className="h-3 w-3" />
                            {log.decision.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-muted">{log.responseTime}ms</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-subtle whitespace-nowrap">{log.timestamp}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="rounded-lg p-1.5 text-subtle hover:bg-primary-50 hover:text-primary transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-divider bg-page/50 px-4 py-3">
              <p className="text-xs text-muted">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'text-muted hover:bg-white hover:text-deep'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Hourly Activity Chart */}
          <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-divider">
            <h3 className="text-base font-semibold text-deep mb-4">Today's Hourly Activity</h3>
            <div className="flex items-end gap-1.5" style={{ height: 200 }}>
              {hourlyActivity.map((h) => {
                const maxCount = Math.max(...hourlyActivity.map(x => x.count));
                const height = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
                return (
                  <div key={h.hour} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-8 hidden group-hover:block z-10">
                      <div className="rounded-lg bg-deep px-2 py-1 text-[10px] font-medium text-white shadow-lg whitespace-nowrap">
                        {h.hour}: {h.count} events
                      </div>
                    </div>
                    <div
                      className="w-full rounded-t-sm bg-primary/20 transition-all group-hover:bg-primary/40"
                      style={{ height: `${height}%`, minHeight: h.count > 0 ? 4 : 0 }}
                    >
                      <div
                        className="w-full rounded-t-sm bg-primary transition-all"
                        style={{ height: `${Math.min(100, height * 0.7)}%` }}
                      />
                    </div>
                    <span className="mt-1.5 text-[9px] text-subtle">{h.hour.split(':')[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>12 AM</span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                Peak: {logStatsData.peakHour}
              </span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-divider">
            <h3 className="text-base font-semibold text-deep mb-6">Event Timeline</h3>
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-divider" />
              {allLogs.slice(0, 20).map((log, idx) => {
                const sev = severityConfig[log.severity];
                const dec = decisionConfig[log.decision];
                const DecIcon = dec.icon;
                return (
                  <div key={log.id} className="relative mb-4 ml-10 group">
                    {/* Timeline dot */}
                    <div className={`absolute -left-10 top-2 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${sev.bg}`}>
                      <div className={`h-2 w-2 rounded-full ${sev.dot}`} />
                    </div>
                    <div
                      className="rounded-xl border border-divider bg-white p-4 transition-all hover:shadow-card cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-deep">{log.action}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${dec.bg} ${dec.text}`}>
                              <DecIcon className="h-2.5 w-2.5" />
                              {log.decision.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted line-clamp-1 mb-2">{log.promptPreview}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-subtle">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />{log.user}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />{log.platform}
                            </span>
                            <span className="flex items-center gap-1">
                              <Cpu className="h-3 w-3" />{log.model}
                            </span>
                            <span className="font-mono rounded bg-page px-1.5 py-0.5 ring-1 ring-divider">
                              {log.entityType}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-subtle whitespace-nowrap">{log.timestamp}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>
                            {log.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                    {idx < 19 && <div className="h-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Decision Distribution */}
            <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-divider">
              <h3 className="text-base font-semibold text-deep mb-4">Decision Distribution</h3>
              <div className="flex items-center gap-6">
                {/* Donut chart */}
                <div className="relative flex-shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    {(() => {
                      const total = decisionDistribution.reduce((s, d) => s + d.count, 0);
                      let cumAngle = -90;
                      return decisionDistribution.map((item) => {
                        const angle = (item.count / total) * 360;
                        const startAngle = cumAngle;
                        cumAngle += angle;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = ((startAngle + angle) * Math.PI) / 180;
                        const largeArc = angle > 180 ? 1 : 0;
                        const x1 = 80 + 60 * Math.cos(startRad);
                        const y1 = 80 + 60 * Math.sin(startRad);
                        const x2 = 80 + 60 * Math.cos(endRad);
                        const y2 = 80 + 60 * Math.sin(endRad);
                        const ix1 = 80 + 35 * Math.cos(endRad);
                        const iy1 = 80 + 35 * Math.sin(endRad);
                        const ix2 = 80 + 35 * Math.cos(startRad);
                        const iy2 = 80 + 35 * Math.sin(startRad);
                        return (
                          <path
                            key={item.decision}
                            d={`M ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A 35 35 0 ${largeArc} 0 ${ix2} ${iy2} Z`}
                            fill={item.color}
                            opacity={0.85}
                          />
                        );
                      });
                    })()}
                    <text x="80" y="76" textAnchor="middle" className="text-xl font-bold" fill="#1F2937">
                      {(decisionDistribution.reduce((s, d) => s + d.count, 0) / 1000).toFixed(1)}k
                    </text>
                    <text x="80" y="93" textAnchor="middle" className="text-[10px]" fill="#6B7280">
                      total events
                    </text>
                  </svg>
                </div>
                <div className="flex-1 space-y-2.5">
                  {decisionDistribution.map((item) => {
                    const total = decisionDistribution.reduce((s, d) => s + d.count, 0);
                    const pct = ((item.count / total) * 100).toFixed(1);
                    return (
                      <div key={item.decision} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-deep">{item.decision}</span>
                            <span className="text-xs text-muted">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-page">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                        <span className="text-xs font-mono text-muted w-12 text-right">{item.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-divider">
              <h3 className="text-base font-semibold text-deep mb-4">Department Breakdown</h3>
              <div className="space-y-3">
                {departmentBreakdown.map((dept) => (
                  <div key={dept.department} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-deep">{dept.department}</span>
                        <span className="text-[11px] text-subtle">{dept.logs.toLocaleString()} events</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-red-600 font-medium">{dept.blocked} blocked</span>
                        <span className="text-xs font-medium text-muted">{dept.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-page">
                      <div className="relative h-full rounded-full bg-primary/20 transition-all" style={{ width: `${dept.percentage}%` }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(dept.blocked / dept.logs) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-divider">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-deep">Peak Hour</p>
                  <p className="text-[11px] text-muted">Most active period</p>
                </div>
              </div>
              <p className="text-lg font-bold text-deep">{logStatsData.peakHour}</p>
              <p className="text-xs text-muted mt-1">245 events during peak</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-divider">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-deep">Top Risk User</p>
                  <p className="text-[11px] text-muted">Most violations today</p>
                </div>
              </div>
              <p className="text-lg font-bold text-deep">{logStatsData.topUser}</p>
              <p className="text-xs text-muted mt-1">12 policy violations</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-divider">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-deep">Top Platform</p>
                  <p className="text-[11px] text-muted">Most used AI app</p>
                </div>
              </div>
              <p className="text-lg font-bold text-deep">{logStatsData.topPlatform}</p>
              <p className="text-xs text-muted mt-1">38% of all prompts</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-divider">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-deep">Active Users</p>
                  <p className="text-[11px] text-muted">Using AI today</p>
                </div>
              </div>
              <p className="text-lg font-bold text-deep">{logStatsData.activeUsers}</p>
              <p className="text-xs text-muted mt-1">out of 2,156 total users</p>
            </div>
          </div>

          {/* Entity Type Heatmap */}
          <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-divider">
            <h3 className="text-base font-semibold text-deep mb-4">Entity Detection Frequency</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              {[
                { entity: 'EMAIL', count: 2340, pct: 28 },
                { entity: 'SOURCE_CODE', count: 1890, pct: 23 },
                { entity: 'IN_PAN', count: 1230, pct: 15 },
                { entity: 'PHONE', count: 980, pct: 12 },
                { entity: 'CREDENTIAL', count: 670, pct: 8 },
                { entity: 'API_KEY', count: 450, pct: 5 },
                { entity: 'IN_AADHAAR', count: 380, pct: 5 },
              ].map((item) => (
                <div
                  key={item.entity}
                  className="rounded-xl p-4 text-center transition-all hover:shadow-card"
                  style={{ backgroundColor: `rgba(139, 92, 246, ${0.05 + (item.pct / 100) * 0.25})` }}
                >
                  <p className="text-[10px] font-mono font-medium text-primary mb-1">{item.entity}</p>
                  <p className="text-lg font-bold text-deep">{item.count.toLocaleString()}</p>
                  <p className="text-[10px] text-muted mt-0.5">{item.pct}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Slideout */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            {/* Detail Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider bg-white px-6 py-4">
              <div>
                <p className="text-xs font-mono text-subtle">{selectedLog.id}</p>
                <h2 className="text-lg font-bold text-deep">{selectedLog.action}</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-muted hover:bg-page hover:text-deep transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sev = severityConfig[selectedLog.severity];
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${sev.bg} ${sev.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                      {selectedLog.severity.toUpperCase()}
                    </span>
                  );
                })()}
                {(() => {
                  const dec = decisionConfig[selectedLog.decision];
                  const DecIcon = dec.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${dec.bg} ${dec.text}`}>
                      <DecIcon className="h-3 w-3" />
                      {selectedLog.decision.replace('_', ' ').toUpperCase()}
                    </span>
                  );
                })()}
                <span className="inline-flex items-center rounded-full bg-page px-3 py-1 text-xs font-mono font-medium text-deep ring-1 ring-divider">
                  {selectedLog.entityType}
                </span>
              </div>

              {/* Prompt Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Prompt Preview</h4>
                <div className="rounded-xl bg-page p-4 ring-1 ring-divider">
                  <p className="text-sm text-deep leading-relaxed font-mono">{selectedLog.promptPreview}</p>
                </div>
              </div>

              {/* Masked Version (if applicable) */}
              {selectedLog.masked && selectedLog.maskedText && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Masked Version</h4>
                  <div className="rounded-xl bg-primary-50 p-4 ring-1 ring-primary-200">
                    <p className="text-sm text-deep leading-relaxed font-mono">{selectedLog.maskedText}</p>
                  </div>
                </div>
              )}

              {/* Detected Entities */}
              {selectedLog.detectedEntities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Detected Entities</h4>
                  <div className="space-y-2">
                    {selectedLog.detectedEntities.map((entity, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-page p-3 ring-1 ring-divider">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-xs font-mono font-semibold text-deep">{entity.type}</p>
                            <p className="text-xs text-red-600 font-mono">{entity.value}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-deep">{(entity.confidence * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-muted">confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Policy Matched</h4>
                <div className="flex items-center gap-3 rounded-xl bg-page p-3 ring-1 ring-divider">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-deep">{selectedLog.policyMatched}</p>
                    <p className="text-xs text-muted">Action: {selectedLog.policyAction}</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User, label: 'User', value: selectedLog.user },
                    { icon: FileText, label: 'Email', value: selectedLog.email },
                    { icon: Info, label: 'Department', value: selectedLog.department },
                    { icon: Shield, label: 'Role', value: selectedLog.role },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-page p-3 ring-1 ring-divider">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <item.icon className="h-3 w-3 text-subtle" />
                        <p className="text-[10px] font-medium uppercase tracking-wider text-subtle">{item.label}</p>
                      </div>
                      <p className="text-sm font-medium text-deep truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Technical Details</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Platform', value: selectedLog.platform, icon: Globe },
                    { label: 'Model', value: selectedLog.model, icon: Cpu },
                    { label: 'Session ID', value: selectedLog.sessionId, icon: Hash },
                    { label: 'IP Address', value: selectedLog.ipAddress, icon: Globe },
                    { label: 'User Agent', value: selectedLog.userAgent, icon: ExternalLink },
                    { label: 'Response Time', value: `${selectedLog.responseTime}ms`, icon: Zap },
                    { label: 'Prompt Hash', value: selectedLog.promptHash, icon: Hash },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-page px-3 py-2.5 ring-1 ring-divider">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-subtle" />
                        <span className="text-xs text-muted">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-deep max-w-[200px] truncate">{item.value}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(item.value)}
                          className="text-subtle hover:text-primary transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="rounded-xl bg-page p-4 ring-1 ring-divider text-center">
                <p className="text-xs text-muted mb-1">Event Timestamp</p>
                <p className="text-sm font-mono font-medium text-deep">
                  {new Date(selectedLog.isoTimestamp).toLocaleString('en-IN', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
