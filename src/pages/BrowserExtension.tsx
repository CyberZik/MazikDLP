import { useState, useMemo } from 'react';
import {
  Puzzle, Download, Upload, Search, ChevronDown, ChevronRight,
  ChevronUp, Monitor, Shield, Globe, Check, X, AlertTriangle,
  RefreshCw, Settings, Users, Clock, Activity,
  Eye, MoreVertical, Copy, Trash2, Pause, Send,
  Zap, Lock, Image, Wifi, BarChart3, Package,
  CheckCircle2, XCircle, AlertCircle, ArrowUpRight, Chrome,
  Terminal, Code, Bell, HardDrive,
} from 'lucide-react';
import {
  extensionDevices,
  extensionVersions,
  deploymentGroups,
  extensionConfigs,
  supportedPlatforms,
  browserStats,
  extensionEvents,
  type ExtensionDevice,
  type ExtensionVersion,
  type DeploymentGroup,
  type ExtensionConfig,
} from '../data/extensionData';

type Tab = 'overview' | 'devices' | 'deployment' | 'configuration' | 'platforms' | 'versions';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  outdated: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
  pending: 'bg-blue-50 text-blue-600',
};
const statusDots: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  outdated: 'bg-amber-500',
  error: 'bg-red-500',
  pending: 'bg-blue-500',
};
const eventTypeColors: Record<string, string> = {
  install: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  error: 'bg-red-50 text-red-600',
  auth: 'bg-purple-50 text-purple-700',
  uninstall: 'bg-gray-100 text-gray-600',
  block: 'bg-amber-50 text-amber-700',
};
const eventTypeIcons: Record<string, React.ReactNode> = {
  install: <Download className="h-3.5 w-3.5" />,
  update: <RefreshCw className="h-3.5 w-3.5" />,
  error: <AlertCircle className="h-3.5 w-3.5" />,
  auth: <Lock className="h-3.5 w-3.5" />,
  uninstall: <Trash2 className="h-3.5 w-3.5" />,
  block: <Shield className="h-3.5 w-3.5" />,
};

const browserIcons: Record<string, string> = {
  Chrome: '🌐',
  Firefox: '🦊',
  Edge: '🔵',
  Safari: '🧭',
  Brave: '🦁',
};

const configCategoryIcons: Record<string, React.ReactNode> = {
  'Scanning': <Search className="h-4 w-4" />,
  'User Experience': <Monitor className="h-4 w-4" />,
  'Authentication': <Lock className="h-4 w-4" />,
  'Network': <Wifi className="h-4 w-4" />,
  'Privacy': <Shield className="h-4 w-4" />,
  'Image Redaction': <Image className="h-4 w-4" />,
};

