import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, Filter, Plus, Download, Upload, Copy, Trash2, Edit2,
  Eye, ChevronRight, ChevronDown, ChevronUp, X, Check, Play,
  AlertTriangle, Shield, Clock, Hash, Code, ToggleLeft, ToggleRight,
  Tag, FileText, Zap, BarChart3, TrendingUp, Activity, RefreshCw,
  BookOpen, GitBranch, CheckCircle2, XCircle, Info, Settings,
  Layers, Target, Archive, MoreVertical,
} from 'lucide-react';
import {
  patternCategories,
  patternVersionHistory,
  type CustomPattern,
} from '../data/customPatternsData';
import { patterns as patternsApi } from '../lib/api';
import type { Pattern as ApiPattern } from '../lib/api';

function apiToPattern(p: ApiPattern): CustomPattern {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    category: p.category ?? 'Custom',
    type: (p.pattern_type as CustomPattern['type']) ?? 'regex',
    pattern: p.pattern,
    flags: 'g',
    sensitivity: (p.sensitivity as CustomPattern['sensitivity']) ?? 'medium',
    action: (p.action as CustomPattern['action']) ?? 'mask',
    enabled: p.is_enabled,
    caseSensitive: false,
    entityType: p.entity_type,
    examples: [],
    nonExamples: [],
    falsePositiveRate: 0,
    totalDetections: p.total_detections,
    last24h: 0,
    last7d: 0,
    last30d: 0,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
    version: p.version,
    tags: p.tags ?? [],
    contextWindow: 50,
    notes: '',
  };
}

type Tab = 'patterns' | 'categories' | 'tester' | 'analytics';
type View = 'list' | 'detail' | 'create' | 'edit';

