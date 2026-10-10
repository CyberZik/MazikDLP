import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Policy,
  PolicyAction,
  PolicyStatus,
  ProtectionLevel,
  DATA_TYPES,
  AI_PLATFORMS,
  AI_MODELS,
  USER_GROUPS,
  POLICY_CATEGORIES,
  ACTION_CONFIG,
  LEVEL_CONFIG,
  STATUS_CONFIG,
  SAMPLE_TEST_TEXTS,
} from '../data/policyData';
import { policies as policiesApi, scan as scanApi, patterns as patternsApi } from '../lib/api';
import type { Policy as ApiPolicy, Pattern } from '../lib/api';

function apiToPolicy(p: ApiPolicy): Policy {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    status: (p.status as PolicyStatus) ?? 'draft',
    dataTypes: p.data_types ?? [],
    protectionLevel: (p.protection_level as ProtectionLevel) ?? 'medium',
    action: (p.action as PolicyAction) ?? 'alert',
    userGroups: p.user_groups ?? [],
    aiPlatforms: p.ai_platforms ?? [],
    aiModels: p.ai_models ?? [],
    customPatterns: [],
    conditions: [],
    createdBy: p.created_by ?? '',
    createdAt: p.created_at?.split('T')[0] ?? '',
    updatedAt: p.updated_at?.split('T')[0] ?? '',
    violations: 0,
    lastTriggered: 'Never',
    priority: p.priority ?? 100,
    category: p.category ?? '',
  };
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'test';

const emptyPolicy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt' | 'violations' | 'lastTriggered'> = {
  name: '',
  description: '',
  status: 'draft',
  dataTypes: [],
  protectionLevel: 'medium',
  action: 'alert',
  userGroups: ['all'],
  aiPlatforms: [],
  aiModels: [],
  customPatterns: [],
  conditions: [],
  createdBy: 'Admin',
  priority: 5,
  category: 'PII Protection',
};