export function BrowserExtension() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterBrowser, setFilterBrowser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastSeen' | 'prompts'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedDevice, setSelectedDevice] = useState<ExtensionDevice | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ExtensionVersion | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<DeploymentGroup | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [configs, setConfigs] = useState<ExtensionConfig[]>(extensionConfigs);
  const [configChanged, setConfigChanged] = useState(false);
  const [expandedConfigCat, setExpandedConfigCat] = useState<string | null>('Scanning');
  const perPage = 12;

  const devices = extensionDevices;

  const stats = useMemo(() => ({
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    outdated: devices.filter(d => d.status === 'outdated').length,
    error: devices.filter(d => d.status === 'error').length,
    pending: devices.filter(d => d.status === 'pending').length,
    currentVersion: devices.filter(d => d.version === '2.4.1').length,
    autoUpdate: devices.filter(d => d.autoUpdate).length,
    totalPrompts: devices.reduce((s, d) => s + d.promptsScanned, 0),
    totalBlocked: devices.reduce((s, d) => s + d.threatsBlocked, 0),
  }), [devices]);

  const filteredDevices = useMemo(() => {
    let result = [...devices];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.userName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.browser.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    if (filterBrowser !== 'all') result = result.filter(d => d.browser === filterBrowser);
    if (filterStatus !== 'all') result = result.filter(d => d.status === filterStatus);
    if (filterDept !== 'all') result = result.filter(d => d.department === filterDept);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.userName.localeCompare(b.userName);
      else if (sortBy === 'prompts') cmp = a.promptsScanned - b.promptsScanned;
      else cmp = a.lastSeen.localeCompare(b.lastSeen);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [devices, search, filterBrowser, filterStatus, filterDept, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredDevices.length / perPage);
  const paginatedDevices = filteredDevices.slice((page - 1) * perPage, page * perPage);
  const departments = useMemo(() => [...new Set(devices.map(d => d.department))], [devices]);
  const configCategories = useMemo(() => [...new Set(configs.map(c => c.category))], [configs]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronDown className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const updateConfig = (id: string, value: string | boolean | number) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, value } : c));
    setConfigChanged(true);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'devices', label: 'Devices', icon: <Monitor className="h-4 w-4" /> },
    { key: 'deployment', label: 'Deployment', icon: <Upload className="h-4 w-4" /> },
    { key: 'configuration', label: 'Configuration', icon: <Settings className="h-4 w-4" /> },
    { key: 'platforms', label: 'Platforms', icon: <Globe className="h-4 w-4" /> },
    { key: 'versions', label: 'Versions', icon: <Package className="h-4 w-4" /> },
  ];

  // ============== DEVICE DETAIL ==============
  if (selectedDevice) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedDevice(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Devices
        </button>
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-2xl">
              {browserIcons[selectedDevice.browser]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-deep">{selectedDevice.userName}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedDevice.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDots[selectedDevice.status]}`} /> {selectedDevice.status}
                </span>
              </div>
              <p className="text-sm text-muted">{selectedDevice.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> {selectedDevice.browser} · {selectedDevice.os}</span>
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> v{selectedDevice.version}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last seen: {selectedDevice.lastSeen}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Force Sync
              </button>
              <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Revoke
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Prompts Scanned', value: selectedDevice.promptsScanned.toLocaleString(), icon: <Activity className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
            { label: 'Threats Blocked', value: selectedDevice.threatsBlocked.toLocaleString(), icon: <Shield className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
            { label: 'Installed', value: selectedDevice.installedAt, icon: <Download className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Auto Update', value: selectedDevice.autoUpdate ? 'Enabled' : 'Disabled', icon: <RefreshCw className="h-4 w-4" />, color: selectedDevice.autoUpdate ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 bg-gray-100' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-lg font-bold text-deep">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Device Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Device ID', value: selectedDevice.id },
                { label: 'User ID', value: selectedDevice.userId },
                { label: 'Browser', value: selectedDevice.browser },
                { label: 'Operating System', value: selectedDevice.os },
                { label: 'Extension Version', value: selectedDevice.version },
                { label: 'Department', value: selectedDevice.department },
                { label: 'IP Address', value: selectedDevice.ipAddress },
                { label: 'Installed', value: selectedDevice.installedAt },
                { label: 'Last Seen', value: selectedDevice.lastSeen },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-divider last:border-0">
                  <span className="text-muted">{d.label}</span>
                  <span className="text-deep font-medium flex items-center gap-1.5">
                    {d.value}
                    <button onClick={() => navigator.clipboard.writeText(d.value)} className="text-muted hover:text-primary transition-colors">
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Health Status</h3>
            <div className="space-y-4">
              {[
                { label: 'API Connection', status: selectedDevice.status !== 'error', detail: selectedDevice.status === 'error' ? 'Connection failed' : 'Connected to api.mazikdlp.com' },
                { label: 'Policy Sync', status: selectedDevice.status === 'active', detail: 'Last synced 5 min ago' },
                { label: 'Version Status', status: selectedDevice.version === '2.4.1', detail: selectedDevice.version === '2.4.1' ? 'Running latest version' : `Update available (2.4.1)` },
                { label: 'Auto Update', status: selectedDevice.autoUpdate, detail: selectedDevice.autoUpdate ? 'Enabled' : 'Disabled - manual updates only' },
                { label: 'Authentication', status: selectedDevice.status !== 'pending', detail: selectedDevice.status === 'pending' ? 'Awaiting first login' : 'Authenticated' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {s.status ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-deep">{s.label}</p>
                    <p className="text-xs text-muted">{s.detail}</p>
                  </div>
                  <span className={`text-xs font-medium ${s.status ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.status ? 'OK' : 'Issue'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedDevice.version !== '2.4.1' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Extension Update Available</p>
              <p className="text-xs text-amber-600 mt-0.5">Current version: {selectedDevice.version} → Latest: 2.4.1. Push update to this device.</p>
            </div>
            <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors">
              Push Update
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============== DEPLOYMENT GROUP DETAIL ==============
  if (selectedGroup) {
    const groupDevices = devices.filter(d => selectedGroup.departments.includes(d.department));
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Deployment Groups
        </button>
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
              <Upload className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-deep">{selectedGroup.name}</h1>
              <p className="text-sm text-muted mt-1">{selectedGroup.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGroup.departments.map(d => (
                  <span key={d} className="rounded-full bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-xs font-medium text-primary">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: selectedGroup.totalUsers, color: 'text-primary bg-primary-50' },
            { label: 'Installed', value: selectedGroup.installed, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active', value: selectedGroup.active, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Outdated', value: selectedGroup.outdated, color: 'text-amber-600 bg-amber-50' },
            { label: 'Not Installed', value: selectedGroup.totalUsers - selectedGroup.installed, color: 'text-red-600 bg-red-50' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
              <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Coverage bar */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-deep">Deployment Coverage</h3>
            <span className="text-sm font-bold text-primary">{Math.round((selectedGroup.installed / selectedGroup.totalUsers) * 100)}%</span>
          </div>
          <div className="h-4 rounded-full bg-gray-100 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(selectedGroup.active / selectedGroup.totalUsers) * 100}%` }} />
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(selectedGroup.outdated / selectedGroup.totalUsers) * 100}%` }} />
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${((selectedGroup.installed - selectedGroup.active - selectedGroup.outdated) / selectedGroup.totalUsers) * 100}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Active</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Outdated</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Inactive</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300" /> Not Installed</span>
          </div>
        </div>

        {/* Group Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-3">Group Configuration</h3>
            <div className="space-y-3">
              {[
                { label: 'Target Version', value: selectedGroup.version },
                { label: 'Auto Update', value: selectedGroup.autoUpdate ? 'Enabled' : 'Disabled' },
                { label: 'Policy', value: selectedGroup.policy },
                { label: 'Created', value: selectedGroup.createdAt },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-divider last:border-0">
                  <span className="text-muted">{d.label}</span>
                  <span className="text-deep font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-3">Group Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Push Update to All', desc: 'Force update all devices to target version', icon: <RefreshCw className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                { label: 'Deploy to Missing', desc: `Push install to ${selectedGroup.totalUsers - selectedGroup.installed} remaining users`, icon: <Download className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { label: 'Sync Policies', desc: 'Force policy sync on all devices', icon: <Send className="h-4 w-4" />, color: 'text-primary bg-primary-50 border-primary-200' },
                { label: 'Remove Group', desc: 'Delete this deployment group (devices remain)', icon: <Trash2 className="h-4 w-4" />, color: 'text-red-600 bg-red-50 border-red-200' },
              ].map((a, i) => (
                <button key={i} className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:shadow-soft ${a.color}`}>
                  <div className="h-8 w-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">{a.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs opacity-70">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Group devices */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-deep mb-4">Devices in Group ({groupDevices.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupDevices.slice(0, 12).map(d => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 cursor-pointer transition-colors"
                onClick={() => { setSelectedGroup(null); setSelectedDevice(d); }}>
                <div className="text-xl flex-shrink-0">{browserIcons[d.browser]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep truncate">{d.userName}</p>
                  <p className="text-xs text-muted">v{d.version} · {d.os}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${statusDots[d.status]}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============== VERSION DETAIL ==============
  if (selectedVersion) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedVersion(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Versions
        </button>
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
              <Package className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-deep">v{selectedVersion.version}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedVersion.status === 'current' ? 'bg-emerald-50 text-emerald-700' :
                  selectedVersion.status === 'supported' ? 'bg-blue-50 text-blue-700' :
                  selectedVersion.status === 'beta' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{selectedVersion.status}</span>
              </div>
              <p className="text-sm text-muted mt-1">Released {selectedVersion.releaseDate} · {selectedVersion.size} · Requires {selectedVersion.minBrowser}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Downloads', value: selectedVersion.downloads.toLocaleString(), icon: <Download className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
            { label: 'Active Installs', value: selectedVersion.activeInstalls.toLocaleString(), icon: <Users className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Package Size', value: selectedVersion.size, icon: <HardDrive className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Min Browser', value: selectedVersion.minBrowser, icon: <Chrome className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-lg font-bold text-deep">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-deep mb-4">Changelog</h3>
          <div className="space-y-3">
            {selectedVersion.changelog.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <p className="text-sm text-deep">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedVersion.status === 'current' && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Distribution</h3>
            <div className="space-y-3">
              {Object.entries(browserStats).map(([browser, s]) => (
                <div key={browser} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{s.icon}</span>
                  <span className="text-sm text-deep w-20">{browser}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(s.active / stats.active) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-deep w-12 text-right">{s.active}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============== MAIN VIEW ==============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep">Browser Extension</h1>
          <p className="text-sm text-muted mt-1">Deploy, configure, and monitor the MazikDLP browser extension across your organization</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-deep shadow-soft hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Download
          </button>
          <button onClick={() => setShowDeployModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" /> Deploy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Devices', value: stats.total, icon: <Monitor className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'Active', value: stats.active, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, icon: <Pause className="h-4 w-4" />, color: 'text-gray-500 bg-gray-100' },
          { label: 'Outdated', value: stats.outdated, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Errors', value: stats.error, icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
          { label: 'On Latest', value: stats.currentVersion, icon: <Check className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Prompts', value: `${(stats.totalPrompts / 1000).toFixed(1)}K`, icon: <Activity className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'Blocked', value: stats.totalBlocked.toLocaleString(), icon: <Shield className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
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
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* ============== OVERVIEW TAB ============== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Current Version Banner */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                <Puzzle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-deep">MazikDLP Extension v2.4.1</h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">Latest</span>
                </div>
                <p className="text-sm text-muted mt-0.5">Released Jan 8, 2025 · {stats.currentVersion}/{stats.total} devices updated · {Math.round((stats.currentVersion / stats.total) * 100)}% adoption</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary-50 transition-colors">
                  Release Notes
                </button>
                <button className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors">
                  Push to All
                </button>
              </div>
            </div>
            {/* Adoption bar */}
            <div className="mt-4">
              <div className="h-2.5 rounded-full bg-white/80 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(stats.currentVersion / stats.total) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted">
                <span>{stats.currentVersion} on v2.4.1</span>
                <span>{stats.total - stats.currentVersion} need update</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Browser Distribution */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Browser Distribution</h3>
              <div className="space-y-4">
                {Object.entries(browserStats).map(([browser, s]) => {
                  const pct = Math.round((s.installed / stats.total) * 100);
                  return (
                    <div key={browser}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.icon}</span>
                          <span className="text-sm font-medium text-deep">{browser}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted">{s.installed} installed</span>
                          <span className="text-emerald-600 font-medium">{s.active} active</span>
                          <span className="font-semibold text-deep">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Coverage */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Department Coverage</h3>
              <div className="space-y-3">
                {departments.map(dept => {
                  const deptDevices = devices.filter(d => d.department === dept);
                  const activeCount = deptDevices.filter(d => d.status === 'active').length;
                  return (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-sm text-deep w-28 truncate">{dept}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${deptDevices.length > 0 ? (activeCount / deptDevices.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-muted w-16 text-right">{activeCount}/{deptDevices.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Events */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-deep flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Recent Extension Events
                </h3>
                <button onClick={() => setTab('devices')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  View All <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {extensionEvents.slice(0, 8).map(evt => (
                  <div key={evt.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:bg-gray-50 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${eventTypeColors[evt.type]}`}>
                      {eventTypeIcons[evt.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-deep">{evt.user}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${eventTypeColors[evt.type]}`}>{evt.type}</span>
                      </div>
                      <p className="text-xs text-muted truncate">{evt.detail}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted">{evt.time}</p>
                      <p className="text-[10px] text-muted">{evt.browser} · {evt.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Extension Preview */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Extension UI Preview</h3>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Mock Extension Popup */}
              <div className="w-72 flex-shrink-0 mx-auto">
                <div className="rounded-2xl border-2 border-border shadow-card overflow-hidden">
                  {/* Extension Header */}
                  <div className="bg-primary p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">MazikDLP</p>
                        <p className="text-[10px] text-white/70">Enterprise Protection</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-white/80">Active</span>
                      </div>
                    </div>
                  </div>
                  {/* Extension Body */}
                  <div className="p-4 space-y-3 bg-white">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Protection Enabled</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-1">All prompts are being scanned</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-divider p-2.5 text-center">
                        <p className="text-lg font-bold text-deep">147</p>
                        <p className="text-[10px] text-muted">Scanned Today</p>
                      </div>
                      <div className="rounded-lg border border-divider p-2.5 text-center">
                        <p className="text-lg font-bold text-red-600">3</p>
                        <p className="text-[10px] text-muted">Blocked</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: 'ChatGPT', status: 'Allowed', color: 'text-emerald-600' },
                        { label: 'Claude', status: 'Allowed', color: 'text-emerald-600' },
                        { label: 'DeepSeek', status: 'Blocked', color: 'text-red-600' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center justify-between rounded-lg border border-divider px-3 py-2">
                          <span className="text-xs text-deep">{p.label}</span>
                          <span className={`text-[10px] font-medium ${p.color}`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full rounded-lg bg-primary-50 border border-primary-200 py-2 text-xs font-medium text-primary">
                      🖼️ Image Redaction Tool
                    </button>
                  </div>
                  {/* Extension Footer */}
                  <div className="bg-gray-50 border-t border-divider px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted">v2.4.1</span>
                    <span className="text-[10px] text-muted">arjun.sharma@maziktech.com</span>
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <div className="flex-1 space-y-4">
                <h4 className="text-sm font-semibold text-deep">Key Extension Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: <Search className="h-4 w-4" />, title: 'Prompt Scanning', desc: 'Real-time detection of sensitive data before submission' },
                    { icon: <Shield className="h-4 w-4" />, title: 'Smart Masking', desc: 'Automatic PII replacement with reversible placeholders' },
                    { icon: <Lock className="h-4 w-4" />, title: 'Auth Required', desc: 'Users must authenticate before using AI platforms' },
                    { icon: <Image className="h-4 w-4" />, title: 'Image Redaction', desc: 'Upload and redact sensitive data from images' },
                    { icon: <Globe className="h-4 w-4" />, title: 'App Whitelisting', desc: 'Only approved AI platforms are accessible' },
                    { icon: <Bell className="h-4 w-4" />, title: 'Smart Alerts', desc: 'Inline notifications when sensitive data detected' },
                    { icon: <Zap className="h-4 w-4" />, title: 'Instant Response', desc: 'Sub-50ms scanning for seamless experience' },
                    { icon: <Code className="h-4 w-4" />, title: 'Code Detection', desc: 'Detects source code, configs, and API keys' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-divider p-3">
                      <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">{f.icon}</div>
                      <div>
                        <p className="text-xs font-semibold text-deep">{f.title}</p>
                        <p className="text-[10px] text-muted mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== DEVICES TAB ============== */}
      {tab === 'devices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by user, email, department, browser..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
            </div>
            <select value={filterBrowser} onChange={e => { setFilterBrowser(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Browsers</option>
              {Object.keys(browserStats).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="outdated">Outdated</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Depts</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

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
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Browser</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Version</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Department</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('prompts')}>
                        Scanned <SortIcon col="prompts" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Blocked</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Last Seen</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevices.map(d => (
                    <tr key={d.id} className="border-b border-divider last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedDevice(d)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{d.avatar}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-deep truncate">{d.userName}</p>
                            <p className="text-xs text-muted truncate">{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1.5 text-sm">
                          <span>{browserIcons[d.browser]}</span> {d.browser}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-mono ${d.version === '2.4.1' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {d.version}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[d.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDots[d.status]}`} /> {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-muted">{d.department}</td>
                      <td className="py-3 px-3 text-sm text-deep font-medium">{d.promptsScanned.toLocaleString()}</td>
                      <td className="py-3 px-3 text-sm text-red-600 font-medium">{d.threatsBlocked}</td>
                      <td className="py-3 px-3 text-xs text-muted">{d.lastSeen}</td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setActionMenu(actionMenu === d.id ? null : d.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenu === d.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
                                {[
                                  { icon: <Eye className="h-3.5 w-3.5" />, label: 'View Details', onClick: () => { setSelectedDevice(d); setActionMenu(null); } },
                                  { icon: <RefreshCw className="h-3.5 w-3.5" />, label: 'Force Sync', onClick: () => setActionMenu(null) },
                                  { icon: <Send className="h-3.5 w-3.5" />, label: 'Push Update', onClick: () => setActionMenu(null) },
                                  { icon: <Terminal className="h-3.5 w-3.5" />, label: 'Remote Diagnostic', onClick: () => setActionMenu(null) },
                                  { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Revoke Access', onClick: () => setActionMenu(null), danger: true },
                                ].map((a, i) => (
                                  <button key={i} onClick={a.onClick}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${(a as {danger?: boolean}).danger ? 'text-red-600 hover:bg-red-50' : 'text-deep hover:bg-gray-50'} transition-colors`}>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
                <p className="text-xs text-muted">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredDevices.length)} of {filteredDevices.length}</p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${p === page ? 'bg-primary text-white' : 'text-muted border border-border hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============== DEPLOYMENT TAB ============== */}
      {tab === 'deployment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{deploymentGroups.length} deployment groups configured</p>
            <button onClick={() => setShowDeployModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
              <Upload className="h-4 w-4" /> New Group
            </button>
          </div>

          {/* Deployment Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Globe className="h-6 w-6" />, title: 'Chrome Web Store', desc: 'Self-service installation from browser store', status: 'Published', statusColor: 'bg-emerald-50 text-emerald-700' },
              { icon: <Terminal className="h-6 w-6" />, title: 'MDM / GPO Push', desc: 'Deploy via Group Policy or MDM solution', status: 'Configured', statusColor: 'bg-blue-50 text-blue-700' },
              { icon: <Send className="h-6 w-6" />, title: 'Email Invitation', desc: 'Send install link via email to users', status: 'Active', statusColor: 'bg-primary-50 text-primary' },
            ].map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">{m.icon}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${m.statusColor}`}>{m.status}</span>
                </div>
                <h4 className="text-sm font-semibold text-deep">{m.title}</h4>
                <p className="text-xs text-muted mt-1">{m.desc}</p>
                <button className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  Configure <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Deployment Groups */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-deep">Deployment Groups</h3>
            {deploymentGroups.map(g => {
              const coverage = Math.round((g.installed / g.totalUsers) * 100);
              return (
                <div key={g.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => setSelectedGroup(g)}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-deep">{g.name}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${g.version.includes('beta') ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          v{g.version}
                        </span>
                        {g.autoUpdate && <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium">Auto Update</span>}
                      </div>
                      <p className="text-xs text-muted">{g.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {g.departments.map(d => (
                          <span key={d} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-deep">{g.installed}/{g.totalUsers}</p>
                        <p className="text-[10px] text-muted">Installed</p>
                      </div>
                      <div className="w-20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-deep">{coverage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className={`h-full rounded-full transition-all ${coverage >= 90 ? 'bg-emerald-500' : coverage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${coverage}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============== CONFIGURATION TAB ============== */}
      {tab === 'configuration' && (
        <div className="space-y-6">
          {configChanged && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">You have unsaved configuration changes</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setConfigs(extensionConfigs); setConfigChanged(false); }}
                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">Discard</button>
                <button onClick={() => setConfigChanged(false)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors">Save & Push</button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{configs.length} configuration options across {configCategories.length} categories</p>
            <div className="flex gap-2">
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export Config
              </button>
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Import Config
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {configCategories.map(cat => {
              const catConfigs = configs.filter(c => c.category === cat);
              const isExpanded = expandedConfigCat === cat;
              return (
                <div key={cat} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
                  <button onClick={() => setExpandedConfigCat(isExpanded ? null : cat)}
                    className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                      {configCategoryIcons[cat] || <Settings className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-deep">{cat}</h3>
                      <p className="text-xs text-muted">{catConfigs.length} settings</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-divider">
                      {catConfigs.map((cfg, i) => (
                        <div key={cfg.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${i < catConfigs.length - 1 ? 'border-b border-divider' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-deep">{cfg.name}</p>
                            <p className="text-xs text-muted">{cfg.description}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {cfg.type === 'toggle' && (
                              <button onClick={() => updateConfig(cfg.id, !(cfg.value as boolean))}
                                className={`relative h-6 w-11 rounded-full transition-colors ${cfg.value ? 'bg-primary' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${cfg.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                              </button>
                            )}
                            {cfg.type === 'select' && (
                              <select value={cfg.value as string} onChange={e => updateConfig(cfg.id, e.target.value)}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]">
                                {cfg.options?.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            )}
                            {cfg.type === 'number' && (
                              <input type="number" value={cfg.value as number} onChange={e => updateConfig(cfg.id, parseInt(e.target.value) || 0)}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 w-24 text-right" />
                            )}
                            {cfg.type === 'text' && (
                              <input type="text" value={cfg.value as string} onChange={e => updateConfig(cfg.id, e.target.value)}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[260px]" />
                            )}
                            {cfg.value !== cfg.defaultValue && (
                              <button onClick={() => updateConfig(cfg.id, cfg.defaultValue)} title="Reset to default"
                                className="rounded p-1 text-muted hover:text-primary hover:bg-primary-50 transition-colors">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============== PLATFORMS TAB ============== */}
      {tab === 'platforms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{supportedPlatforms.length} AI platforms · {supportedPlatforms.filter(p => p.status === 'supported').length} fully supported</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedPlatforms.map(p => (
              <div key={p.name} className={`rounded-xl border bg-card p-5 shadow-soft transition-all ${
                p.status === 'supported' ? 'border-emerald-200 hover:border-emerald-300' :
                p.status === 'beta' ? 'border-purple-200 hover:border-purple-300' :
                'border-border hover:border-gray-300'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{p.icon}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    p.status === 'supported' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'beta' ? 'bg-purple-50 text-purple-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{p.status === 'supported' ? 'Supported' : p.status === 'beta' ? 'Beta' : 'Planned'}</span>
                </div>
                <h4 className="text-sm font-semibold text-deep">{p.name}</h4>
                <p className="text-xs text-muted mt-1">{p.domain}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted">Since: {p.version}</span>
                  {p.status === 'supported' && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                  {p.status === 'beta' && (
                    <span className="flex items-center gap-1 text-[10px] text-purple-600 font-medium">
                      <Zap className="h-3 w-3" /> Testing
                    </span>
                  )}
                  {p.status === 'planned' && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <Clock className="h-3 w-3" /> Coming Soon
                    </span>
                  )}
                </div>
                {p.status === 'supported' && (
                  <div className="mt-3 pt-3 border-t border-divider flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] text-muted">Prompt interception · Response scanning · File upload detection</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Platform Support Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Platform</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">Prompt Scan</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">Response Scan</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">File Upload</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">Image Redact</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">Auth Gate</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted">Model Select</th>
                  </tr>
                </thead>
                <tbody>
                  {supportedPlatforms.map(p => (
                    <tr key={p.name} className="border-b border-divider last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span className="text-sm font-medium text-deep">{p.name}</span>
                        </div>
                      </td>
                      {[
                        p.status === 'supported',
                        p.status === 'supported' && p.name !== 'GitHub Copilot',
                        p.status === 'supported' && !['Grok', 'GitHub Copilot'].includes(p.name),
                        p.status === 'supported' && ['ChatGPT', 'Claude', 'Gemini'].includes(p.name),
                        p.status !== 'planned',
                        p.status === 'supported' && ['ChatGPT', 'Claude', 'Gemini'].includes(p.name),
                      ].map((supported, i) => (
                        <td key={i} className="text-center py-2.5 px-3">
                          {supported ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : p.status === 'planned' ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                              <Clock className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============== VERSIONS TAB ============== */}
      {tab === 'versions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{extensionVersions.length} versions released</p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
              <Upload className="h-4 w-4" /> Publish New Version
            </button>
          </div>

          <div className="space-y-4">
            {extensionVersions.map((v, idx) => (
              <div key={v.version} className={`rounded-xl border bg-card p-5 shadow-soft cursor-pointer hover:shadow-card transition-all ${
                v.status === 'current' ? 'border-emerald-200 ring-1 ring-emerald-100' :
                v.status === 'beta' ? 'border-purple-200' :
                v.status === 'deprecated' ? 'border-red-200 opacity-70' :
                'border-border'
              }`} onClick={() => setSelectedVersion(v)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      v.status === 'current' ? 'bg-emerald-50 text-emerald-600' :
                      v.status === 'beta' ? 'bg-purple-50 text-purple-600' :
                      v.status === 'deprecated' ? 'bg-red-50 text-red-400' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-deep">v{v.version}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          v.status === 'current' ? 'bg-emerald-50 text-emerald-700' :
                          v.status === 'supported' ? 'bg-blue-50 text-blue-700' :
                          v.status === 'beta' ? 'bg-purple-50 text-purple-700' :
                          'bg-red-50 text-red-600'
                        }`}>{v.status}</span>
                        {idx === 0 && v.status === 'current' && (
                          <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-medium">Recommended</span>
                        )}
                      </div>
                      <p className="text-xs text-muted">Released {v.releaseDate} · {v.size} · {v.minBrowser}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.changelog.slice(0, 2).map((c, i) => (
                          <span key={i} className="text-[10px] text-muted">• {c}</span>
                        ))}
                        {v.changelog.length > 2 && <span className="text-[10px] text-primary font-medium">+{v.changelog.length - 2} more</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-deep">{v.downloads.toLocaleString()}</p>
                      <p className="text-[10px] text-muted">Downloads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{v.activeInstalls.toLocaleString()}</p>
                      <p className="text-[10px] text-muted">Active</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Version Adoption Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Version Adoption Distribution</h3>
            <div className="space-y-3">
              {extensionVersions.filter(v => v.activeInstalls > 0).map(v => {
                const totalInstalls = extensionVersions.reduce((s, ver) => s + ver.activeInstalls, 0);
                const pct = Math.round((v.activeInstalls / totalInstalls) * 100);
                return (
                  <div key={v.version}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-deep">v{v.version}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          v.status === 'current' ? 'bg-emerald-50 text-emerald-700' :
                          v.status === 'beta' ? 'bg-purple-50 text-purple-700' :
                          v.status === 'deprecated' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-700'
                        }`}>{v.status}</span>
                      </div>
                      <span className="text-xs font-semibold text-deep">{pct}% ({v.activeInstalls})</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        v.status === 'current' ? 'bg-emerald-500' :
                        v.status === 'beta' ? 'bg-purple-500' :
                        v.status === 'deprecated' ? 'bg-red-400' :
                        'bg-blue-500'
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============== DEPLOY MODAL ============== */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Deploy Extension</h2>
              <button onClick={() => setShowDeployModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Deployment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'MDM Push', icon: <Terminal className="h-4 w-4" />, desc: 'Silent install' },
                    { label: 'Email Link', icon: <Send className="h-4 w-4" />, desc: 'Self-service' },
                    { label: 'Store Link', icon: <Globe className="h-4 w-4" />, desc: 'Web Store' },
                  ].map((m, i) => (
                    <button key={i} className={`rounded-lg border p-3 text-center transition-colors ${i === 0 ? 'border-primary bg-primary-50' : 'border-border hover:border-primary-200'}`}>
                      <div className={`mx-auto h-8 w-8 rounded-lg flex items-center justify-center mb-1 ${i === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-muted'}`}>{m.icon}</div>
                      <p className="text-xs font-medium text-deep">{m.label}</p>
                      <p className="text-[10px] text-muted">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Target Version</label>
                <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>v2.4.1 (Current - Recommended)</option>
                  <option>v2.5.0-beta (Beta)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Target Departments</label>
                <div className="flex flex-wrap gap-2">
                  {departments.map(d => (
                    <button key={d} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary-200 hover:bg-primary-50 hover:text-primary transition-colors">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Group Name</label>
                <input type="text" placeholder="e.g. Engineering Q1 Rollout" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-divider p-3 bg-gray-50">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <p className="text-sm font-medium text-deep">Enable Auto-Update</p>
                  <p className="text-xs text-muted">Automatically update devices when new versions are released</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowDeployModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowDeployModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Upload className="h-4 w-4" /> Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
