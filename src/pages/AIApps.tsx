import { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Search,
  Plus,
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Clock,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  Unlock,
  ArrowLeft,
  Check,
  X,
  Filter,
  MessageSquare,
  Zap,
  FileText,
  Activity,
  Info,
} from 'lucide-react';
import {
  accessRequests,
  type AIApplication,
  type AccessRequest,
} from '../data/aiAppsData';
import { aiApps as aiAppsApi } from '../lib/api';
import type { AIApp } from '../lib/api';

function apiToApp(a: AIApp): AIApplication {
  return {
    id: a.id,
    name: a.name,
    icon: '🤖',
    category: 'AI Assistant',
    vendor: a.vendor ?? '',
    website: a.website ?? '',
    status: (a.status as AIApplication['status']) ?? 'pending',
    riskLevel: (a.risk_level as AIApplication['riskLevel']) ?? 'medium',
    description: '',
    models: [],
    securityAssessment: {
      overallScore: a.security_score ?? 0,
      dataEncryption: 'none',
      dataRetention: 'Not assessed',
      gdprCompliant: false,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: 'Not available',
      vulnerabilities: 0,
      lastAudit: 'Never',
      notes: '',
    },
    usageStats: {
      totalPrompts: 0,
      activeUsers: 0,
      blockedPrompts: 0,
      maskedPrompts: 0,
      avgResponseTime: 0,
      dataExposureIncidents: 0,
      last30DaysTrend: [],
      topDepartments: [],
    },
    policies: [],
    addedBy: '',
    addedDate: '',
    lastReviewed: 'Never',
    reviewCycle: 90,
    tags: a.compliance ?? [],
    dataRetention: 'Not assessed',
    complianceCerts: a.compliance ?? [],
    apiEndpoints: [],
  };
}

type TabType = 'catalog' | 'requests' | 'monitoring';
type ViewType = 'grid' | 'list';

const statusConfig = {
  whitelisted: { label: 'Whitelisted', color: 'bg-green-50 text-green-700 border-green-200', icon: ShieldCheck, dot: 'bg-green-500' },
  blocked: { label: 'Blocked', color: 'bg-red-50 text-red-700 border-red-200', icon: ShieldX, dot: 'bg-red-500' },
  restricted: { label: 'Restricted', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ShieldAlert, dot: 'bg-amber-500' },
  pending: { label: 'Pending Review', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, dot: 'bg-blue-500' },
};

