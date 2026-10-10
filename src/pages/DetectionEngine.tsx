import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Shield,
  User,
  MapPin,
  KeyRound,
  Code,
  Lock,
  Database,
  Fingerprint,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Settings,
  PlayCircle,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Activity,
  Clock,
  BarChart3,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Copy,
  Info,
  RefreshCw,
  FlaskConical,
  Layers,
  TrendingUp,
  Target,
  Cpu,
  ChevronUp,
} from 'lucide-react';
import {
  detectionModules,
  pipelineStages,
  testSamples,
  detectionHistory,
  type DetectionModule,
  type DetectionPattern,
  type TestResult,
} from '../data/detectionData';
import { scan as scanApi } from '../lib/api';

const iconMap: Record<string, React.ElementType> = {
  User, MapPin, KeyRound, Code, Lock, Database, Fingerprint,
};

type TabType = 'modules' | 'pipeline' | 'testing' | 'history';

const sensitivityColors: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const actionColors: Record<string, string> = {
  BLOCKED: 'bg-red-50 text-red-700',
  MASKED: 'bg-primary-50 text-primary-700',
  ALLOWED: 'bg-green-50 text-green-700',
  ALERTED: 'bg-yellow-50 text-yellow-700',
};

export function DetectionEngine() {
  const [activeTab, setActiveTab] = useState<TabType>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modules, setModules] = useState(detectionModules);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editingPattern, setEditingPattern] = useState<{ moduleId: string; pattern: DetectionPattern } | null>(null);
  const [showAddPattern, setShowAddPattern] = useState<string | null>(null);
  const [configModule, setConfigModule] = useState<string | null>(null);

  // Testing state
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // New pattern state
  const [newPattern, setNewPattern] = useState<{ name: string; pattern: string; type: 'regex' | 'keyword' | 'ml'; description: string }>({ name: '', pattern: '', type: 'regex', description: '' });

  // Config editing state
  const [editConfig, setEditConfig] = useState({ threshold: 0.7, contextWindow: 100, allowListText: '', denyListText: '' });

  const categories = [
    { value: 'all', label: 'All Modules' },
    { value: 'pii', label: 'PII' },
    { value: 'indian_pii', label: 'Indian PII' },
    { value: 'credentials', label: 'Credentials' },
    { value: 'code', label: 'Source Code' },
    { value: 'secrets', label: 'API Keys & Secrets' },
    { value: 'database', label: 'Database' },
    { value: 'custom', label: 'Custom' },
  ];

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'modules', label: 'Detection Modules', icon: Layers },
    { id: 'pipeline', label: 'Detection Pipeline', icon: Activity },
    { id: 'testing', label: 'Live Testing', icon: FlaskConical },
    { id: 'history', label: 'Recent Detections', icon: Clock },
  ];

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.entityTypes.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, selectedCategory]);

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, enabled: !m.enabled } : m));
  };

  const togglePattern = (moduleId: string, patternId: string) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId
        ? { ...m, patterns: m.patterns.map(p => p.id === patternId ? { ...p, enabled: !p.enabled } : p) }
        : m
    ));
  };

  const deletePattern = (moduleId: string, patternId: string) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId
        ? { ...m, patterns: m.patterns.filter(p => p.id !== patternId) }
        : m
    ));
  };

  const addPattern = (moduleId: string) => {
    if (!newPattern.name || !newPattern.pattern) return;
    const pat: DetectionPattern = {
      id: `pat-new-${Date.now()}`,
      name: newPattern.name,
      pattern: newPattern.pattern,
      type: newPattern.type,
      description: newPattern.description,
      enabled: true,
      examples: [],
      falsePositiveRate: 0,
    };
    setModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, patterns: [...m.patterns, pat] } : m
    ));
    setNewPattern({ name: '', pattern: '', type: 'regex', description: '' });
    setShowAddPattern(null);
  };

  const saveConfig = (moduleId: string) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId
        ? {
            ...m,
            config: {
              threshold: editConfig.threshold,
              contextWindow: editConfig.contextWindow,
              allowList: editConfig.allowListText.split('\n').filter(Boolean),
              denyList: editConfig.denyListText.split('\n').filter(Boolean),
            },
          }
        : m
    ));
    setConfigModule(null);
  };

  const openConfig = (mod: DetectionModule) => {
    setEditConfig({
      threshold: mod.config.threshold,
      contextWindow: mod.config.contextWindow,
      allowListText: mod.config.allowList.join('\n'),
      denyListText: mod.config.denyList.join('\n'),
    });
    setConfigModule(mod.id);
  };

  const runTest = useCallback(async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestResults(null);
    try {
      const response = await scanApi.scan(testInput);
      const results: TestResult[] = response.entities_detected.map((e) => ({
        entityType: e.entity_type,
        value: e.text,
        start: e.start,
        end: e.end,
        score: e.score,
        module: e.detector,
      }));
      setTestResults(results);
    } catch {
      setTestResults([]);
    } finally {
      setIsTesting(false);
    }
  }, [testInput]);

  // Stats
  const totalDetections = modules.reduce((s, m) => s + m.stats.totalDetections, 0);
  const totalLast24h = modules.reduce((s, m) => s + m.stats.last24h, 0);
  const enabledCount = modules.filter(m => m.enabled).length;
  const totalPatterns = modules.reduce((s, m) => s + m.patterns.length, 0);
  const avgAccuracy = (modules.reduce((s, m) => s + m.stats.accuracy, 0) / modules.length).toFixed(1);
  const avgResponseTime = (modules.reduce((s, m) => s + m.stats.avgResponseTime, 0) / modules.length).toFixed(0);

  const renderIcon = (iconName: string, className: string) => {
    const Icon = iconMap[iconName] || Shield;
    return <Icon className={className} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">Detection Engine</h1>
          <p className="mt-1 text-sm text-muted">
            Configure, monitor, and test all detection modules in the MazikDLP security pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-page hover:text-deep">
            <RefreshCw className="h-4 w-4" />
            Reload Engine
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark">
            <Cpu className="h-4 w-4" />
            Engine Status
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Detections', value: totalDetections.toLocaleString(), icon: Target, color: 'text-primary', bg: 'bg-primary-50' },
          { label: 'Last 24 Hours', value: totalLast24h.toString(), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Active Modules', value: `${enabledCount}/${modules.length}`, icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Patterns', value: totalPatterns.toString(), icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Response', value: `${avgResponseTime}ms`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-divider bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-deep">{stat.value}</p>
                <p className="text-[11px] text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-divider bg-card p-1 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-page hover:text-deep'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === MODULES TAB === */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="Search modules, entity types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-deep outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-deep outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Module Cards */}
          {filteredModules.map((mod) => {
            const isExpanded = expandedModule === mod.id;
            const sens = sensitivityColors[mod.sensitivity];
            return (
              <div
                key={mod.id}
                className={`rounded-xl border bg-card shadow-soft transition-all ${
                  mod.enabled ? 'border-divider' : 'border-divider opacity-60'
                }`}
              >
                {/* Module Header */}
                <div className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${mod.enabled ? 'bg-primary-50' : 'bg-gray-100'}`}>
                    {renderIcon(mod.icon, `h-6 w-6 ${mod.enabled ? 'text-primary' : 'text-subtle'}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-deep">{mod.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${sens.bg} ${sens.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sens.dot}`} />
                        {mod.sensitivity}
                      </span>
                      {mod.detectionMethod.map((m) => (
                        <span key={m} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                          {m}
                        </span>
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-muted line-clamp-1">{mod.description}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-muted">
                    <div className="hidden text-center md:block">
                      <p className="text-lg font-bold text-deep">{mod.stats.last24h}</p>
                      <p>Last 24h</p>
                    </div>
                    <div className="hidden text-center md:block">
                      <p className="text-lg font-bold text-deep">{mod.stats.accuracy}%</p>
                      <p>Accuracy</p>
                    </div>
                    <div className="hidden text-center md:block">
                      <p className="text-lg font-bold text-deep">{mod.stats.avgResponseTime}ms</p>
                      <p>Avg Time</p>
                    </div>
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex-shrink-0"
                      title={mod.enabled ? 'Disable module' : 'Enable module'}
                    >
                      {mod.enabled ? (
                        <ToggleRight className="h-8 w-8 text-primary" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-subtle" />
                      )}
                    </button>
                    <button
                      onClick={() => openConfig(mod)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-page hover:text-deep"
                      title="Module settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-page hover:text-deep"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Entity Types Bar */}
                <div className="border-t border-divider px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {mod.entityTypes.map((et) => (
                      <span key={et} className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                        {et}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expanded Section - Patterns */}
                {isExpanded && (
                  <div className="border-t border-divider bg-page/50">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 border-b border-divider p-5 sm:grid-cols-4 lg:grid-cols-7">
                      {[
                        { label: 'Total Detections', value: mod.stats.totalDetections.toLocaleString() },
                        { label: 'Last 24h', value: mod.stats.last24h.toString() },
                        { label: 'Last 7 Days', value: mod.stats.last7d.toLocaleString() },
                        { label: 'Last 30 Days', value: mod.stats.last30d.toLocaleString() },
                        { label: 'Accuracy', value: `${mod.stats.accuracy}%` },
                        { label: 'False Positive Rate', value: `${mod.stats.falsePositiveRate}%` },
                        { label: 'Avg Response', value: `${mod.stats.avgResponseTime}ms` },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-lg font-bold text-deep">{s.value}</p>
                          <p className="text-[11px] text-muted">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Patterns Table */}
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-deep">Detection Patterns ({mod.patterns.length})</h4>
                        <button
                          onClick={() => setShowAddPattern(showAddPattern === mod.id ? null : mod.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                        >
                          <Plus className="h-3 w-3" />
                          Add Pattern
                        </button>
                      </div>

                      {/* Add Pattern Form */}
                      {showAddPattern === mod.id && (
                        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
                          <h5 className="mb-3 text-sm font-semibold text-deep">New Pattern</h5>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              placeholder="Pattern name"
                              value={newPattern.name}
                              onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-deep outline-none focus:border-primary"
                            />
                            <select
                              value={newPattern.type}
                              onChange={(e) => setNewPattern({ ...newPattern, type: e.target.value as 'regex' | 'keyword' | 'ml' })}
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-deep outline-none focus:border-primary"
                            >
                              <option value="regex">Regex</option>
                              <option value="keyword">Keyword</option>
                              <option value="ml">ML-based</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Regex pattern or keyword"
                              value={newPattern.pattern}
                              onChange={(e) => setNewPattern({ ...newPattern, pattern: e.target.value })}
                              className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-deep outline-none focus:border-primary sm:col-span-2"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newPattern.description}
                              onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-deep outline-none focus:border-primary sm:col-span-2"
                            />
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              onClick={() => setShowAddPattern(null)}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-page"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => addPattern(mod.id)}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                            >
                              Add Pattern
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="overflow-hidden rounded-lg border border-divider">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-page text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3 hidden lg:table-cell">Pattern</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 hidden md:table-cell">False +ve</th>
                              <th className="px-4 py-3 hidden md:table-cell">Examples</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-divider bg-card">
                            {mod.patterns.map((pat) => (
                              <tr key={pat.id} className={`transition-colors hover:bg-page/50 ${!pat.enabled ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3">
                                  <button onClick={() => togglePattern(mod.id, pat.id)}>
                                    {pat.enabled ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-subtle" />
                                    )}
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-deep">{pat.name}</p>
                                  <p className="text-[11px] text-muted">{pat.description}</p>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  <code className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-primary-700 font-mono break-all line-clamp-1">
                                    {pat.pattern || '—'}
                                  </code>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-muted">
                                    {pat.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-muted">
                                  {(pat.falsePositiveRate * 100).toFixed(0)}%
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <div className="flex flex-wrap gap-1">
                                    {pat.examples.slice(0, 1).map((ex, i) => (
                                      <code key={i} className="rounded bg-page px-1.5 py-0.5 text-[10px] text-muted line-clamp-1">
                                        {ex.length > 30 ? ex.slice(0, 30) + '...' : ex}
                                      </code>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => setEditingPattern(editingPattern?.pattern.id === pat.id ? null : { moduleId: mod.id, pattern: pat })}
                                      className="rounded p-1.5 text-muted transition-colors hover:bg-page hover:text-deep"
                                      title="Edit"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(pat.pattern)}
                                      className="rounded p-1.5 text-muted transition-colors hover:bg-page hover:text-deep"
                                      title="Copy pattern"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deletePattern(mod.id, pat.id)}
                                      className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Module Info Footer */}
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
                        <span>Version: {mod.version}</span>
                        <span>•</span>
                        <span>Updated: {new Date(mod.lastUpdated).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Threshold: {mod.config.threshold}</span>
                        <span>•</span>
                        <span>Context Window: {mod.config.contextWindow} chars</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === PIPELINE TAB === */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-deep">Detection Pipeline</h3>
                <p className="text-sm text-muted">Sequential processing stages for incoming text analysis</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                <Activity className="h-3.5 w-3.5" />
                Pipeline Active
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="relative">
              {/* Input */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-deep">Input Text</h4>
                  <p className="text-xs text-muted">Raw prompt from browser extension</p>
                </div>
              </div>

              {/* Stages */}
              {pipelineStages.map((stage, idx) => {
                const mod = modules.find(m => m.id === stage.moduleId);
                const isEnabled = stage.enabled;
                return (
                  <div key={stage.id} className="relative ml-7">
                    {/* Connector Line */}
                    <div className={`absolute left-0 -top-2 h-6 w-0.5 ${isEnabled ? 'bg-primary-200' : 'bg-gray-200'}`} />

                    <div className={`mt-4 flex items-center gap-4 rounded-xl border p-4 transition-all ${
                      isEnabled ? 'border-divider bg-card shadow-soft' : 'border-dashed border-gray-300 bg-gray-50 opacity-60'
                    }`}>
                      {/* Stage Number */}
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        isEnabled ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-subtle'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-deep">{stage.name}</h4>
                          {mod && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-subtle'
                            }`}>
                              {isEnabled ? 'Active' : 'Disabled'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">{stage.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted">
                        <div className="text-center">
                          <p className="text-base font-bold text-deep">{stage.avgTimeMs}ms</p>
                          <p>Avg Time</p>
                        </div>
                        {mod && (
                          <div className="text-center hidden sm:block">
                            <p className="text-base font-bold text-deep">{mod.stats.last24h}</p>
                            <p>Hits/24h</p>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      {idx < pipelineStages.length - 1 && (
                        <ArrowRight className={`h-4 w-4 flex-shrink-0 ${isEnabled ? 'text-primary' : 'text-subtle'}`} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Output */}
              <div className="relative ml-7">
                <div className="absolute left-0 -top-2 h-6 w-0.5 bg-primary-200" />
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 shadow-sm">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-deep">Policy Decision</h4>
                    <p className="text-xs text-muted">ALLOW / MASK / BLOCK based on matched policies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Performance */}
            <div className="mt-8 rounded-xl bg-page p-4">
              <h4 className="mb-3 text-sm font-semibold text-deep">Pipeline Performance Summary</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-2xl font-bold text-deep">
                    {pipelineStages.reduce((s, p) => s + p.avgTimeMs, 0)}ms
                  </p>
                  <p className="text-xs text-muted">Total Pipeline Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-deep">
                    {pipelineStages.filter(s => s.enabled).length}/{pipelineStages.length}
                  </p>
                  <p className="text-xs text-muted">Active Stages</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-deep">~2,450</p>
                  <p className="text-xs text-muted">Prompts/min Capacity</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-deep">99.97%</p>
                  <p className="text-xs text-muted">Uptime (30d)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === TESTING TAB === */}
      {activeTab === 'testing' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-deep">Test Input</h3>
              </div>
              <span className="text-xs text-muted">
                {modules.filter(m => m.enabled).length} modules active
              </span>
            </div>

            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Paste or type text to test detection modules..."
              rows={8}
              className="w-full rounded-lg border border-border bg-page p-4 font-mono text-sm text-deep outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-100 resize-none"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {testSamples.slice(0, 5).map((sample) => (
                  <button
                    key={sample.label}
                    onClick={() => { setTestInput(sample.text); setTestResults(null); }}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {testSamples.slice(5).map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => { setTestInput(sample.text); setTestResults(null); }}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <button
              onClick={runTest}
              disabled={!testInput.trim() || isTesting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Detection...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Run Detection Test
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="rounded-xl border border-divider bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-deep">Detection Results</h3>
            </div>

            {testResults === null ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Eye className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm font-medium text-muted">No test run yet</p>
                <p className="mt-1 text-xs text-subtle">Enter text and click "Run Detection Test" to see results</p>
              </div>
            ) : testResults.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <CheckCircle className="mb-3 h-12 w-12 text-green-400" />
                <p className="text-sm font-medium text-green-700">No Sensitive Data Detected</p>
                <p className="mt-1 text-xs text-muted">The input text appears clean based on active detection modules</p>
                <div className="mt-4 rounded-lg bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
                  Action: ALLOW
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      {testResults.length} Sensitive {testResults.length === 1 ? 'Entity' : 'Entities'} Detected
                    </p>
                    <p className="text-xs text-red-600">
                      Recommended Action: BLOCK
                    </p>
                  </div>
                </div>

                {/* Highlighted Text */}
                <div className="rounded-lg bg-page p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Highlighted Input</p>
                  <p className="font-mono text-sm leading-relaxed text-deep">
                    {(() => {
                      const sorted = [...testResults].sort((a, b) => a.start - b.start);
                      const parts: React.ReactElement[] = [];
                      let lastEnd = 0;
                      sorted.forEach((r, i) => {
                        if (r.start > lastEnd) {
                          parts.push(<span key={`text-${i}`}>{testInput.slice(lastEnd, r.start)}</span>);
                        }
                        parts.push(
                          <span key={`match-${i}`} className="rounded bg-red-100 px-0.5 text-red-700 font-semibold" title={r.entityType}>
                            {testInput.slice(r.start, r.end)}
                          </span>
                        );
                        lastEnd = r.end;
                      });
                      if (lastEnd < testInput.length) {
                        parts.push(<span key="text-end">{testInput.slice(lastEnd)}</span>);
                      }
                      return parts;
                    })()}
                  </p>
                </div>

                {/* Results Table */}
                <div className="overflow-hidden rounded-lg border border-divider">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-page text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                        <th className="px-4 py-2.5">Entity Type</th>
                        <th className="px-4 py-2.5">Value</th>
                        <th className="px-4 py-2.5">Module</th>
                        <th className="px-4 py-2.5">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider bg-card">
                      {testResults.map((r, i) => (
                        <tr key={i} className="hover:bg-page/50">
                          <td className="px-4 py-2.5">
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              {r.entityType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-deep">
                              {r.value.length > 40 ? r.value.slice(0, 40) + '...' : r.value}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted">{r.module}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{ width: `${r.score * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted">{(r.score * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-divider bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-divider p-5">
            <div>
              <h3 className="text-base font-semibold text-deep">Recent Detections</h3>
              <p className="text-sm text-muted">Real-time feed of detection events across all modules</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          </div>

          <div className="divide-y divide-divider">
            {detectionHistory.map((event, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-page/50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-deep">{event.entity}</p>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                      {event.module}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{event.user}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${actionColors[event.action]}`}>
                  {event.action}
                </span>
                <span className="text-xs text-subtle">{event.time}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-divider p-4 text-center">
            <button className="text-sm font-medium text-primary hover:text-primary-dark">
              View All Detection Logs →
            </button>
          </div>
        </div>
      )}

      {/* === CONFIG MODAL === */}
      {configModule && (() => {
        const mod = modules.find(m => m.id === configModule);
        if (!mod) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-divider bg-card p-6 shadow-elevated">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-deep">{mod.name} Configuration</h3>
                    <p className="text-xs text-muted">Module settings and thresholds</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfigModule(null)}
                  className="rounded-lg p-2 text-muted hover:bg-page hover:text-deep"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">
                    Detection Threshold
                    <span className="ml-2 text-xs text-muted">({editConfig.threshold})</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editConfig.threshold}
                    onChange={(e) => setEditConfig({ ...editConfig, threshold: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>Lenient (0.0)</span>
                    <span>Strict (1.0)</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">
                    Context Window (characters)
                  </label>
                  <input
                    type="number"
                    value={editConfig.contextWindow}
                    onChange={(e) => setEditConfig({ ...editConfig, contextWindow: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">
                    Allow List <span className="text-xs text-muted">(one per line)</span>
                  </label>
                  <textarea
                    value={editConfig.allowListText}
                    onChange={(e) => setEditConfig({ ...editConfig, allowListText: e.target.value })}
                    rows={3}
                    placeholder="Values to exclude from detection..."
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 font-mono text-sm text-deep outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">
                    Deny List <span className="text-xs text-muted">(one per line)</span>
                  </label>
                  <textarea
                    value={editConfig.denyListText}
                    onChange={(e) => setEditConfig({ ...editConfig, denyListText: e.target.value })}
                    rows={3}
                    placeholder="Additional terms to always detect..."
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 font-mono text-sm text-deep outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfigModule(null)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-page"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveConfig(mod.id)}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* === PATTERN EDIT MODAL === */}
      {editingPattern && (() => {
        const pat = editingPattern.pattern;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-divider bg-card p-6 shadow-elevated">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <Pencil className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-deep">Edit Pattern</h3>
                    <p className="text-xs text-muted">{pat.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingPattern(null)}
                  className="rounded-lg p-2 text-muted hover:bg-page hover:text-deep"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">Pattern Name</label>
                  <input
                    type="text"
                    defaultValue={pat.name}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">Regex Pattern</label>
                  <input
                    type="text"
                    defaultValue={pat.pattern}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 font-mono text-sm text-deep outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-deep">Description</label>
                  <textarea
                    defaultValue={pat.description}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-page px-3 py-2.5 text-sm text-deep outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-page p-3">
                  <Info className="h-4 w-4 text-muted" />
                  <p className="text-xs text-muted">
                    Changes will take effect on the next detection pipeline reload.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingPattern(null)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-page"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setEditingPattern(null)}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