export function Policies() {
  const [policiesList, setPoliciesList] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customPatterns, setCustomPatterns] = useState<Pattern[]>([]);

  const refreshPatterns = useCallback(() => {
    patternsApi.list()
      .then((p) => setCustomPatterns(p.filter(pt => pt.is_enabled)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      policiesApi.list(),
      patternsApi.list(),
    ]).then(([r, p]) => {
      setPoliciesList(r.map(apiToPolicy));
      setCustomPatterns(p.filter(pt => pt.is_enabled));
    }).catch(() => {
      setPoliciesList([]);
    }).finally(() => setIsLoading(false));
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all');
  const [filterAction, setFilterAction] = useState<PolicyAction | 'all'>('all');
  const [filterLevel, setFilterLevel] = useState<ProtectionLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [formData, setFormData] = useState(emptyPolicy);
  const [formStep, setFormStep] = useState(0);
  const [testText, setTestText] = useState('');
  const [testResults, setTestResults] = useState<null | { matched: Policy[]; action: string; entities: string[] }>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'priority' | 'violations' | 'updatedAt'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filter + search policies
  const filteredPolicies = useMemo(() => {
    let result = [...policiesList];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.dataTypes.some((d) => d.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') result = result.filter((p) => p.status === filterStatus);
    if (filterAction !== 'all') result = result.filter((p) => p.action === filterAction);
    if (filterLevel !== 'all') result = result.filter((p) => p.protectionLevel === filterLevel);
    if (filterCategory !== 'all') result = result.filter((p) => p.category === filterCategory);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'priority') cmp = a.priority - b.priority;
      else if (sortField === 'violations') cmp = a.violations - b.violations;
      else if (sortField === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [policiesList, searchQuery, filterStatus, filterAction, filterLevel, filterCategory, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => ({
    total: policiesList.length,
    active: policiesList.filter((p) => p.status === 'active').length,
    draft: policiesList.filter((p) => p.status === 'draft').length,
    inactive: policiesList.filter((p) => p.status === 'inactive').length,
    totalViolations: policiesList.reduce((sum, p) => sum + p.violations, 0),
    criticalPolicies: policiesList.filter((p) => p.protectionLevel === 'critical' && p.status === 'active').length,
  }), [policiesList]);

  const toggleSelectAll = () => {
    if (selectedPolicies.length === filteredPolicies.length) {
      setSelectedPolicies([]);
    } else {
      setSelectedPolicies(filteredPolicies.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPolicies((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleStatusToggle = useCallback((id: string) => {
    setPoliciesList((prev) => {
      const policy = prev.find((p) => p.id === id);
      if (!policy) return prev;
      const newStatus: PolicyStatus = policy.status === 'active' ? 'inactive' : 'active';
      policiesApi.update(id, { status: newStatus }).catch(() => {});
      return prev.map((p) =>
        p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : p
      );
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    policiesApi.delete(id).catch(() => {});
    setPoliciesList((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    setSelectedPolicies((prev) => prev.filter((p) => p !== id));
  }, []);

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = [...selectedPolicies];
    if (action === 'delete') {
      setPoliciesList((prev) => prev.filter((p) => !ids.includes(p.id)));
      Promise.all(ids.map((id) => policiesApi.delete(id))).catch(() => {});
    } else {
      const newStatus: PolicyStatus = action === 'activate' ? 'active' : 'inactive';
      setPoliciesList((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : p))
      );
      Promise.all(ids.map((id) => policiesApi.update(id, { status: newStatus }))).catch(() => {});
    }
    setSelectedPolicies([]);
  };

  const handleDuplicate = (policy: Policy) => {
    const payload = {
      name: `${policy.name} (Copy)`,
      description: policy.description,
      status: 'draft' as PolicyStatus,
      data_types: policy.dataTypes,
      protection_level: policy.protectionLevel,
      action: policy.action,
      user_groups: policy.userGroups,
      ai_platforms: policy.aiPlatforms,
      ai_models: policy.aiModels,
      priority: policy.priority,
      category: policy.category,
    };
    policiesApi.create(payload).then((created) => {
      setPoliciesList((prev) => [...prev, apiToPolicy(created)]);
    }).catch(() => {});
  };

  const openCreate = () => {
    setFormData(emptyPolicy);
    setFormStep(0);
    setFormError(null);
    setIsSaving(false);
    refreshPatterns();
    setViewMode('create');
  };

  const openEdit = (policy: Policy) => {
    setFormError(null);
    setIsSaving(false);
    setFormData({
      name: policy.name,
      description: policy.description,
      status: policy.status,
      dataTypes: [...policy.dataTypes],
      protectionLevel: policy.protectionLevel,
      action: policy.action,
      userGroups: [...policy.userGroups],
      aiPlatforms: [...policy.aiPlatforms],
      aiModels: [...policy.aiModels],
      customPatterns: [...policy.customPatterns],
      conditions: [...policy.conditions],
      createdBy: policy.createdBy,
      priority: policy.priority,
      category: policy.category,
    });
    setSelectedPolicy(policy);
    setFormStep(0);
    setViewMode('edit');
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      setFormError('Policy name is required.');
      return;
    }
    if (formData.dataTypes.length === 0) {
      setFormError('At least one data type must be selected.');
      return;
    }
    setFormError(null);

    const apiPayload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      data_types: formData.dataTypes,
      protection_level: formData.protectionLevel,
      action: formData.action,
      user_groups: formData.userGroups,
      ai_platforms: formData.aiPlatforms,
      ai_models: formData.aiModels,
      priority: formData.priority,
      category: formData.category,
    };

    setIsSaving(true);
    if (viewMode === 'create') {
      policiesApi.create(apiPayload).then((created) => {
        setPoliciesList((prev) => [apiToPolicy(created), ...prev]);
        setViewMode('list');
        setSelectedPolicy(null);
      }).catch((err) => {
        setFormError(err?.message || 'Failed to create policy.');
      }).finally(() => setIsSaving(false));
    } else if (viewMode === 'edit' && selectedPolicy) {
      policiesApi.update(selectedPolicy.id, apiPayload).then((updated) => {
        setPoliciesList((prev) =>
          prev.map((p) => p.id === selectedPolicy.id ? apiToPolicy(updated) : p)
        );
        setViewMode('list');
        setSelectedPolicy(null);
      }).catch((err) => {
        setFormError(err?.message || 'Failed to update policy.');
      }).finally(() => setIsSaving(false));
    }
  };

  const runTest = async () => {
    if (!testText.trim()) return;
    setIsTesting(true);
    setTestResults(null);
    try {
      const result = await scanApi.detectTest(testText);
      const entities = result.entity_types;

      const activePolicies = policiesList.filter((p) => p.status === 'active');
      const matched: Policy[] = [];
      for (const policy of activePolicies) {
        const hasMatch = policy.dataTypes.some((dt) => entities.includes(dt));
        if (hasMatch) matched.push(policy);
      }

      let finalAction = 'ALLOW';
      for (const m of matched) {
        if (m.action === 'hard_block') { finalAction = 'HARD BLOCK'; break; }
        if (m.action === 'soft_block' && finalAction !== 'HARD BLOCK') finalAction = 'SOFT BLOCK';
        if (m.action === 'mask' && finalAction === 'ALLOW') finalAction = 'MASK';
        if (m.action === 'alert' && finalAction === 'ALLOW') finalAction = 'ALERT';
      }

      setTestResults({ matched, action: finalAction, entities });
    } catch {
      setTestResults({ matched: [], action: 'ERROR', entities: [] });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  // ===================== RENDER =====================

  // Detail View
  if (viewMode === 'detail' && selectedPolicy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setViewMode('list'); setSelectedPolicy(null); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-deep">Policy Details</h1>
            <p className="text-sm text-muted mt-0.5">{selectedPolicy.id}</p>
          </div>
          <button onClick={() => openEdit(selectedPolicy)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
            Edit Policy
          </button>
          <button onClick={() => handleStatusToggle(selectedPolicy.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPolicy.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            {selectedPolicy.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-divider shadow-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-deep">{selectedPolicy.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: STATUS_CONFIG[selectedPolicy.status].bgColor, color: STATUS_CONFIG[selectedPolicy.status].color }}>{STATUS_CONFIG[selectedPolicy.status].label}</span>
              </div>
              <p className="text-muted text-sm leading-relaxed">{selectedPolicy.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-divider">
            <div>
              <p className="text-xs text-muted mb-1">Protection Level</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: LEVEL_CONFIG[selectedPolicy.protectionLevel].bgColor, color: LEVEL_CONFIG[selectedPolicy.protectionLevel].color }}>
                {LEVEL_CONFIG[selectedPolicy.protectionLevel].icon} {LEVEL_CONFIG[selectedPolicy.protectionLevel].label}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Action</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: ACTION_CONFIG[selectedPolicy.action].bgColor, color: ACTION_CONFIG[selectedPolicy.action].color }}>
                {ACTION_CONFIG[selectedPolicy.action].icon} {ACTION_CONFIG[selectedPolicy.action].label}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Category</p>
              <p className="text-sm font-medium text-deep">{selectedPolicy.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Priority</p>
              <p className="text-sm font-medium text-deep">P{selectedPolicy.priority}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Types */}
          <div className="bg-white rounded-xl border border-divider shadow-card p-6">
            <h3 className="text-sm font-semibold text-deep mb-3">Protected Data Types</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPolicy.dataTypes.length > 0 ? selectedPolicy.dataTypes.map((dt) => {
                const dtInfo = DATA_TYPES.find((d) => d.id === dt);
                const cpInfo = customPatterns.find((p) => p.entity_type === dt);
                return (
                  <span key={dt} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                    {dtInfo?.icon ?? '🧩'} {dtInfo?.label ?? cpInfo?.name ?? dt}
                  </span>
                );
              }) : <p className="text-sm text-muted">No specific data types (model restriction policy)</p>}
            </div>
          </div>

          {/* Scope */}
          <div className="bg-white rounded-xl border border-divider shadow-card p-6">
            <h3 className="text-sm font-semibold text-deep mb-3">Applied To</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted mb-1.5">User Groups</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPolicy.userGroups.map((g) => {
                    const grp = USER_GROUPS.find((u) => u.id === g);
                    return <span key={g} className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">{grp?.label || g}</span>;
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1.5">AI Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPolicy.aiPlatforms.map((p) => {
                    const plat = AI_PLATFORMS.find((a) => a.id === p);
                    return <span key={p} className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">{plat?.icon} {plat?.label || p}</span>;
                  })}
                </div>
              </div>
              {selectedPolicy.aiModels.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1.5">AI Models</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPolicy.aiModels.map((m) => {
                      const mdl = AI_MODELS.find((a) => a.id === m);
                      return <span key={m} className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">{mdl?.label || m}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-divider shadow-card p-6">
            <h3 className="text-sm font-semibold text-deep mb-3">Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{selectedPolicy.violations}</p>
                <p className="text-xs text-red-500 mt-0.5">Total Violations</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-primary">{selectedPolicy.lastTriggered}</p>
                <p className="text-xs text-primary-400 mt-0.5">Last Triggered</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl border border-divider shadow-card p-6">
            <h3 className="text-sm font-semibold text-deep mb-3">Metadata</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Created By</span><span className="font-medium text-deep">{selectedPolicy.createdBy}</span></div>
              <div className="flex justify-between"><span className="text-muted">Created</span><span className="font-medium text-deep">{selectedPolicy.createdAt}</span></div>
              <div className="flex justify-between"><span className="text-muted">Last Updated</span><span className="font-medium text-deep">{selectedPolicy.updatedAt}</span></div>
              <div className="flex justify-between"><span className="text-muted">Policy ID</span><span className="font-mono text-deep">{selectedPolicy.id}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test View
  if (viewMode === 'test') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setViewMode('list'); setTestResults(null); setTestText(''); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-deep">Policy Tester</h1>
            <p className="text-sm text-muted mt-0.5">Test text against active policies to see what would be detected and blocked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-divider shadow-card p-6">
              <h3 className="text-sm font-semibold text-deep mb-3">Test Input</h3>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full h-40 p-4 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                placeholder="Paste or type text to test against your policies..."
              />
              <div className="flex items-center gap-3 mt-4">
                <button onClick={runTest} disabled={!testText.trim() || isTesting} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isTesting ? 'Analyzing...' : 'Run Test'}
                </button>
                <button onClick={() => { setTestText(''); setTestResults(null); }} className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-gray-50 transition-colors">
                  Clear
                </button>
              </div>
            </div>

            {/* Results */}
            {testResults && (
              <div className="bg-white rounded-xl border border-divider shadow-card p-6">
                <h3 className="text-sm font-semibold text-deep mb-4">Test Results</h3>

                {/* Final Action Banner */}
                <div className={`p-4 rounded-lg mb-4 ${
                  testResults.action === 'ERROR' ? 'bg-red-50 border border-red-200' :
                  testResults.action === 'HARD BLOCK' ? 'bg-red-50 border border-red-200' :
                  testResults.action === 'SOFT BLOCK' ? 'bg-orange-50 border border-orange-200' :
                  testResults.action === 'MASK' ? 'bg-purple-50 border border-purple-200' :
                  testResults.action === 'ALERT' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {testResults.action === 'ERROR' ? '❌' : testResults.action === 'HARD BLOCK' ? '🚫' : testResults.action === 'SOFT BLOCK' ? '⚠️' : testResults.action === 'MASK' ? '🎭' : testResults.action === 'ALERT' ? '🔔' : '✅'}
                    </span>
                    <div>
                      <p className={`font-bold text-lg ${
                        testResults.action === 'ERROR' ? 'text-red-700' :
                        testResults.action === 'HARD BLOCK' ? 'text-red-700' :
                        testResults.action === 'SOFT BLOCK' ? 'text-orange-700' :
                        testResults.action === 'MASK' ? 'text-purple-700' :
                        testResults.action === 'ALERT' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {testResults.action}
                      </p>
                      <p className="text-sm text-muted">
                        {testResults.action === 'ERROR' ? 'Detection service unavailable. Check that the backend is running.' :
                         testResults.action === 'ALLOW' ? 'No sensitive data detected. Prompt would be allowed.' :
                         `This prompt would be ${testResults.action.toLowerCase()}ed by active policies.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detected Entities */}
                {testResults.entities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted mb-2">Detected Entities</p>
                    <div className="flex flex-wrap gap-2">
                      {testResults.entities.map((e) => {
                        const dtInfo = DATA_TYPES.find((d) => d.id === e);
                        const cpInfo = customPatterns.find((p) => p.entity_type === e);
                        return (
                          <span key={e} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                            {dtInfo?.icon ?? '🧩'} {dtInfo?.label ?? cpInfo?.name ?? e}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matched Policies */}
                {testResults.matched.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-2">Matched Policies ({testResults.matched.length})</p>
                    <div className="space-y-2">
                      {testResults.matched.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-divider">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted">{p.id}</span>
                            <span className="text-sm font-medium text-deep">{p.name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: ACTION_CONFIG[p.action].bgColor, color: ACTION_CONFIG[p.action].color }}>
                            {ACTION_CONFIG[p.action].icon} {ACTION_CONFIG[p.action].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Sample Texts */}
          <div className="bg-white rounded-xl border border-divider shadow-card p-6">
            <h3 className="text-sm font-semibold text-deep mb-3">Sample Test Cases</h3>
            <p className="text-xs text-muted mb-4">Click any sample to load it into the tester</p>
            <div className="space-y-2">
              {SAMPLE_TEST_TEXTS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => { setTestText(sample.text); setTestResults(null); }}
                  className="w-full text-left p-3 rounded-lg border border-divider hover:border-primary/30 hover:bg-primary-50 transition-all"
                >
                  <p className="text-xs font-semibold text-primary mb-1">{sample.label}</p>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{sample.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create / Edit Form
  if (viewMode === 'create' || viewMode === 'edit') {
    const steps = [
      { label: 'Basic Info', icon: '📋' },
      { label: 'Data Types', icon: '🛡️' },
      { label: 'Scope', icon: '🎯' },
      { label: 'Review', icon: '✅' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setViewMode('list'); setSelectedPolicy(null); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-deep">{viewMode === 'create' ? 'Create New Policy' : `Edit Policy — ${selectedPolicy?.id}`}</h1>
            <p className="text-sm text-muted mt-0.5">Step {formStep + 1} of {steps.length}: {steps[formStep].label}</p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="bg-white rounded-xl border border-divider shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setFormStep(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    i === formStep ? 'bg-primary text-white shadow-sm' :
                    i < formStep ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-muted'
                  }`}
                >
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${i < formStep ? 'bg-primary' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {formStep === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-deep mb-1.5">Policy Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="e.g., Block PAN Numbers to External AI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none h-24"
                  placeholder="Describe what this policy does and why it's needed..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deep mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    {POLICY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => <option key={p} value={p}>P{p} {p <= 2 ? '(Critical)' : p <= 4 ? '(High)' : p <= 6 ? '(Medium)' : '(Low)'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PolicyStatus })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Protection Level */}
              <div>
                <label className="block text-sm font-medium text-deep mb-2">Protection Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(LEVEL_CONFIG) as ProtectionLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, protectionLevel: level })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.protectionLevel === level ? 'border-primary bg-primary-50' : 'border-divider hover:border-primary/30'
                      }`}
                    >
                      <span className="text-lg">{LEVEL_CONFIG[level].icon}</span>
                      <p className="text-sm font-medium text-deep mt-1">{LEVEL_CONFIG[level].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enforcement Action */}
              <div>
                <label className="block text-sm font-medium text-deep mb-2">Enforcement Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(ACTION_CONFIG) as PolicyAction[]).map((action) => (
                    <button
                      key={action}
                      onClick={() => setFormData({ ...formData, action })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.action === action ? 'border-primary bg-primary-50' : 'border-divider hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{ACTION_CONFIG[action].icon}</span>
                        <span className="text-sm font-semibold text-deep">{ACTION_CONFIG[action].label}</span>
                      </div>
                      <p className="text-xs text-muted">{ACTION_CONFIG[action].description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Data Types */}
          {formStep === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-muted">Select the types of sensitive data this policy should protect.</p>
              {['PII', 'Indian PII', 'Code & Secrets', 'Custom'].map((category) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {DATA_TYPES.filter((dt) => dt.category === category).map((dt) => (
                      <button
                        key={dt.id}
                        onClick={() => setFormData({ ...formData, dataTypes: toggleArrayItem(formData.dataTypes, dt.id) })}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                          formData.dataTypes.includes(dt.id) ? 'border-primary bg-primary-50' : 'border-divider hover:border-primary/30'
                        }`}
                      >
                        <span className="text-lg">{dt.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-deep">{dt.label}</p>
                          <p className="text-xs text-muted font-mono">{dt.id}</p>
                        </div>
                        {formData.dataTypes.includes(dt.id) && (
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Patterns — grouped by category */}
              {customPatterns.length > 0 && (() => {
                const grouped = customPatterns.reduce<Record<string, Pattern[]>>((acc, pt) => {
                  const cat = pt.category ?? 'Custom';
                  (acc[cat] ??= []).push(pt);
                  return acc;
                }, {});
                return Object.entries(grouped).map(([cat, pats]) => {
                  const allSelected = pats.every(pt => formData.dataTypes.includes(pt.entity_type));
                  const someSelected = pats.some(pt => formData.dataTypes.includes(pt.entity_type));
                  const toggleAll = () => {
                    if (allSelected) {
                      setFormData({ ...formData, dataTypes: formData.dataTypes.filter(d => !pats.some(pt => pt.entity_type === d)) });
                    } else {
                      const newTypes = [...formData.dataTypes, ...pats.map(pt => pt.entity_type).filter(e => !formData.dataTypes.includes(e))];
                      setFormData({ ...formData, dataTypes: newTypes });
                    }
                  };
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                          🧩 {cat}
                          <span className="text-[10px] font-normal normal-case text-subtle">({pats.length} pattern{pats.length !== 1 ? 's' : ''})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={toggleAll}
                          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors ${
                            allSelected ? 'bg-primary text-white' : someSelected ? 'bg-primary-50 text-primary border border-primary/30' : 'bg-gray-100 text-muted hover:bg-primary-50 hover:text-primary'
                          }`}
                        >
                          {allSelected ? '✓ All selected' : someSelected ? 'Select all' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {pats.map((pt) => (
                          <button
                            key={pt.entity_type}
                            type="button"
                            onClick={() => setFormData({ ...formData, dataTypes: toggleArrayItem(formData.dataTypes, pt.entity_type) })}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                              formData.dataTypes.includes(pt.entity_type) ? 'border-primary bg-primary-50' : 'border-divider hover:border-primary/30'
                            }`}
                          >
                            <span className="text-lg">🧩</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-deep truncate">{pt.name}</p>
                              <p className="text-xs text-muted font-mono truncate">{pt.entity_type}</p>
                              {(pt.tags ?? []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(pt.tags ?? []).slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] bg-primary-50 text-primary px-1.5 py-0.5 rounded">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {formData.dataTypes.includes(pt.entity_type) && (
                              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

              {formData.dataTypes.length > 0 && (
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs font-medium text-primary mb-1.5">Selected ({formData.dataTypes.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.dataTypes.map((dt) => {
                      const builtIn = DATA_TYPES.find((d) => d.id === dt);
                      const custom = customPatterns.find((p) => p.entity_type === dt);
                      return (
                        <span key={dt} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-xs font-medium text-primary shadow-sm">
                          {builtIn ? builtIn.icon : '🧩'} {builtIn?.label ?? custom?.name ?? dt}
                          <button onClick={() => setFormData({ ...formData, dataTypes: formData.dataTypes.filter((d) => d !== dt) })} className="ml-1 text-primary/50 hover:text-primary">×</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Scope */}
          {formStep === 2 && (
            <div className="space-y-6">
              {/* User Groups */}
              <div>
                <h4 className="text-sm font-semibold text-deep mb-2">User Groups</h4>
                <p className="text-xs text-muted mb-3">Select which user groups this policy applies to.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {USER_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setFormData({ ...formData, userGroups: toggleArrayItem(formData.userGroups, g.id) })}
                      className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.userGroups.includes(g.id) ? 'border-primary bg-primary-50 text-primary' : 'border-divider text-muted hover:border-primary/30'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Platforms */}
              <div>
                <h4 className="text-sm font-semibold text-deep mb-2">AI Platforms</h4>
                <p className="text-xs text-muted mb-3">Select which AI platforms this policy applies to.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {AI_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFormData({ ...formData, aiPlatforms: toggleArrayItem(formData.aiPlatforms, p.id) })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.aiPlatforms.includes(p.id) ? 'border-primary bg-primary-50 text-primary' : 'border-divider text-muted hover:border-primary/30'
                      }`}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setFormData({ ...formData, aiPlatforms: formData.aiPlatforms.length === AI_PLATFORMS.length ? [] : AI_PLATFORMS.map((p) => p.id) })}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  {formData.aiPlatforms.length === AI_PLATFORMS.length ? 'Deselect All' : 'Select All Platforms'}
                </button>
              </div>

              {/* AI Models (optional) */}
              <div>
                <h4 className="text-sm font-semibold text-deep mb-2">AI Models <span className="text-muted font-normal">(Optional)</span></h4>
                <p className="text-xs text-muted mb-3">Optionally restrict to specific models. Leave empty to apply to all models.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {AI_MODELS.map((m) => {
                    const platInfo = AI_PLATFORMS.find((p) => p.id === m.platform);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setFormData({ ...formData, aiModels: toggleArrayItem(formData.aiModels, m.id) })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                          formData.aiModels.includes(m.id) ? 'border-primary bg-primary-50' : 'border-divider hover:border-primary/30'
                        }`}
                      >
                        <span>{platInfo?.icon}</span>
                        <div className="text-left">
                          <p className="font-medium text-deep text-xs">{m.label}</p>
                          <p className="text-xs text-muted">{platInfo?.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {formStep === 3 && (
            <div className="space-y-5">
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm font-medium text-primary">Review your policy configuration before saving.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted">Policy Name</p>
                    <p className="text-sm font-semibold text-deep">{formData.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Description</p>
                    <p className="text-sm text-deep">{formData.description || '—'}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted">Category</p>
                      <p className="text-sm font-medium text-deep">{formData.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Priority</p>
                      <p className="text-sm font-medium text-deep">P{formData.priority}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Status</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: STATUS_CONFIG[formData.status].bgColor, color: STATUS_CONFIG[formData.status].color }}>{STATUS_CONFIG[formData.status].label}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted mb-1">Protection Level</p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: LEVEL_CONFIG[formData.protectionLevel].bgColor, color: LEVEL_CONFIG[formData.protectionLevel].color }}>
                      {LEVEL_CONFIG[formData.protectionLevel].icon} {LEVEL_CONFIG[formData.protectionLevel].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Action</p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: ACTION_CONFIG[formData.action].bgColor, color: ACTION_CONFIG[formData.action].color }}>
                      {ACTION_CONFIG[formData.action].icon} {ACTION_CONFIG[formData.action].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Data Types ({formData.dataTypes.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.dataTypes.map((dt) => {
                        const info = DATA_TYPES.find((d) => d.id === dt);
                        const cpInfo = customPatterns.find((p) => p.entity_type === dt);
                        return <span key={dt} className="px-2 py-0.5 rounded-md bg-primary-50 text-xs text-primary font-medium">{info?.icon ?? '🧩'} {info?.label ?? cpInfo?.name ?? dt}</span>;
                      })}
                      {formData.dataTypes.length === 0 && <span className="text-xs text-muted">None selected</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-divider">
                <div>
                  <p className="text-xs text-muted mb-1">User Groups ({formData.userGroups.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.userGroups.map((g) => {
                      const grp = USER_GROUPS.find((u) => u.id === g);
                      return <span key={g} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700 font-medium">{grp?.label}</span>;
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">AI Platforms ({formData.aiPlatforms.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.aiPlatforms.map((p) => {
                      const plat = AI_PLATFORMS.find((a) => a.id === p);
                      return <span key={p} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700 font-medium">{plat?.icon} {plat?.label}</span>;
                    })}
                    {formData.aiPlatforms.length === 0 && <span className="text-xs text-muted">None selected</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">AI Models ({formData.aiModels.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.aiModels.map((m) => {
                      const mdl = AI_MODELS.find((a) => a.id === m);
                      return <span key={m} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700 font-medium">{mdl?.label}</span>;
                    })}
                    {formData.aiModels.length === 0 && <span className="text-xs text-muted">All models</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Navigation */}
          {formError && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="flex items-center justify-between mt-4 pt-6 border-t border-divider">
            <button
              onClick={() => { formStep > 0 ? setFormStep(formStep - 1) : setViewMode('list'); setFormError(null); }}
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
            >
              {formStep === 0 ? 'Cancel' : 'Previous'}
            </button>
            <div className="flex gap-3">
              {formStep < 3 ? (
                <button
                  onClick={() => { setFormStep(formStep + 1); setFormError(null); }}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : viewMode === 'create' ? 'Create Policy' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== LIST VIEW (default) ==============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep">Policy Management</h1>
          <p className="text-sm text-muted mt-0.5">Create and manage security policies for AI data protection</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setViewMode('test')} className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Test Policies
          </button>
          <button onClick={openCreate} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Policy
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Policies', value: stats.total, icon: '📋', color: 'bg-gray-50' },
          { label: 'Active', value: stats.active, icon: '✅', color: 'bg-green-50' },
          { label: 'Draft', value: stats.draft, icon: '📝', color: 'bg-yellow-50' },
          { label: 'Inactive', value: stats.inactive, icon: '⏸️', color: 'bg-gray-50' },
          { label: 'Critical Active', value: stats.criticalPolicies, icon: '🔴', color: 'bg-red-50' },
          { label: 'Total Violations', value: stats.totalViolations.toLocaleString(), icon: '⚠️', color: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-xl p-4 border border-divider`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-muted font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-deep">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl border border-divider shadow-card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Search policies by name, data type, category..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as PolicyStatus | 'all')} className="px-3 py-2.5 border border-border rounded-lg text-sm text-deep bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value as PolicyAction | 'all')} className="px-3 py-2.5 border border-border rounded-lg text-sm text-deep bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">All Actions</option>
              {(Object.keys(ACTION_CONFIG) as PolicyAction[]).map((a) => <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>)}
            </select>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as ProtectionLevel | 'all')} className="px-3 py-2.5 border border-border rounded-lg text-sm text-deep bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">All Levels</option>
              {(Object.keys(LEVEL_CONFIG) as ProtectionLevel[]).map((l) => <option key={l} value={l}>{LEVEL_CONFIG[l].label}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg text-sm text-deep bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">All Categories</option>
              {POLICY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPolicies.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-divider">
            <p className="text-xs text-muted font-medium">{selectedPolicies.length} selected</p>
            <button onClick={() => handleBulkAction('activate')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Activate</button>
            <button onClick={() => handleBulkAction('deactivate')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Deactivate</button>
            <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
            <button onClick={() => setSelectedPolicies([])} className="px-3 py-1.5 text-xs font-medium text-muted hover:text-deep transition-colors">Clear Selection</button>
          </div>
        )}
      </div>

      {/* Policy Table */}
      <div className="bg-white rounded-xl border border-divider shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider">
                <th className="py-3 px-4 text-left">
                  <input type="checkbox" checked={selectedPolicies.length === filteredPolicies.length && filteredPolicies.length > 0} onChange={toggleSelectAll} className="rounded border-border text-primary focus:ring-primary/30" />
                </th>
                <th className="py-3 px-4 text-left">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-muted uppercase tracking-wider hover:text-deep">
                    Policy
                    {sortField === 'name' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Level</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Data Types</th>
                <th className="py-3 px-4 text-left">
                  <button onClick={() => handleSort('violations')} className="flex items-center gap-1 text-xs font-semibold text-muted uppercase tracking-wider hover:text-deep">
                    Violations
                    {sortField === 'violations' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="py-3 px-4 text-left">
                  <button onClick={() => handleSort('priority')} className="flex items-center gap-1 text-xs font-semibold text-muted uppercase tracking-wider hover:text-deep">
                    Priority
                    {sortField === 'priority' && <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className={`border-b border-divider hover:bg-gray-50/50 transition-colors ${selectedPolicies.includes(policy.id) ? 'bg-primary-50/30' : ''}`}>
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedPolicies.includes(policy.id)} onChange={() => toggleSelect(policy.id)} className="rounded border-border text-primary focus:ring-primary/30" />
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => { setSelectedPolicy(policy); setViewMode('detail'); }} className="text-left group">
                      <p className="text-sm font-semibold text-deep group-hover:text-primary transition-colors">{policy.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-muted">{policy.id}</span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">{policy.category}</span>
                      </div>
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleStatusToggle(policy.id)}>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: STATUS_CONFIG[policy.status].bgColor, color: STATUS_CONFIG[policy.status].color }}>
                        {STATUS_CONFIG[policy.status].label}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: LEVEL_CONFIG[policy.protectionLevel].bgColor, color: LEVEL_CONFIG[policy.protectionLevel].color }}>
                      {LEVEL_CONFIG[policy.protectionLevel].icon} {LEVEL_CONFIG[policy.protectionLevel].label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ACTION_CONFIG[policy.action].bgColor, color: ACTION_CONFIG[policy.action].color }}>
                      {ACTION_CONFIG[policy.action].icon} {ACTION_CONFIG[policy.action].label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {policy.dataTypes.slice(0, 3).map((dt) => {
                        const info = DATA_TYPES.find((d) => d.id === dt);
                        const cpInfo = customPatterns.find((p) => p.entity_type === dt);
                        return <span key={dt} className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600">{info?.icon ?? '🧩'} {info?.label ?? cpInfo?.name ?? dt}</span>;
                      })}
                      {policy.dataTypes.length > 3 && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-500">+{policy.dataTypes.length - 3}</span>}
                      {policy.dataTypes.length === 0 && <span className="text-xs text-muted">Model policy</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${policy.violations > 200 ? 'text-red-600' : policy.violations > 50 ? 'text-orange-600' : 'text-deep'}`}>
                      {policy.violations.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      policy.priority <= 2 ? 'bg-red-100 text-red-700' : policy.priority <= 4 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      P{policy.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelectedPolicy(policy); setViewMode('detail'); }} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="View">
                        <svg className="w-4 h-4 text-gray-400 hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => openEdit(policy)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Edit">
                        <svg className="w-4 h-4 text-gray-400 hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDuplicate(policy)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Duplicate">
                        <svg className="w-4 h-4 text-gray-400 hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      {deleteConfirm === policy.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(policy.id)} className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors" title="Confirm Delete">
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Cancel">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(policy.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete">
                          <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredPolicies.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-subtle text-lg mb-2">No policies configured yet</p>
            <p className="text-sm text-muted">Create your first policy to start protecting sensitive data</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Create First Policy
            </button>
          </div>
        )}

        {/* Table Footer */}
        {filteredPolicies.length > 0 && (
          <div className="px-4 py-3 border-t border-divider flex items-center justify-between">
            <p className="text-xs text-muted">
              Showing {filteredPolicies.length} of {policiesList.length} policies
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Sort by:</span>
              {(['priority', 'name', 'violations'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleSort(f)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${sortField === f ? 'bg-primary-50 text-primary' : 'text-muted hover:bg-gray-100'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} {sortField === f && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