const riskConfig = {
  low: { label: 'Low Risk', color: 'bg-green-50 text-green-700', bar: 'bg-green-500', width: '25%' },
  medium: { label: 'Medium Risk', color: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500', width: '50%' },
  high: { label: 'High Risk', color: 'bg-orange-50 text-orange-700', bar: 'bg-orange-500', width: '75%' },
  critical: { label: 'Critical Risk', color: 'bg-red-50 text-red-700', bar: 'bg-red-500', width: '100%' },
};

export function AIApps() {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [selectedApp, setSelectedApp] = useState<AIApplication | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [apps, setApps] = useState<AIApplication[]>([]);
  const [requests, setRequests] = useState(accessRequests);

  useEffect(() => {
    aiAppsApi.list().then((data) => {
      if (data.length > 0) {
        setApps(data.map(apiToApp));
      } else {
        setApps([]);
      }
    }).catch(() => {
      setApps([]);
    });
  }, []);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // New app form state
  const [newApp, setNewApp] = useState<{
    name: string;
    vendor: string;
    website: string;
    category: string;
    status: AIApplication['status'];
    riskLevel: AIApplication['riskLevel'];
    description: string;
  }>({
    name: '',
    vendor: '',
    website: '',
    category: 'General AI Assistant',
    status: 'pending',
    riskLevel: 'medium',
    description: '',
  });

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || app.riskLevel === riskFilter;
      const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesRisk && matchesCategory;
    });
  }, [apps, searchQuery, statusFilter, riskFilter, categoryFilter]);

  const categories = [...new Set(apps.map((a) => a.category))];

  const stats = useMemo(() => ({
    total: apps.length,
    whitelisted: apps.filter((a) => a.status === 'whitelisted').length,
    blocked: apps.filter((a) => a.status === 'blocked').length,
    restricted: apps.filter((a) => a.status === 'restricted').length,
    pending: apps.filter((a) => a.status === 'pending').length,
    pendingRequests: requests.filter((r) => r.status === 'pending').length,
  }), [apps, requests]);

  const toggleAppStatus = (appId: string, newStatus: AIApplication['status']) => {
    aiAppsApi.setStatus(appId, newStatus).catch(() => {});
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApp?.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };

  const handleRequestAction = (reqId: string, action: 'approved' | 'rejected', notes: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: action,
              reviewedBy: 'admin@company.com',
              reviewDate: new Date().toISOString().split('T')[0],
              reviewNotes: notes,
            }
          : r
      )
    );
  };

  const handleAddApp = () => {
    if (!newApp.name || !newApp.vendor) return;
    const app: AIApplication = {
      id: `app-${Date.now()}`,
      name: newApp.name,
      icon: '🆕',
      category: newApp.category,
      vendor: newApp.vendor,
      website: newApp.website,
      status: newApp.status,
      riskLevel: newApp.riskLevel,
      description: newApp.description,
      models: [],
      securityAssessment: {
        overallScore: 0,
        dataEncryption: 'none',
        dataRetention: 'Not assessed',
        gdprCompliant: false,
        soc2Compliant: false,
        hipaaCompliant: false,
        iso27001: false,
        penTestDate: 'Not available',
        vulnerabilities: 0,
        lastAudit: 'Never',
        notes: 'Security assessment pending.',
      },
      usageStats: {
        totalPrompts: 0,
        activeUsers: 0,
        blockedPrompts: 0,
        maskedPrompts: 0,
        avgResponseTime: 0,
        dataExposureIncidents: 0,
        last30DaysTrend: new Array(30).fill(0),
        topDepartments: [],
      },
      policies: [],
      addedBy: 'admin@company.com',
      addedDate: new Date().toISOString().split('T')[0],
      lastReviewed: new Date().toISOString().split('T')[0],
      reviewCycle: 90,
      tags: [],
      dataRetention: 'Not assessed',
      complianceCerts: [],
      apiEndpoints: [],
    };
    aiAppsApi.create({
      name: newApp.name,
      vendor: newApp.vendor,
      website: newApp.website,
      status: newApp.status,
      risk_level: newApp.riskLevel,
    }).then((created) => {
      setApps((prev) => [apiToApp(created), ...prev.filter(a => a.id !== app.id)]);
    }).catch(() => {});
    setApps((prev) => [...prev, app]);
    setShowAddModal(false);
    setNewApp({
      name: '',
      vendor: '',
      website: '',
      category: 'General AI Assistant',
      status: 'pending',
      riskLevel: 'medium',
      description: '',
    });
  };

  // --- Detail View ---
  if (selectedApp) {
    return <AppDetailView app={selectedApp} onBack={() => setSelectedApp(null)} onToggleStatus={toggleAppStatus} />;
  }

  const tabs = [
    { id: 'catalog' as const, label: 'App Catalog', icon: Globe, count: apps.length },
    { id: 'requests' as const, label: 'Access Requests', icon: MessageSquare, count: stats.pendingRequests },
    { id: 'monitoring' as const, label: 'Usage Monitoring', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">AI Applications</h1>
          <p className="mt-1 text-sm text-muted">Manage, whitelist, and monitor AI platforms across your organization</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Apps', value: stats.total, icon: Globe, iconBg: 'bg-primary-50', iconColor: 'text-primary' },
          { label: 'Whitelisted', value: stats.whitelisted, icon: ShieldCheck, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Blocked', value: stats.blocked, icon: ShieldX, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
          { label: 'Restricted', value: stats.restricted, icon: ShieldAlert, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Access Requests', value: stats.pendingRequests, icon: MessageSquare, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-divider bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-deep">{stat.value}</p>
                <p className="text-[11px] font-medium text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-divider bg-card p-1 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-page hover:text-deep'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'catalog' && (
        <CatalogTab
          apps={filteredApps}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          viewType={viewType}
          onViewTypeChange={setViewType}
          onSelectApp={setSelectedApp}
          onToggleStatus={toggleAppStatus}
        />
      )}
      {activeTab === 'requests' && (
        <RequestsTab
          requests={requests}
          expandedRequest={expandedRequest}
          onExpandRequest={setExpandedRequest}
          onRequestAction={handleRequestAction}
        />
      )}
      {activeTab === 'monitoring' && <MonitoringTab apps={apps} />}

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-divider bg-card p-6 shadow-elevated">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-deep">Add AI Application</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 text-muted hover:bg-page">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-deep">Application Name *</label>
                <input
                  type="text"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                  placeholder="e.g., Jasper AI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-deep">Vendor *</label>
                  <input
                    type="text"
                    value={newApp.vendor}
                    onChange={(e) => setNewApp({ ...newApp, vendor: e.target.value })}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g., Jasper Inc."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-deep">Website</label>
                  <input
                    type="text"
                    value={newApp.website}
                    onChange={(e) => setNewApp({ ...newApp, website: e.target.value })}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-deep">Category</label>
                  <select
                    value={newApp.category}
                    onChange={(e) => setNewApp({ ...newApp, category: e.target.value })}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary"
                  >
                    <option>General AI Assistant</option>
                    <option>Code Assistant</option>
                    <option>AI Search Engine</option>
                    <option>Productivity AI</option>
                    <option>ML Platform</option>
                    <option>Image Generation</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-deep">Initial Status</label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp({ ...newApp, status: e.target.value as AIApplication['status'] })}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="whitelisted">Whitelisted</option>
                    <option value="restricted">Restricted</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-deep">Risk Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewApp({ ...newApp, riskLevel: level })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                        newApp.riskLevel === level
                          ? `${riskConfig[level].color} border-current`
                          : 'border-divider text-muted hover:bg-page'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-deep">Description</label>
                <textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                  placeholder="Brief description of the AI application..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-page"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApp}
                disabled={!newApp.name || !newApp.vendor}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Add Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// CATALOG TAB
// =============================================
function CatalogTab({
  apps,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  riskFilter,
  onRiskFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  viewType,
  onViewTypeChange,
  onSelectApp,
  onToggleStatus,
}: {
  apps: AIApplication[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  riskFilter: string;
  onRiskFilterChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  categories: string[];
  viewType: ViewType;
  onViewTypeChange: (v: ViewType) => void;
  onSelectApp: (app: AIApplication) => void;
  onToggleStatus: (id: string, status: AIApplication['status']) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search apps by name, vendor, or category..."
            className="w-full rounded-xl border border-divider bg-card py-2.5 pl-10 pr-4 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 shadow-soft"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="appearance-none rounded-lg border border-divider bg-card py-2 pl-9 pr-8 text-xs font-medium text-deep outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="whitelisted">Whitelisted</option>
              <option value="blocked">Blocked</option>
              <option value="restricted">Restricted</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilterChange(e.target.value)}
            className="appearance-none rounded-lg border border-divider bg-card px-3 py-2 text-xs font-medium text-deep outline-none focus:border-primary"
          >
            <option value="all">All Risk</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="appearance-none rounded-lg border border-divider bg-card px-3 py-2 text-xs font-medium text-deep outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-divider bg-card">
            <button
              onClick={() => onViewTypeChange('grid')}
              className={`rounded-l-lg px-3 py-2 text-xs transition-all ${viewType === 'grid' ? 'bg-primary text-white' : 'text-muted hover:bg-page'}`}
            >
              Grid
            </button>
            <button
              onClick={() => onViewTypeChange('list')}
              className={`rounded-r-lg px-3 py-2 text-xs transition-all ${viewType === 'list' ? 'bg-primary text-white' : 'text-muted hover:bg-page'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Apps Grid / List */}
      {viewType === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} onSelect={onSelectApp} onToggleStatus={onToggleStatus} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <AppListItem key={app.id} app={app} onSelect={onSelectApp} onToggleStatus={onToggleStatus} />
          ))}
        </div>
      )}

      {apps.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-divider bg-card py-16">
          <Globe className="mb-3 h-12 w-12 text-subtle" />
          <p className="text-sm font-medium text-muted">No applications match your filters</p>
          <p className="mt-1 text-xs text-subtle">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

// =============================================
// APP CARD (Grid View)
// =============================================
function AppCard({
  app,
  onSelect,
  onToggleStatus,
}: {
  app: AIApplication;
  onSelect: (app: AIApplication) => void;
  onToggleStatus: (id: string, status: AIApplication['status']) => void;
}) {
  const status = statusConfig[app.status];
  const risk = riskConfig[app.riskLevel];
  const StatusIcon = status.icon;

  return (
    <div className="group rounded-xl border border-divider bg-card p-5 shadow-soft transition-all hover:shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-page text-2xl">
            {app.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-deep">{app.name}</h3>
            <p className="text-xs text-muted">{app.vendor}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-2">{app.description}</p>

      {/* Risk & Category */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${risk.color}`}>
          {risk.label}
        </span>
        <span className="rounded-md bg-page px-2 py-0.5 text-[10px] font-medium text-muted">
          {app.category}
        </span>
      </div>

      {/* Security Score */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-muted">Security Score</span>
          <span className={`font-bold ${app.securityAssessment.overallScore >= 70 ? 'text-green-600' : app.securityAssessment.overallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {app.securityAssessment.overallScore}/100
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${app.securityAssessment.overallScore >= 70 ? 'bg-green-500' : app.securityAssessment.overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${app.securityAssessment.overallScore}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-page p-3">
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{(app.usageStats.totalPrompts / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted">Prompts</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{app.usageStats.activeUsers}</p>
          <p className="text-[10px] text-muted">Users</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{app.usageStats.blockedPrompts}</p>
          <p className="text-[10px] text-muted">Blocked</p>
        </div>
      </div>

      {/* Compliance Badges */}
      {app.complianceCerts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {app.complianceCerts.slice(0, 4).map((cert) => (
            <span key={cert} className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSelect(app)}
          className="flex-1 rounded-lg border border-divider bg-page px-3 py-2 text-xs font-medium text-deep transition-all hover:border-primary hover:text-primary"
        >
          <Eye className="mr-1 inline h-3 w-3" />
          View Details
        </button>
        {app.status === 'whitelisted' || app.status === 'restricted' ? (
          <button
            onClick={() => onToggleStatus(app.id, 'blocked')}
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-100"
          >
            <Lock className="mr-1 inline h-3 w-3" />
            Block
          </button>
        ) : (
          <button
            onClick={() => onToggleStatus(app.id, 'whitelisted')}
            className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-600 transition-all hover:bg-green-100"
          >
            <Unlock className="mr-1 inline h-3 w-3" />
            Allow
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================
// APP LIST ITEM
// =============================================
function AppListItem({
  app,
  onSelect,
  onToggleStatus,
}: {
  app: AIApplication;
  onSelect: (app: AIApplication) => void;
  onToggleStatus: (id: string, status: AIApplication['status']) => void;
}) {
  const status = statusConfig[app.status];
  const risk = riskConfig[app.riskLevel];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-divider bg-card p-4 shadow-soft transition-all hover:shadow-card">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-page text-xl">
        {app.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-deep">{app.name}</h3>
          <span className="text-xs text-muted">by {app.vendor}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{app.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${risk.color}`}>
          {risk.label}
        </span>
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{app.securityAssessment.overallScore}</p>
          <p className="text-[9px] text-muted">Score</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{app.usageStats.activeUsers}</p>
          <p className="text-[9px] text-muted">Users</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-deep">{(app.usageStats.totalPrompts / 1000).toFixed(1)}k</p>
          <p className="text-[9px] text-muted">Prompts</p>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
        <button
          onClick={() => onSelect(app)}
          className="rounded-lg border border-divider px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-primary hover:text-primary"
        >
          Details
        </button>
        {app.status !== 'blocked' ? (
          <button
            onClick={() => onToggleStatus(app.id, 'blocked')}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Block
          </button>
        ) : (
          <button
            onClick={() => onToggleStatus(app.id, 'whitelisted')}
            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
          >
            Allow
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================
// APP DETAIL VIEW
// =============================================
function AppDetailView({
  app,
  onBack,
  onToggleStatus,
}: {
  app: AIApplication;
  onBack: () => void;
  onToggleStatus: (id: string, status: AIApplication['status']) => void;
}) {
  const [detailTab, setDetailTab] = useState<'overview' | 'security' | 'models' | 'usage'>('overview');
  const status = statusConfig[app.status];
  const risk = riskConfig[app.riskLevel];
  const StatusIcon = status.icon;
  const sa = app.securityAssessment;

  const maxTrend = Math.max(...app.usageStats.last30DaysTrend, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to App Catalog
        </button>
        <div className="flex flex-col gap-4 rounded-xl border border-divider bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-page text-4xl shadow-sm">
              {app.icon}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-deep">{app.name}</h1>
                <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${risk.color}`}>
                  {risk.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">by {app.vendor} • {app.category}</p>
              <div className="mt-2 flex items-center gap-2">
                <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  {app.website}
                </a>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {app.status !== 'whitelisted' && (
              <button
                onClick={() => onToggleStatus(app.id, 'whitelisted')}
                className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Whitelist
              </button>
            )}
            {app.status !== 'restricted' && (
              <button
                onClick={() => onToggleStatus(app.id, 'restricted')}
                className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <ShieldAlert className="h-4 w-4" />
                Restrict
              </button>
            )}
            {app.status !== 'blocked' && (
              <button
                onClick={() => onToggleStatus(app.id, 'blocked')}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <ShieldX className="h-4 w-4" />
                Block
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex gap-1 rounded-xl border border-divider bg-card p-1 shadow-soft">
        {[
          { id: 'overview' as const, label: 'Overview', icon: Info },
          { id: 'security' as const, label: 'Security Assessment', icon: Shield },
          { id: 'models' as const, label: 'AI Models', icon: Zap },
          { id: 'usage' as const, label: 'Usage & Analytics', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setDetailTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              detailTab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-page hover:text-deep'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {detailTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">About</h3>
              <p className="text-sm leading-relaxed text-muted">{app.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Prompts', value: app.usageStats.totalPrompts.toLocaleString(), icon: MessageSquare, bg: 'bg-primary-50', ic: 'text-primary' },
                { label: 'Active Users', value: app.usageStats.activeUsers.toString(), icon: Users, bg: 'bg-blue-50', ic: 'text-blue-600' },
                { label: 'Blocked', value: app.usageStats.blockedPrompts.toLocaleString(), icon: ShieldX, bg: 'bg-red-50', ic: 'text-red-600' },
                { label: 'Incidents', value: app.usageStats.dataExposureIncidents.toString(), icon: AlertTriangle, bg: 'bg-amber-50', ic: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-divider bg-card p-4 shadow-soft">
                  <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.ic}`} />
                  </div>
                  <p className="text-lg font-bold text-deep">{s.value}</p>
                  <p className="text-[11px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Assigned Policies */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Assigned Policies</h3>
              {app.policies.length > 0 ? (
                <div className="space-y-2">
                  {app.policies.map((p) => (
                    <div key={p} className="flex items-center gap-3 rounded-lg bg-page p-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-deep">{p}</span>
                      <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Active</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-subtle">No policies assigned. This application may not be properly protected.</p>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Security Score */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-sm font-bold text-deep">Security Score</h3>
              <div className="flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={sa.overallScore >= 70 ? '#10B981' : sa.overallScore >= 40 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(sa.overallScore / 100) * 314} 314`}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className={`text-3xl font-bold ${sa.overallScore >= 70 ? 'text-green-600' : sa.overallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {sa.overallScore}
                    </p>
                    <p className="text-[10px] text-muted">out of 100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Compliance</h3>
              <div className="space-y-2">
                {[
                  { label: 'GDPR', value: sa.gdprCompliant },
                  { label: 'SOC 2 Type II', value: sa.soc2Compliant },
                  { label: 'HIPAA', value: sa.hipaaCompliant },
                  { label: 'ISO 27001', value: sa.iso27001 },
                ].map((c) => (
                  <div key={c.label} className="flex items-center justify-between rounded-lg bg-page px-3 py-2">
                    <span className="text-xs font-medium text-deep">{c.label}</span>
                    {c.value ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500">
                        <XCircle className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Details</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Added by', value: app.addedBy },
                  { label: 'Added on', value: app.addedDate },
                  { label: 'Last reviewed', value: app.lastReviewed },
                  { label: 'Review cycle', value: `${app.reviewCycle} days` },
                  { label: 'Data retention', value: app.dataRetention },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between">
                    <span className="text-muted">{m.label}</span>
                    <span className="font-medium text-deep">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {detailTab === 'security' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assessment Details */}
          <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
            <h3 className="mb-4 text-sm font-bold text-deep">Security Assessment</h3>
            <div className="space-y-4">
              {[
                { label: 'Data Encryption', value: sa.dataEncryption, type: 'badge' },
                { label: 'Data Retention', value: sa.dataRetention, type: 'text' },
                { label: 'Last Penetration Test', value: sa.penTestDate, type: 'text' },
                { label: 'Known Vulnerabilities', value: sa.vulnerabilities.toString(), type: 'number' },
                { label: 'Last Audit', value: sa.lastAudit, type: 'text' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-page px-4 py-3">
                  <span className="text-sm text-muted">{item.label}</span>
                  {item.type === 'badge' ? (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                      item.value === 'strong' ? 'bg-green-50 text-green-700' :
                      item.value === 'moderate' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {item.value}
                    </span>
                  ) : item.type === 'number' ? (
                    <span className={`text-sm font-bold ${Number(item.value) === 0 ? 'text-green-600' : Number(item.value) <= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                      {item.value}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-deep">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Certifications */}
          <div className="space-y-6">
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-sm font-bold text-deep">Compliance Certifications</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'GDPR', compliant: sa.gdprCompliant },
                  { label: 'SOC 2 Type II', compliant: sa.soc2Compliant },
                  { label: 'HIPAA', compliant: sa.hipaaCompliant },
                  { label: 'ISO 27001', compliant: sa.iso27001 },
                ].map((c) => (
                  <div key={c.label} className={`flex items-center gap-3 rounded-xl border p-4 ${
                    c.compliant ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50/50'
                  }`}>
                    {c.compliant ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${c.compliant ? 'text-green-700' : 'text-red-600'}`}>{c.label}</p>
                      <p className="text-[10px] text-muted">{c.compliant ? 'Certified' : 'Not Certified'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Notes */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Assessment Notes</h3>
              <div className={`rounded-lg p-4 text-sm leading-relaxed ${
                sa.overallScore >= 70 ? 'bg-green-50 text-green-800' :
                sa.overallScore >= 40 ? 'bg-amber-50 text-amber-800' :
                'bg-red-50 text-red-800'
              }`}>
                {sa.notes}
              </div>
            </div>

            {/* API Endpoints */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Monitored Endpoints</h3>
              <div className="space-y-2">
                {app.apiEndpoints.map((ep) => (
                  <div key={ep} className="flex items-center gap-2 rounded-lg bg-page px-3 py-2">
                    <Globe className="h-3.5 w-3.5 text-muted" />
                    <code className="text-xs font-mono text-deep">{ep}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {detailTab === 'models' && (
        <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-deep">AI Models ({app.models.length})</h3>
          </div>
          {app.models.length > 0 ? (
            <div className="space-y-3">
              {app.models.map((model) => (
                <div key={model.id} className="flex items-center gap-4 rounded-xl border border-divider bg-page p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-deep">{model.name}</h4>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-muted">v{model.version}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">Max tokens: {model.maxTokens.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      model.policyLevel === 'Relaxed' ? 'bg-green-50 text-green-700' :
                      model.policyLevel === 'Standard' ? 'bg-blue-50 text-blue-700' :
                      model.policyLevel === 'Strict' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-muted'
                    }`}>
                      {model.policyLevel}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      model.status === 'allowed' ? 'border-green-200 bg-green-50 text-green-700' :
                      model.status === 'blocked' ? 'border-red-200 bg-red-50 text-red-700' :
                      'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {model.status === 'allowed' ? <CheckCircle2 className="h-3 w-3" /> :
                       model.status === 'blocked' ? <XCircle className="h-3 w-3" /> :
                       <ShieldAlert className="h-3 w-3" />}
                      {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <Zap className="mb-2 h-10 w-10 text-subtle" />
              <p className="text-sm text-muted">No models registered for this application</p>
            </div>
          )}
        </div>
      )}

      {/* Usage Tab */}
      {detailTab === 'usage' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* 30-Day Trend */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-sm font-bold text-deep">30-Day Usage Trend</h3>
              <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
                {app.usageStats.last30DaysTrend.map((v, i) => (
                  <div key={i} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
                      style={{ height: `${(v / maxTrend) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden rounded bg-deep px-2 py-1 text-[10px] text-white group-hover:block whitespace-nowrap">
                      Day {i + 1}: {v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-subtle">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </div>

            {/* Department Usage */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-sm font-bold text-deep">Usage by Department</h3>
              {app.usageStats.topDepartments.length > 0 ? (
                <div className="space-y-3">
                  {app.usageStats.topDepartments.map((dept) => (
                    <div key={dept.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-deep">{dept.name}</span>
                        <span className="font-bold text-primary">{dept.usage}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${dept.usage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-subtle">No usage data available</p>
              )}
            </div>
          </div>

          {/* Usage Summary Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-4 text-sm font-bold text-deep">Usage Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Prompts', value: app.usageStats.totalPrompts.toLocaleString(), icon: MessageSquare },
                  { label: 'Active Users', value: app.usageStats.activeUsers.toString(), icon: Users },
                  { label: 'Blocked Prompts', value: app.usageStats.blockedPrompts.toLocaleString(), icon: ShieldX },
                  { label: 'Masked Prompts', value: app.usageStats.maskedPrompts.toLocaleString(), icon: Shield },
                  { label: 'Avg Response Time', value: `${app.usageStats.avgResponseTime}s`, icon: Clock },
                  { label: 'Data Incidents', value: app.usageStats.dataExposureIncidents.toString(), icon: AlertTriangle },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-muted" />
                      <span className="text-xs text-muted">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold text-deep">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Protection Rate */}
            <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-bold text-deep">Protection Rate</h3>
              {app.usageStats.totalPrompts > 0 ? (
                <>
                  <div className="mb-2 flex items-center justify-center">
                    <div className="relative flex h-28 w-28 items-center justify-center">
                      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#8B5CF6" strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${((app.usageStats.blockedPrompts + app.usageStats.maskedPrompts) / app.usageStats.totalPrompts) * 314} 314`}
                        />
                      </svg>
                      <p className="absolute text-xl font-bold text-primary">
                        {Math.round(((app.usageStats.blockedPrompts + app.usageStats.maskedPrompts) / app.usageStats.totalPrompts) * 100)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-muted">of prompts were protected (blocked or masked)</p>
                </>
              ) : (
                <p className="text-center text-sm text-subtle">No data yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// REQUESTS TAB
// =============================================
function RequestsTab({
  requests,
  expandedRequest,
  onExpandRequest,
  onRequestAction,
}: {
  requests: AccessRequest[];
  expandedRequest: string | null;
  onExpandRequest: (id: string | null) => void;
  onRequestAction: (id: string, action: 'approved' | 'rejected', notes: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-deep">
          <Clock className="h-4 w-4 text-amber-500" />
          Pending Requests ({pending.length})
        </h3>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-amber-200 bg-card shadow-soft">
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => onExpandRequest(expandedRequest === req.id ? null : req.id)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-page text-xl">
                    {req.appIcon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-deep">{req.appName}</h4>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        req.priority === 'high' ? 'bg-red-50 text-red-700' :
                        req.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {req.priority} priority
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Requested by <span className="font-medium text-deep">{req.requestedBy}</span> ({req.department}) • {req.requestDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-deep">{req.usersRequested}</p>
                      <p className="text-[10px] text-muted">users</p>
                    </div>
                    {expandedRequest === req.id ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                  </div>
                </div>
                {expandedRequest === req.id && (
                  <div className="border-t border-divider px-5 pb-5 pt-4">
                    <div className="mb-4 rounded-lg bg-page p-4">
                      <p className="mb-1 text-xs font-semibold text-deep">Justification</p>
                      <p className="text-sm leading-relaxed text-muted">{req.justification}</p>
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-semibold text-deep">Review Notes</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep outline-none focus:border-primary focus:ring-2 focus:ring-primary-100"
                        placeholder="Add notes for this decision..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { onRequestAction(req.id, 'approved', reviewNotes); setReviewNotes(''); }}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => { onRequestAction(req.id, 'rejected', reviewNotes); setReviewNotes(''); }}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-divider bg-card py-12">
            <CheckCircle2 className="mb-2 h-10 w-10 text-green-400" />
            <p className="text-sm font-medium text-muted">No pending requests</p>
            <p className="mt-1 text-xs text-subtle">All access requests have been reviewed</p>
          </div>
        )}
      </div>

      {/* Resolved Requests */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-deep">
          <FileText className="h-4 w-4 text-muted" />
          Resolved Requests ({resolved.length})
        </h3>
        <div className="space-y-2">
          {resolved.map((req) => (
            <div key={req.id} className="flex items-center gap-4 rounded-xl border border-divider bg-card p-4 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-page text-lg">
                {req.appIcon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-deep">{req.appName}</h4>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {req.status === 'approved' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Requested by {req.requestedBy} • Reviewed by {req.reviewedBy} on {req.reviewDate}
                </p>
                {req.reviewNotes && (
                  <p className="mt-1 text-xs italic text-subtle">"{req.reviewNotes}"</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-deep">{req.usersRequested} users</p>
                <p className="text-[10px] text-muted">{req.department}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================
// MONITORING TAB
// =============================================
function MonitoringTab({ apps }: { apps: AIApplication[] }) {
  const activeApps = apps.filter((a) => a.status === 'whitelisted' || a.status === 'restricted');
  const totalPrompts = apps.reduce((sum, a) => sum + a.usageStats.totalPrompts, 0);
  const totalUsers = apps.reduce((sum, a) => sum + a.usageStats.activeUsers, 0);
  const totalBlocked = apps.reduce((sum, a) => sum + a.usageStats.blockedPrompts, 0);
  const totalIncidents = apps.reduce((sum, a) => sum + a.usageStats.dataExposureIncidents, 0);

  const sortedByUsage = [...apps].sort((a, b) => b.usageStats.totalPrompts - a.usageStats.totalPrompts);
  const maxPrompts = sortedByUsage[0]?.usageStats.totalPrompts || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Prompts (All Apps)', value: totalPrompts.toLocaleString(), icon: MessageSquare, iconBg: 'bg-primary-50', iconColor: 'text-primary' },
          { label: 'Total Active Users', value: totalUsers.toLocaleString(), icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Total Blocked Prompts', value: totalBlocked.toLocaleString(), icon: ShieldX, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
          { label: 'Data Exposure Incidents', value: totalIncidents.toString(), icon: AlertTriangle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-divider bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg}`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-deep">{s.value}</p>
                <p className="text-[11px] text-muted">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Ranking */}
      <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-sm font-bold text-deep">AI Application Usage Ranking</h3>
        <div className="space-y-3">
          {sortedByUsage.map((app, idx) => {
            const statusCfg = statusConfig[app.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div key={app.id} className="flex items-center gap-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-page text-xs font-bold text-muted">
                  {idx + 1}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-page text-lg">
                  {app.icon}
                </div>
                <div className="w-36">
                  <p className="text-sm font-semibold text-deep">{app.name}</p>
                  <p className="text-[10px] text-muted">{app.vendor}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${(app.usageStats.totalPrompts / maxPrompts) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-bold text-deep">{(app.usageStats.totalPrompts / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted">prompts</p>
                </div>
                <div className="w-16 text-center">
                  <p className="text-sm font-bold text-deep">{app.usageStats.activeUsers}</p>
                  <p className="text-[10px] text-muted">users</p>
                </div>
                <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active App Cards with mini charts */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-deep">Active Applications - Live Monitoring</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeApps.map((app) => {
            const appMax = Math.max(...app.usageStats.last30DaysTrend, 1);
            const blockRate = app.usageStats.totalPrompts > 0
              ? Math.round((app.usageStats.blockedPrompts / app.usageStats.totalPrompts) * 100)
              : 0;
            return (
              <div key={app.id} className="rounded-xl border border-divider bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-page text-xl">
                    {app.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-deep">{app.name}</h4>
                    <p className="text-[10px] text-muted">{app.usageStats.activeUsers} active users</p>
                  </div>
                  <div className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                {/* Mini Trend */}
                <div className="mt-3 flex items-end gap-[2px]" style={{ height: 48 }}>
                  {app.usageStats.last30DaysTrend.slice(-14).map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/50"
                      style={{ height: `${(v / appMax) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-muted">Block Rate</span>
                  <span className={`font-bold ${blockRate > 10 ? 'text-red-600' : blockRate > 5 ? 'text-amber-600' : 'text-green-600'}`}>
                    {blockRate}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${blockRate > 10 ? 'bg-red-500' : blockRate > 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${blockRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