const sensitivityColors: Record<string, string> = {
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const sensitivityDots: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const actionColors: Record<string, string> = {
  allow: 'bg-emerald-50 text-emerald-700',
  alert: 'bg-blue-50 text-blue-700',
  mask: 'bg-purple-50 text-purple-700',
  soft_block: 'bg-orange-50 text-orange-700',
  hard_block: 'bg-red-50 text-red-700',
};

const actionLabels: Record<string, string> = {
  allow: 'Allow',
  alert: 'Alert Only',
  mask: 'Mask',
  soft_block: 'Soft Block',
  hard_block: 'Hard Block',
};

const typeColors: Record<string, string> = {
  regex: 'bg-violet-50 text-violet-700 border-violet-200',
  keyword: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  keyword_list: 'bg-teal-50 text-teal-700 border-teal-200',
  composite: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const typeLabels: Record<string, string> = {
  regex: 'Regex',
  keyword: 'Keyword',
  keyword_list: 'Keyword List',
  composite: 'Composite',
};

export function CustomPatterns() {
  const [tab, setTab] = useState<Tab>('patterns');
  const [view, setView] = useState<View>('list');
  const [patterns, setPatterns] = useState<CustomPattern[]>([]);

  useEffect(() => {
    patternsApi.list()
      .then((data) => setPatterns(data.map(apiToPattern)))
      .catch(() => setPatterns([]));
  }, []);
  const [selectedPattern, setSelectedPattern] = useState<CustomPattern | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSensitivity, setFilterSensitivity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterEnabled, setFilterEnabled] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'detections' | 'updated' | 'sensitivity'>('detections');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Tester state
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<{
    patternId: string; patternName: string; matches: { value: string; start: number; end: number }[];
    action: string; sensitivity: string;
  }[] | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Create/Edit state
  const [formData, setFormData] = useState<Partial<CustomPattern>>({
    name: '', description: '', category: 'Internal Identifiers', type: 'regex', pattern: '',
    flags: 'g', sensitivity: 'medium', action: 'mask', enabled: true, caseSensitive: false,
    entityType: '', examples: [''], nonExamples: [''], tags: [], contextWindow: 50, notes: '',
    keywords: [],
  });
  const [formStep, setFormStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const perPage = 10;
  const categories = [...new Set(patterns.map(p => p.category))];

  const filteredPatterns = useMemo(() => {
    let result = [...patterns];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.entityType.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== 'all') result = result.filter(p => p.category === filterCategory);
    if (filterSensitivity !== 'all') result = result.filter(p => p.sensitivity === filterSensitivity);
    if (filterAction !== 'all') result = result.filter(p => p.action === filterAction);
    if (filterType !== 'all') result = result.filter(p => p.type === filterType);
    if (filterEnabled !== 'all') result = result.filter(p => filterEnabled === 'enabled' ? p.enabled : !p.enabled);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'detections') cmp = a.totalDetections - b.totalDetections;
      else if (sortBy === 'updated') cmp = a.updatedAt.localeCompare(b.updatedAt);
      else if (sortBy === 'sensitivity') {
        const order = { low: 0, medium: 1, high: 2, critical: 3 };
        cmp = order[a.sensitivity] - order[b.sensitivity];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [patterns, search, filterCategory, filterSensitivity, filterAction, filterType, filterEnabled, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredPatterns.length / perPage);
  const paginatedPatterns = filteredPatterns.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: patterns.length,
    enabled: patterns.filter(p => p.enabled).length,
    disabled: patterns.filter(p => !p.enabled).length,
    critical: patterns.filter(p => p.sensitivity === 'critical').length,
    totalDetections: patterns.reduce((s, p) => s + p.totalDetections, 0),
    last24h: patterns.reduce((s, p) => s + p.last24h, 0),
    avgFalsePositive: +(patterns.reduce((s, p) => s + p.falsePositiveRate, 0) / patterns.length).toFixed(1),
    categories: new Set(patterns.map(p => p.category)).size,
  }), [patterns]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronDown className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const togglePattern = useCallback((id: string) => {
    setPatterns(prev => {
      const current = prev.find(p => p.id === id);
      if (current) patternsApi.update(id, { is_enabled: !current.enabled } as never).catch(() => {});
      return prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    });
  }, []);

  const runTest = useCallback(() => {
    if (!testInput.trim()) return;
    setTestRunning(true);
    setTimeout(() => {
      const results: typeof testResults = [];
      patterns.filter(p => p.enabled).forEach(p => {
        const matches: { value: string; start: number; end: number }[] = [];
        if (p.type === 'keyword_list' && p.keywords) {
          p.keywords.forEach(kw => {
            let idx = testInput.indexOf(kw);
            while (idx !== -1) {
              matches.push({ value: kw, start: idx, end: idx + kw.length });
              idx = testInput.indexOf(kw, idx + 1);
            }
          });
        } else if (p.pattern) {
          try {
            const regex = new RegExp(p.pattern, p.flags || 'g');
            let match;
            while ((match = regex.exec(testInput)) !== null) {
              matches.push({ value: match[0], start: match.index, end: match.index + match[0].length });
              if (!regex.global) break;
            }
          } catch {
            // invalid regex, skip
          }
        }
        if (matches.length > 0) {
          results.push({ patternId: p.id, patternName: p.name, matches, action: p.action, sensitivity: p.sensitivity });
        }
      });
      setTestResults(results);
      setTestRunning(false);
    }, 600);
  }, [testInput, patterns]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'patterns', label: 'All Patterns', icon: <Code className="h-4 w-4" /> },
    { key: 'categories', label: 'Categories', icon: <Layers className="h-4 w-4" /> },
    { key: 'tester', label: 'Pattern Tester', icon: <Play className="h-4 w-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // ===================== DETAIL VIEW =====================
  if (view === 'detail' && selectedPattern) {
    const versions = patternVersionHistory[selectedPattern.id] || [];
    return (
      <div className="space-y-6">
        <button onClick={() => { setView('list'); setSelectedPattern(null); }}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Patterns
        </button>

        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedPattern.enabled ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-400'}`}>
              <Code className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl font-bold text-deep">{selectedPattern.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sensitivityColors[selectedPattern.sensitivity]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sensitivityDots[selectedPattern.sensitivity]}`} />
                  {selectedPattern.sensitivity}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColors[selectedPattern.action]}`}>
                  {actionLabels[selectedPattern.action]}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[selectedPattern.type]}`}>
                  {typeLabels[selectedPattern.type]}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedPattern.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedPattern.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-muted">{selectedPattern.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {selectedPattern.category}</span>
                <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> {selectedPattern.entityType}</span>
                <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> v{selectedPattern.version}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {selectedPattern.updatedAt}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setView('edit'); setFormData({ ...selectedPattern }); setFormStep(0); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => togglePattern(selectedPattern.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${selectedPattern.enabled ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                {selectedPattern.enabled ? <><ToggleRight className="h-3.5 w-3.5" /> Disable</> : <><ToggleLeft className="h-3.5 w-3.5" /> Enable</>}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pattern Definition */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" /> Pattern Definition
              </h3>
              {selectedPattern.type === 'keyword_list' ? (
                <div>
                  <p className="text-xs text-muted mb-2">Keywords ({selectedPattern.keywords?.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPattern.keywords?.map((kw, i) => (
                      <span key={i} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-mono text-violet-700">{kw}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted mb-2">Regular Expression</p>
                  <div className="rounded-lg bg-gray-50 border border-divider p-4 font-mono text-sm text-deep break-all">
                    <span className="text-muted">/</span>{selectedPattern.pattern}<span className="text-muted">/{selectedPattern.flags}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                    <span>Flags: <code className="text-deep font-mono bg-gray-100 px-1 rounded">{selectedPattern.flags}</code></span>
                    <span>Case Sensitive: <span className="font-medium text-deep">{selectedPattern.caseSensitive ? 'Yes' : 'No'}</span></span>
                    <span>Context Window: <span className="font-medium text-deep">{selectedPattern.contextWindow} chars</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* Examples */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Examples & Non-Examples
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Should Match</p>
                  <div className="space-y-2">
                    {selectedPattern.examples.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <code className="text-xs font-mono text-emerald-800 break-all">{ex}</code>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Should Not Match</p>
                  <div className="space-y-2">
                    {selectedPattern.nonExamples.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                        <X className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        <code className="text-xs font-mono text-red-700 break-all">{ex}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" /> Version History
                </h3>
                <div className="space-y-0">
                  {versions.map((v, i) => (
                    <div key={v.version} className="flex items-start gap-4 py-3 border-l-2 border-divider ml-3 pl-5 relative">
                      <div className={`absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border-2 border-white ${i === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i === 0 ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-muted'}`}>v{v.version}</span>
                          <span className="text-xs text-muted">{v.updatedAt}</span>
                          <span className="text-xs text-muted">by {v.updatedBy}</span>
                        </div>
                        <p className="text-sm text-deep">{v.changeNote}</p>
                        <div className="mt-1.5 rounded bg-gray-50 border border-divider px-3 py-1.5 font-mono text-xs text-muted break-all">
                          /{v.pattern}/
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedPattern.notes && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Notes
                </h3>
                <p className="text-sm text-muted leading-relaxed">{selectedPattern.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Detection Stats */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Detection Statistics
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Detections', value: selectedPattern.totalDetections.toLocaleString(), color: 'text-primary' },
                  { label: 'Last 24 Hours', value: selectedPattern.last24h.toString(), color: 'text-deep' },
                  { label: 'Last 7 Days', value: selectedPattern.last7d.toLocaleString(), color: 'text-deep' },
                  { label: 'Last 30 Days', value: selectedPattern.last30d.toLocaleString(), color: 'text-deep' },
                  { label: 'False Positive Rate', value: `${selectedPattern.falsePositiveRate}%`, color: selectedPattern.falsePositiveRate > 3 ? 'text-red-600' : selectedPattern.falsePositiveRate > 1.5 ? 'text-amber-600' : 'text-emerald-600' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-muted">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              {/* Mini trend */}
              <div className="mt-4 pt-4 border-t border-divider">
                <p className="text-xs text-muted mb-2">30-Day Trend</p>
                <div className="flex items-end gap-0.5 h-12">
                  {Array.from({ length: 30 }, (_, i) => {
                    const base = selectedPattern.last30d / 30;
                    const val = Math.max(5, Math.floor(base * (0.5 + Math.random())));
                    const maxVal = Math.floor(base * 1.5) || 1;
                    return (
                      <div key={i} className="flex-1 rounded-t bg-primary-100 hover:bg-primary transition-colors cursor-pointer"
                        style={{ height: `${Math.min(100, (val / maxVal) * 100)}%` }} title={`Day ${i + 1}: ${val} detections`} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Metadata
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Pattern ID', value: selectedPattern.id },
                  { label: 'Entity Type', value: selectedPattern.entityType },
                  { label: 'Category', value: selectedPattern.category },
                  { label: 'Created By', value: selectedPattern.createdBy },
                  { label: 'Created', value: selectedPattern.createdAt },
                  { label: 'Last Updated', value: selectedPattern.updatedAt },
                  { label: 'Version', value: `v${selectedPattern.version}` },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted text-xs">{d.label}</span>
                    <span className="text-deep font-medium text-xs text-right">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedPattern.tags.map(tag => (
                  <span key={tag} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-muted">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== CREATE / EDIT VIEW =====================
  if (view === 'create' || view === 'edit') {
    const steps = ['Basic Info', 'Pattern Definition', 'Examples & Testing', 'Review'];
    return (
      <div className="space-y-6">
        <button onClick={() => { setView('list'); setFormStep(0); }}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Patterns
        </button>

        <h1 className="text-2xl font-bold text-deep">{view === 'create' ? 'Create New Pattern' : `Edit: ${formData.name}`}</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button onClick={() => setFormStep(i)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors w-full ${formStep === i ? 'bg-primary text-white' : formStep > i ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-muted border border-border'}`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${formStep === i ? 'bg-white/20 text-white' : formStep > i ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                  {formStep > i ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < steps.length - 1 && <div className={`h-0.5 w-4 flex-shrink-0 rounded ${formStep > i ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          {/* Step 0: Basic Info */}
          {formStep === 0 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Pattern Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Internal Project Code" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3} placeholder="Describe what this pattern detects and why..." className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {patternCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Entity Type *</label>
                  <input type="text" value={formData.entityType} onChange={e => setFormData({ ...formData, entityType: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. INTERNAL_PROJECT_CODE" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-mono text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Sensitivity Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                      <button key={level} onClick={() => setFormData({ ...formData, sensitivity: level })}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${formData.sensitivity === level ? `${sensitivityColors[level]} border-current` : 'border-border text-muted hover:bg-gray-50'}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${sensitivityDots[level]} mr-1.5`} />
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Enforcement Action</label>
                  <select value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value as CustomPattern['action'] })}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Tags</label>
                <input type="text" value={formData.tags?.join(', ')} onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Comma-separated tags" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          )}

          {/* Step 1: Pattern Definition */}
          {formStep === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Pattern Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['regex', 'keyword', 'keyword_list', 'composite'] as const).map(t => (
                    <button key={t} onClick={() => setFormData({ ...formData, type: t })}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${formData.type === t ? `${typeColors[t]} border-current` : 'border-border text-muted hover:bg-gray-50'}`}>
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.type === 'regex' || formData.type === 'composite') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Regular Expression *</label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2.5">
                      <span className="text-muted text-sm">/</span>
                      <input type="text" value={formData.pattern} onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                        placeholder="Enter regex pattern..." className="flex-1 bg-transparent font-mono text-sm text-deep focus:outline-none" />
                      <span className="text-muted text-sm">/</span>
                      <input type="text" value={formData.flags} onChange={e => setFormData({ ...formData, flags: e.target.value })}
                        className="w-12 bg-transparent font-mono text-sm text-deep focus:outline-none" placeholder="gi" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-deep cursor-pointer">
                      <input type="checkbox" checked={formData.caseSensitive} onChange={e => setFormData({ ...formData, caseSensitive: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                      Case Sensitive
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted">Context Window:</label>
                      <input type="number" value={formData.contextWindow} onChange={e => setFormData({ ...formData, contextWindow: parseInt(e.target.value) || 50 })}
                        className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <span className="text-xs text-muted">chars</span>
                    </div>
                  </div>
                </>
              )}

              {(formData.type === 'keyword' || formData.type === 'keyword_list') && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Keywords (one per line)</label>
                  <textarea value={formData.keywords?.join('\n')} onChange={e => setFormData({ ...formData, keywords: e.target.value.split('\n').filter(Boolean) })}
                    rows={6} placeholder="Enter keywords, one per line..." className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-mono text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  <p className="text-xs text-muted mt-1">{formData.keywords?.length || 0} keywords defined</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3} placeholder="Additional notes about this pattern..." className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
            </div>
          )}

          {/* Step 2: Examples & Testing */}
          {formStep === 2 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Positive Examples (should match)</span>
                </label>
                {formData.examples?.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="text" value={ex} onChange={e => {
                      const newExamples = [...(formData.examples || [])];
                      newExamples[i] = e.target.value;
                      setFormData({ ...formData, examples: newExamples });
                    }} placeholder="Enter an example that should match..."
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono text-deep focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={() => setFormData({ ...formData, examples: formData.examples?.filter((_, j) => j !== i) })}
                      className="rounded-lg p-2 text-muted hover:text-red-500 hover:bg-red-50 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => setFormData({ ...formData, examples: [...(formData.examples || []), ''] })}
                  className="text-xs text-primary font-medium hover:text-primary-dark transition-colors flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Example
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" /> Negative Examples (should NOT match)</span>
                </label>
                {formData.nonExamples?.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="text" value={ex} onChange={e => {
                      const newNonExamples = [...(formData.nonExamples || [])];
                      newNonExamples[i] = e.target.value;
                      setFormData({ ...formData, nonExamples: newNonExamples });
                    }} placeholder="Enter an example that should NOT match..."
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono text-deep focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={() => setFormData({ ...formData, nonExamples: formData.nonExamples?.filter((_, j) => j !== i) })}
                      className="rounded-lg p-2 text-muted hover:text-red-500 hover:bg-red-50 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => setFormData({ ...formData, nonExamples: [...(formData.nonExamples || []), ''] })}
                  className="text-xs text-primary font-medium hover:text-primary-dark transition-colors flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Non-Example
                </button>
              </div>

              {/* Quick test */}
              {formData.pattern && formData.type === 'regex' && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                  <p className="text-xs font-semibold text-deep mb-2 flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /> Quick Pattern Test</p>
                  <div className="space-y-2">
                    {formData.examples?.filter(Boolean).map((ex, i) => {
                      let matched = false;
                      try { matched = new RegExp(formData.pattern || '', formData.flags || 'g').test(ex); } catch { /* */ }
                      return (
                        <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${matched ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                          {matched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <code className="font-mono">{ex}</code>
                          <span className="ml-auto font-medium">{matched ? 'MATCH' : 'NO MATCH'}</span>
                        </div>
                      );
                    })}
                    {formData.nonExamples?.filter(Boolean).map((ex, i) => {
                      let matched = false;
                      try { matched = new RegExp(formData.pattern || '', formData.flags || 'g').test(ex); } catch { /* */ }
                      return (
                        <div key={`n_${i}`} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${!matched ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                          {!matched ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          <code className="font-mono">{ex}</code>
                          <span className="ml-auto font-medium">{!matched ? 'CORRECT (no match)' : 'FALSE POSITIVE'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {formStep === 3 && (
            <div className="space-y-5 max-w-2xl">
              <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                <p className="text-xs font-semibold text-primary mb-1">Review your pattern configuration</p>
                <p className="text-xs text-muted">Ensure all details are correct before saving.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Name', value: formData.name },
                  { label: 'Entity Type', value: formData.entityType },
                  { label: 'Category', value: formData.category },
                  { label: 'Type', value: typeLabels[formData.type || 'regex'] },
                  { label: 'Sensitivity', value: formData.sensitivity },
                  { label: 'Action', value: actionLabels[formData.action || 'mask'] },
                  { label: 'Case Sensitive', value: formData.caseSensitive ? 'Yes' : 'No' },
                  { label: 'Context Window', value: `${formData.contextWindow} chars` },
                ].map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-divider">
                    <span className="text-xs text-muted">{d.label}</span>
                    <span className="text-sm font-medium text-deep capitalize">{d.value}</span>
                  </div>
                ))}
              </div>
              {formData.pattern && (
                <div>
                  <p className="text-xs text-muted mb-1">Pattern</p>
                  <div className="rounded-lg bg-gray-50 border border-divider p-3 font-mono text-sm text-deep break-all">
                    /{formData.pattern}/{formData.flags}
                  </div>
                </div>
              )}
              {formData.description && (
                <div>
                  <p className="text-xs text-muted mb-1">Description</p>
                  <p className="text-sm text-deep">{formData.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {formError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {formError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => { setFormError(null); formStep > 0 ? setFormStep(formStep - 1) : setView('list'); }}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">
            {formStep === 0 ? 'Cancel' : 'Previous'}
          </button>
          <div className="flex gap-2">
            {formStep < 3 ? (
              <button onClick={() => setFormStep(formStep + 1)}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                Next
              </button>
            ) : (
              <button
                disabled={isSaving}
                onClick={async () => {
                  setFormError(null);
                  if (!formData.name?.trim()) { setFormError('Pattern name is required.'); return; }
                  if (!formData.entityType?.trim()) { setFormError('Entity Type is required — go back to Step 1.'); return; }
                  if (!formData.pattern?.trim()) { setFormError('Pattern / Regex is required — go back to Step 2.'); return; }

                  setIsSaving(true);
                  try {
                    if (view === 'create') {
                      const created = await patternsApi.create({
                        name: formData.name!,
                        description: formData.description,
                        entity_type: formData.entityType!,
                        pattern_type: formData.type ?? 'regex',
                        pattern: formData.pattern!,
                        flags: formData.flags,
                        sensitivity: formData.sensitivity ?? 'medium',
                        action: formData.action ?? 'mask',
                        category: formData.category,
                        tags: formData.tags ?? [],
                        examples_positive: formData.examples?.filter(Boolean) ?? [],
                        examples_negative: formData.nonExamples?.filter(Boolean) ?? [],
                        is_enabled: formData.enabled ?? true,
                      });
                      setPatterns(prev => [apiToPattern(created), ...prev]);
                    } else if (view === 'edit' && selectedPattern) {
                      const updated = await patternsApi.update(selectedPattern.id, {
                        name: formData.name,
                        description: formData.description,
                        entity_type: formData.entityType,
                        pattern_type: formData.type,
                        pattern: formData.pattern,
                        sensitivity: formData.sensitivity,
                        action: (formData.action === 'soft_block' ? 'alert' : formData.action),
                        category: formData.category,
                        tags: formData.tags ?? [],
                        is_enabled: formData.enabled,
                      } as never);
                      setPatterns(prev => prev.map(p => p.id === updated.id ? apiToPattern(updated) : p));
                    }
                    setView('list');
                    setFormStep(0);
                  } catch (e: unknown) {
                    const msg = (e as { message?: string })?.message;
                    setFormError(msg || 'Failed to save pattern — check all required fields and try again.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isSaving ? 'Saving…' : view === 'create' ? 'Create Pattern' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== MAIN VIEW =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep">Custom Patterns</h1>
          <p className="text-sm text-muted mt-1">Define and manage enterprise-specific sensitive data patterns</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted shadow-soft hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={() => setShowExportModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted shadow-soft hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => { setView('create'); setFormData({ name: '', description: '', category: 'Internal Identifiers', type: 'regex', pattern: '', flags: 'g', sensitivity: 'medium', action: 'mask', enabled: true, caseSensitive: false, entityType: '', examples: [''], nonExamples: [''], tags: [], contextWindow: 50, notes: '', keywords: [] }); setFormStep(0); setFormError(null); setIsSaving(false); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Create Pattern
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <Code className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'Enabled', value: stats.enabled, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Disabled', value: stats.disabled, icon: <XCircle className="h-4 w-4" />, color: 'text-gray-500 bg-gray-100' },
          { label: 'Critical', value: stats.critical, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
          { label: 'Detections', value: stats.totalDetections.toLocaleString(), icon: <Target className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'Last 24h', value: stats.last24h, icon: <Activity className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Avg FP Rate', value: `${stats.avgFalsePositive}%`, icon: <BarChart3 className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Categories', value: stats.categories, icon: <Layers className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50' },
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

      {/* ===================== PATTERNS TAB ===================== */}
      {tab === 'patterns' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search patterns by name, entity type, regex, tags..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-soft transition-colors ${showFilters ? 'border-primary bg-primary-50 text-primary' : 'border-border bg-card text-muted hover:bg-gray-50'}`}>
              <Filter className="h-4 w-4" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft flex flex-wrap gap-3 items-end">
              {[
                { label: 'Category', value: filterCategory, setter: setFilterCategory, options: [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))] },
                { label: 'Sensitivity', value: filterSensitivity, setter: setFilterSensitivity, options: [{ value: 'all', label: 'All Levels' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }] },
                { label: 'Action', value: filterAction, setter: setFilterAction, options: [{ value: 'all', label: 'All Actions' }, ...Object.entries(actionLabels).map(([k, v]) => ({ value: k, label: v }))] },
                { label: 'Type', value: filterType, setter: setFilterType, options: [{ value: 'all', label: 'All Types' }, ...Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))] },
                { label: 'Status', value: filterEnabled, setter: setFilterEnabled, options: [{ value: 'all', label: 'All' }, { value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }] },
              ].map(f => (
                <div key={f.label} className="flex-1 min-w-[130px]">
                  <label className="block text-xs font-medium text-muted mb-1">{f.label}</label>
                  <select value={f.value} onChange={e => { f.setter(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={() => { setFilterCategory('all'); setFilterSensitivity('all'); setFilterAction('all'); setFilterType('all'); setFilterEnabled('all'); setPage(1); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {/* Patterns Table */}
          <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted w-8">
                      <Settings className="h-3.5 w-3.5" />
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('name')}>Pattern <SortIcon col="name" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Type</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('sensitivity')}>Sensitivity <SortIcon col="sensitivity" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Action</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('detections')}>Detections <SortIcon col="detections" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">FP Rate</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('updated')}>Updated <SortIcon col="updated" /></button>
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatterns.map(p => (
                    <>
                      <tr key={p.id} className="border-b border-divider last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedPattern(p); setView('detail'); }}>
                        <td className="py-3 px-4" onClick={e => { e.stopPropagation(); togglePattern(p.id); }}>
                          <button className={`relative h-5 w-9 rounded-full transition-colors ${p.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${p.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-deep truncate">{p.name}</p>
                              <button onClick={e => { e.stopPropagation(); setExpandedPattern(expandedPattern === p.id ? null : p.id); }}
                                className="text-muted hover:text-primary transition-colors">
                                {expandedPattern === p.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            <p className="text-xs text-muted truncate max-w-xs">{p.category} · {p.entityType}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeColors[p.type]}`}>{typeLabels[p.type]}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${sensitivityColors[p.sensitivity]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sensitivityDots[p.sensitivity]}`} />
                            {p.sensitivity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${actionColors[p.action]}`}>{actionLabels[p.action]}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div>
                            <p className="text-sm font-semibold text-deep">{p.totalDetections.toLocaleString()}</p>
                            <p className="text-[10px] text-muted">{p.last24h} today</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-medium ${p.falsePositiveRate > 3 ? 'text-red-600' : p.falsePositiveRate > 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {p.falsePositiveRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-muted">{p.updatedAt}</span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="relative">
                            <button onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)}
                              className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenu === p.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-border bg-card shadow-lg py-1">
                                  {[
                                    { icon: <Eye className="h-3.5 w-3.5" />, label: 'View Details', action: () => { setSelectedPattern(p); setView('detail'); setActionMenu(null); } },
                                    { icon: <Edit2 className="h-3.5 w-3.5" />, label: 'Edit Pattern', action: () => { setFormData({ ...p }); setView('edit'); setFormStep(0); setActionMenu(null); } },
                                    { icon: <Copy className="h-3.5 w-3.5" />, label: 'Duplicate', action: () => setActionMenu(null) },
                                    { icon: <Archive className="h-3.5 w-3.5" />, label: p.enabled ? 'Disable' : 'Enable', action: () => { togglePattern(p.id); setActionMenu(null); } },
                                    { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', action: () => { patternsApi.delete(p.id).catch(() => {}); setPatterns(prev => prev.filter(x => x.id !== p.id)); setActionMenu(null); }, danger: true },
                                  ].map((a, i) => (
                                    <button key={i} onClick={a.action}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${(a as { danger?: boolean }).danger ? 'text-red-600 hover:bg-red-50' : 'text-deep hover:bg-gray-50'}`}>
                                      {a.icon} {a.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row */}
                      {expandedPattern === p.id && (
                        <tr key={`${p.id}_exp`} className="border-b border-divider bg-gray-50/30">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs font-medium text-muted mb-1.5">Pattern / Keywords</p>
                                {p.type === 'keyword_list' ? (
                                  <div className="flex flex-wrap gap-1">
                                    {p.keywords?.slice(0, 5).map((kw, i) => (
                                      <span key={i} className="rounded bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-mono text-violet-700">{kw}</span>
                                    ))}
                                    {(p.keywords?.length || 0) > 5 && <span className="text-[10px] text-muted">+{(p.keywords?.length || 0) - 5} more</span>}
                                  </div>
                                ) : (
                                  <div className="rounded bg-gray-100 border border-divider px-3 py-1.5 font-mono text-xs text-deep break-all">
                                    /{p.pattern}/{p.flags}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted mb-1.5">Examples</p>
                                <div className="space-y-1">
                                  {p.examples.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs">
                                      <Check className="h-3 w-3 text-emerald-500" />
                                      <code className="font-mono text-deep">{ex}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted mb-1.5">Info</p>
                                <div className="space-y-1 text-xs text-muted">
                                  <p>Created by <span className="text-deep font-medium">{p.createdBy}</span></p>
                                  <p>Version <span className="text-deep font-medium">v{p.version}</span></p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {p.tags.map(t => <span key={t} className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-muted">{t}</span>)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
                <p className="text-xs text-muted">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredPatterns.length)} of {filteredPatterns.length} patterns</p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                    <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'text-muted border border-border hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== CATEGORIES TAB ===================== */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patternCategories.map(cat => {
              const catPatterns = patterns.filter(p => p.category === cat.name);
              const totalDet = catPatterns.reduce((s, p) => s + p.totalDetections, 0);
              const enabledCount = catPatterns.filter(p => p.enabled).length;
              return (
                <div key={cat.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => { setTab('patterns'); setFilterCategory(cat.name); }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${cat.color}15` }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-deep">{cat.name}</h3>
                      <p className="text-xs text-muted mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-deep">{catPatterns.length}</p>
                      <p className="text-[10px] text-muted">Patterns</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{enabledCount}</p>
                      <p className="text-[10px] text-muted">Enabled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{totalDet.toLocaleString()}</p>
                      <p className="text-[10px] text-muted">Detections</p>
                    </div>
                  </div>
                  {/* Sensitivity distribution */}
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                    {['critical', 'high', 'medium', 'low'].map(level => {
                      const count = catPatterns.filter(p => p.sensitivity === level).length;
                      if (count === 0) return null;
                      const pct = (count / catPatterns.length) * 100;
                      return <div key={level} className={`${sensitivityDots[level]} transition-all`} style={{ width: `${pct}%` }} title={`${level}: ${count}`} />;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {catPatterns.slice(0, 3).map(p => (
                      <span key={p.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-muted font-medium">{p.entityType}</span>
                    ))}
                    {catPatterns.length > 3 && <span className="text-[10px] text-muted">+{catPatterns.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category distribution */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Category Detection Volume</h3>
            <div className="space-y-3">
              {patternCategories.map(cat => {
                const catPatterns = patterns.filter(p => p.category === cat.name);
                const totalDet = catPatterns.reduce((s, p) => s + p.totalDetections, 0);
                const maxDet = Math.max(...patternCategories.map(c => patterns.filter(p => p.category === c.name).reduce((s, p) => s + p.totalDetections, 0)));
                return (
                  <div key={cat.id} className="flex items-center gap-4">
                    <div className="w-36 flex items-center gap-2 text-sm flex-shrink-0">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-medium text-deep truncate">{cat.name}</span>
                    </div>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg transition-all flex items-center px-2" style={{ width: `${(totalDet / maxDet) * 100}%`, backgroundColor: `${cat.color}30` }}>
                        <span className="text-[10px] font-bold" style={{ color: cat.color }}>{totalDet.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted w-16 text-right">{catPatterns.length} patterns</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TESTER TAB ===================== */}
      {tab === 'tester' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Test Input
                </h3>
                <textarea value={testInput} onChange={e => setTestInput(e.target.value)}
                  rows={10} placeholder="Paste text to test against all enabled custom patterns...&#10;&#10;Examples:&#10;- PRJ-ATLAS-001 is the project code&#10;- Employee EMP-100234 worked on MAZIK-4521&#10;- DB connection: jdbc:postgresql://db.internal:5432/prod&#10;- Revenue: ARR = $12.5 million"
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-mono text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted">{testInput.length} characters · {patterns.filter(p => p.enabled).length} patterns enabled</span>
                  <button onClick={runTest} disabled={!testInput.trim() || testRunning}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {testRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {testRunning ? 'Testing...' : 'Run Test'}
                  </button>
                </div>
              </div>
              {/* Sample inputs */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-xs font-semibold text-deep mb-3">Quick Test Samples</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Project & Tickets', text: 'Working on PRJ-ATLAS-001 and PRJ-PHOENIX-12345. Check MAZIK-4521 and SEC-102 for details.' },
                    { label: 'Database Schema', text: 'SELECT * FROM tbl_user_accounts WHERE status = "active"; See also vw_revenue_summary and sp_calculate_commission.' },
                    { label: 'Infrastructure', text: 'Connect to prod-api-01.maziktech.internal at 10.0.1.50. MongoDB: mongodb+srv://admin:pass@cluster0.abc.net/mydb' },
                    { label: 'Business Data', text: 'Customer CUST-IN-10045678 has contract CNT-2024-ENT-001234. Revenue: ARR = $12.5 million. Invoice INV-2024-00012345.' },
                    { label: 'Proprietary', text: 'The MazikScore algorithm and ThreatMatrix v3.2 are proprietary. Clone git@gitlab.maziktech.com:engineering/backend-api.git' },
                    { label: 'Mixed Content', text: 'Employee EMP-100234 reported incident INC-CRITICAL-20240115-001. Check #mazik-security-ops and https://wiki.maziktech.com/display/ENG/architecture.' },
                    { label: 'Clean Text', text: 'This is a regular email with no sensitive information. The weather is nice today.' },
                  ].map((s, i) => (
                    <button key={i} onClick={() => setTestInput(s.text)}
                      className="flex items-center gap-2 rounded-lg border border-divider px-3 py-2 text-left hover:bg-primary-50 hover:border-primary-200 transition-colors">
                      <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs font-medium text-deep">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Test Results
                </h3>
                {testResults === null ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Play className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-muted">Enter text and click "Run Test" to see results</p>
                    <p className="text-xs text-gray-400 mt-1">All enabled custom patterns will be tested</p>
                  </div>
                ) : testResults.length === 0 ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-emerald-700">No Matches Found</p>
                    <p className="text-xs text-emerald-600 mt-1">No custom patterns matched the input text.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`rounded-lg border p-4 ${testResults.some(r => r.action === 'hard_block') ? 'bg-red-50 border-red-200' : testResults.some(r => r.action === 'mask' || r.action === 'soft_block') ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${testResults.some(r => r.action === 'hard_block') ? 'text-red-600' : 'text-amber-600'}`} />
                        <span className={`text-sm font-semibold ${testResults.some(r => r.action === 'hard_block') ? 'text-red-700' : 'text-amber-700'}`}>
                          {testResults.reduce((s, r) => s + r.matches.length, 0)} matches across {testResults.length} patterns
                        </span>
                      </div>
                      <p className={`text-xs ${testResults.some(r => r.action === 'hard_block') ? 'text-red-600' : 'text-amber-600'}`}>
                        Recommended action: <span className="font-bold uppercase">
                          {testResults.some(r => r.action === 'hard_block') ? 'HARD BLOCK' :
                            testResults.some(r => r.action === 'soft_block') ? 'SOFT BLOCK' :
                              testResults.some(r => r.action === 'mask') ? 'MASK' : 'ALERT'}
                        </span>
                      </p>
                    </div>

                    {/* Individual Results */}
                    {testResults.map((r, i) => (
                      <div key={i} className="rounded-lg border border-divider p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-deep">{r.patternName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${sensitivityColors[r.sensitivity]}`}>{r.sensitivity}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${actionColors[r.action]}`}>{actionLabels[r.action]}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {r.matches.map((m, j) => (
                            <div key={j} className="flex items-center gap-2 rounded bg-red-50 border border-red-200 px-3 py-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              <code className="text-xs font-mono text-red-700 flex-1">{m.value}</code>
                              <span className="text-[10px] text-red-500">pos {m.start}–{m.end}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ANALYTICS TAB ===================== */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Patterns */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Patterns by Detection Volume
            </h3>
            <div className="space-y-3">
              {[...patterns].sort((a, b) => b.totalDetections - a.totalDetections).slice(0, 10).map((p, i) => {
                const maxDet = patterns.reduce((max, pat) => Math.max(max, pat.totalDetections), 0);
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted w-6 text-right">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-deep truncate">{p.name}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium capitalize ${sensitivityColors[p.sensitivity]}`}>{p.sensitivity}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(p.totalDetections / maxDet) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-20">
                      <p className="text-sm font-bold text-deep">{p.totalDetections.toLocaleString()}</p>
                      <p className="text-[10px] text-muted">+{p.last24h} today</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sensitivity Distribution */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Sensitivity Distribution</h3>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {(['critical', 'high', 'medium', 'low'] as const).map((level, i) => {
                      const count = patterns.filter(p => p.sensitivity === level).length;
                      const pct = (count / patterns.length) * 100;
                      const colors = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#3B82F6' };
                      const offsets = [0, ...(['critical', 'high', 'medium'] as const).map((_, j) => {
                        return (['critical', 'high', 'medium', 'low'] as const).slice(0, j + 1).reduce((s, l) => s + (patterns.filter(p => p.sensitivity === l).length / patterns.length) * 100, 0);
                      })];
                      return (
                        <circle key={level} cx="60" cy="60" r="50" fill="none" stroke={colors[level]} strokeWidth="12"
                          strokeDasharray={`${pct * 3.14} 314`} strokeDashoffset={`-${offsets[i] * 3.14}`} />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-deep">{patterns.length}</span>
                    <span className="text-xs text-muted">patterns</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {(['critical', 'high', 'medium', 'low'] as const).map(level => {
                  const count = patterns.filter(p => p.sensitivity === level).length;
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded ${sensitivityDots[level]}`} />
                        <span className="text-xs font-medium text-deep capitalize">{level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-deep">{count}</span>
                        <span className="text-xs text-muted">({Math.round((count / patterns.length) * 100)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Distribution */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Action Distribution</h3>
              <div className="space-y-4">
                {Object.entries(actionLabels).map(([key, label]) => {
                  const count = patterns.filter(p => p.action === key).length;
                  const pct = Math.round((count / patterns.length) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[key]}`}>{label}</span>
                        <span className="text-xs text-muted">{count} patterns ({pct}%)</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* False Positive Ranking */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Highest False Positive Rates
              </h3>
              <div className="space-y-3">
                {[...patterns].sort((a, b) => b.falsePositiveRate - a.falsePositiveRate).slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.falsePositiveRate > 3 ? 'bg-red-50 text-red-500' : p.falsePositiveRate > 1.5 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-deep truncate">{p.name}</p>
                      <p className="text-[10px] text-muted">{p.entityType}</p>
                    </div>
                    <span className={`text-sm font-bold ${p.falsePositiveRate > 3 ? 'text-red-600' : p.falsePositiveRate > 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {p.falsePositiveRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Type Distribution */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Pattern Type Distribution</h3>
              <div className="space-y-4">
                {Object.entries(typeLabels).map(([key, label]) => {
                  const count = patterns.filter(p => p.type === key).length;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${typeColors[key]} w-28 text-center`}>{label}</span>
                      <div className="flex-1 h-8 rounded-lg bg-gray-100 overflow-hidden flex items-center">
                        <div className="h-full bg-primary/20 flex items-center px-3 transition-all" style={{ width: `${(count / patterns.length) * 100}%` }}>
                          <span className="text-xs font-bold text-primary">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted w-10 text-right">{Math.round((count / patterns.length) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== IMPORT MODAL ===================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Import Patterns</h2>
              <button onClick={() => setShowImportModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Import Format</label>
                <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>JSON</option>
                  <option>CSV</option>
                  <option>YAML</option>
                  <option>Regex List</option>
                </select>
              </div>
              <div className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-8 text-center">
                <Upload className="h-10 w-10 text-primary/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-deep">Drop file here or click to browse</p>
                <p className="text-xs text-muted mt-1">Supports JSON, CSV, YAML formats</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">Imported patterns will be added as drafts and require review before enabling.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowImportModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowImportModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Upload className="h-4 w-4" /> Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== EXPORT MODAL ===================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Export Patterns</h2>
              <button onClick={() => setShowExportModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Export Format</label>
                <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>JSON</option>
                  <option>CSV</option>
                  <option>YAML</option>
                  <option>Regex List</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Scope</label>
                <div className="space-y-2">
                  {[
                    { label: `All Patterns (${patterns.length})`, value: 'all' },
                    { label: `Enabled Only (${patterns.filter(p => p.enabled).length})`, value: 'enabled' },
                    { label: `Current Filter (${filteredPatterns.length})`, value: 'filtered' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 rounded-lg border border-divider p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="radio" name="scope" defaultChecked={opt.value === 'all'} className="h-4 w-4 text-primary focus:ring-primary" />
                      <span className="text-sm text-deep">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowExportModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowExportModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
