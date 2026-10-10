import { useState, useMemo, useCallback } from 'react';
import { logs as logsApi, analytics, policies as policiesApi } from '../lib/api';
import {
  FileText, Download, Calendar, Clock, Search, ChevronRight,
  ChevronDown, Plus, Play, Send, Trash2, Edit2, Eye, Copy, X,
  BarChart3, Shield, CheckCircle2, XCircle, RefreshCw,
  FileSpreadsheet, FileType, Globe, Mail, Slack, Webhook, ChevronUp,
  TrendingUp, TrendingDown, Minus, Check, Pause,
  Layers, ArrowRight,
} from 'lucide-react';
import {
  reportTemplates,
  generatedReports,
  scheduledReports as scheduledData,
  complianceFrameworks,
  reportMetrics,
  type ReportTemplate,
  type GeneratedReport,
  type ComplianceFramework,
} from '../data/reportsData';

type Tab = 'generated' | 'templates' | 'scheduled' | 'compliance';

const categoryColors: Record<string, string> = {
  executive: 'bg-blue-50 text-blue-700 border-blue-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  compliance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  usage: 'bg-purple-50 text-purple-700 border-purple-200',
  audit: 'bg-amber-50 text-amber-700 border-amber-200',
  incident: 'bg-orange-50 text-orange-700 border-orange-200',
};

const categoryLabels: Record<string, string> = {
  executive: 'Executive',
  security: 'Security',
  compliance: 'Compliance',
  usage: 'Usage',
  audit: 'Audit',
  incident: 'Incident',
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  generating: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
  queued: 'bg-amber-50 text-amber-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  generating: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
  failed: <XCircle className="h-3.5 w-3.5" />,
  queued: <Clock className="h-3.5 w-3.5" />,
};

const complianceColors: Record<string, string> = {
  compliant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  non_compliant: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
};

const complianceLabels: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  in_progress: 'In Progress',
};

const controlStatusColors: Record<string, { bg: string; icon: React.ReactNode }> = {
  passed: { bg: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 className="h-4 w-4" /> },
  failed: { bg: 'bg-red-100 text-red-600', icon: <XCircle className="h-4 w-4" /> },
  in_progress: { bg: 'bg-blue-100 text-blue-600', icon: <RefreshCw className="h-4 w-4" /> },
  not_applicable: { bg: 'bg-gray-100 text-gray-500', icon: <Minus className="h-4 w-4" /> },
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-50 text-red-600',
  high: 'bg-orange-50 text-orange-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-blue-50 text-blue-600',
};

const formatIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-3.5 w-3.5 text-red-500" />,
  XLSX: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />,
  CSV: <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />,
  PPTX: <FileType className="h-3.5 w-3.5 text-orange-500" />,
  HTML: <Globe className="h-3.5 w-3.5 text-purple-500" />,
  DOCX: <FileText className="h-3.5 w-3.5 text-blue-600" />,
  JSON: <FileType className="h-3.5 w-3.5 text-amber-500" />,
};

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

const deliveryIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  slack: <Slack className="h-3.5 w-3.5" />,
  download: <Download className="h-3.5 w-3.5" />,
  webhook: <Webhook className="h-3.5 w-3.5" />,
};

export function Reports() {
  const [tab, setTab] = useState<Tab>('generated');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [generateTemplate, setGenerateTemplate] = useState<ReportTemplate | null>(null);
  const [generateConfig, setGenerateConfig] = useState({
    dateRange: '7d',
    format: 'PDF',
    departments: [] as string[],
    includeCharts: true,
    includeRawData: false,
    emailOnComplete: true,
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    templateId: '',
    frequency: 'weekly',
    format: 'PDF',
    deliveryMethod: 'email',
    recipients: '',
    enabled: true,
  });
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const downloadCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const resp = await logsApi.export();
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mazikdlp_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed — make sure the backend is running.');
    } finally {
      setIsExporting(false);
      setShowGenerateModal(false);
    }
  }, []);

  const generatePDFReport = useCallback(async () => {
    setIsExporting(true);
    try {
      const [stats, secData, appsData, pols] = await Promise.all([
        logsApi.stats(),
        analytics.security(30),
        analytics.apps(30),
        policiesApi.list(),
      ]);

      const today = new Date();
      const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const topEntities = stats.top_entities?.slice(0, 8) ?? [];
      const topPlatforms = stats.top_platforms?.slice(0, 6) ?? [];
      const maxEntityCount = Math.max(...topEntities.map((e: { count: number }) => e.count), 1);
      const maxPlatformCount = Math.max(...topPlatforms.map((p: { count: number }) => p.count), 1);
      const activePolicies = pols.filter((p: { status: string }) => p.status === 'active');
      const blockRate = stats.total_scans > 0
        ? ((stats.total_blocks / stats.total_scans) * 100).toFixed(1)
        : '0.0';
      const maskRate = stats.total_scans > 0
        ? ((stats.total_masks / stats.total_scans) * 100).toFixed(1)
        : '0.0';

      const entityRows = topEntities.map((e: { entity_type: string; count: number }) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;color:#1e293b">${e.entity_type.replace(/_/g, ' ')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="flex:1;background:#f1f5f9;border-radius:4px;height:8px;">
                <div style="width:${Math.round((e.count / maxEntityCount) * 100)}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:4px;height:8px;"></div>
              </div>
              <span style="font-weight:600;color:#6366f1;min-width:32px;text-align:right">${e.count}</span>
            </div>
          </td>
        </tr>`).join('');

      const platformRows = topPlatforms.map((p: { platform: string; count: number }) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;color:#1e293b">${p.platform}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="flex:1;background:#f1f5f9;border-radius:4px;height:8px;">
                <div style="width:${Math.round((p.count / maxPlatformCount) * 100)}%;background:linear-gradient(90deg,#0ea5e9,#6366f1);border-radius:4px;height:8px;"></div>
              </div>
              <span style="font-weight:600;color:#0ea5e9;min-width:32px;text-align:right">${p.count}</span>
            </div>
          </td>
        </tr>`).join('');

      const policyRows = activePolicies.slice(0, 8).map((p: { name: string; action: string; protection_level: string }) => {
        const actionColors: Record<string, string> = {
          hard_block: '#ef4444', soft_block: '#f97316', mask: '#8b5cf6', alert: '#f59e0b', allow: '#10b981',
        };
        const levelColors: Record<string, string> = {
          critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981',
        };
        return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:500;color:#1e293b">${p.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${actionColors[p.action] ?? '#64748b'}22;color:${actionColors[p.action] ?? '#64748b'}">${p.action.replace(/_/g, ' ').toUpperCase()}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${levelColors[p.protection_level] ?? '#64748b'}22;color:${levelColors[p.protection_level] ?? '#64748b'}">${(p.protection_level ?? 'medium').toUpperCase()}</span>
          </td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>MazikDLP Executive Summary — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:A4;margin:0}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>

<!-- COVER HEADER -->
<div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);padding:48px 56px 40px;color:#fff">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🛡️</div>
        <span style="font-size:18px;font-weight:700;letter-spacing:0.5px">MazikDLP</span>
      </div>
      <h1 style="font-size:32px;font-weight:800;margin-bottom:8px;letter-spacing:-0.5px">Executive Summary Report</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.7)">AI Data Loss Prevention — Security Overview</p>
    </div>
    <div style="text-align:right">
      <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px">
        <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Generated</p>
        <p style="font-size:14px;font-weight:600">${dateStr}</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:8px;text-transform:uppercase;letter-spacing:1px">Period</p>
        <p style="font-size:14px;font-weight:600">Last 30 Days</p>
      </div>
    </div>
  </div>
</div>

<!-- KPI CARDS -->
<div style="padding:32px 56px 0">
  <h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:16px">Security Overview</h2>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px">
    ${[
      { label: 'Total Scans', value: stats.total_scans.toLocaleString(), color: '#6366f1', bg: '#eef2ff', icon: '🔍' },
      { label: 'Threats Blocked', value: stats.total_blocks.toLocaleString(), color: '#ef4444', bg: '#fef2f2', icon: '🚫' },
      { label: 'Prompts Masked', value: stats.total_masks.toLocaleString(), color: '#8b5cf6', bg: '#f5f3ff', icon: '🎭' },
      { label: 'Alerts Raised', value: stats.total_alerts.toLocaleString(), color: '#f59e0b', bg: '#fffbeb', icon: '⚠️' },
      { label: 'Block Rate', value: blockRate + '%', color: '#ef4444', bg: '#fef2f2', icon: '📊' },
    ].map(k => `
      <div style="background:${k.bg};border-radius:14px;padding:20px;border:1px solid ${k.color}22">
        <div style="font-size:22px;margin-bottom:8px">${k.icon}</div>
        <div style="font-size:26px;font-weight:800;color:${k.color};line-height:1">${k.value}</div>
        <div style="font-size:11px;color:#64748b;font-weight:500;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px">${k.label}</div>
      </div>`).join('')}
  </div>
</div>

<!-- SECONDARY METRICS -->
<div style="padding:20px 56px 0">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    ${[
      { label: 'Prompts Allowed', value: stats.total_allows.toLocaleString(), color: '#10b981', bg: '#f0fdf4', icon: '✅' },
      { label: 'Mask Rate', value: maskRate + '%', color: '#8b5cf6', bg: '#f5f3ff', icon: '🎭' },
      { label: 'Active Policies', value: activePolicies.length.toString(), color: '#0ea5e9', bg: '#f0f9ff', icon: '📋' },
    ].map(k => `
      <div style="background:${k.bg};border-radius:14px;padding:18px 20px;border:1px solid ${k.color}22;display:flex;align-items:center;gap:16px">
        <div style="font-size:28px">${k.icon}</div>
        <div>
          <div style="font-size:24px;font-weight:800;color:${k.color}">${k.value}</div>
          <div style="font-size:11px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">${k.label}</div>
        </div>
      </div>`).join('')}
  </div>
</div>

<!-- TWO COLUMN SECTION -->
<div style="padding:28px 56px 0;display:grid;grid-template-columns:1fr 1fr;gap:24px">

  <!-- Top Entities -->
  <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
      <h3 style="font-size:13px;font-weight:700;color:#1e293b">Top Detected Entity Types</h3>
      <p style="font-size:11px;color:#64748b;margin-top:2px">Most frequent PII detected in prompts</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Entity Type</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Detections</th>
      </tr></thead>
      <tbody>${entityRows || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px">No data yet — run some scans first</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Top Platforms -->
  <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
      <h3 style="font-size:13px;font-weight:700;color:#1e293b">AI Platform Usage</h3>
      <p style="font-size:11px;color:#64748b;margin-top:2px">Prompt volume by AI platform</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Platform</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Prompts</th>
      </tr></thead>
      <tbody>${platformRows || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px">No data yet — run some scans first</td></tr>'}</tbody>
    </table>
  </div>
</div>

<!-- ACTIVE POLICIES -->
${activePolicies.length > 0 ? `
<div style="padding:28px 56px 0">
  <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="font-size:13px;font-weight:700;color:#1e293b">Active DLP Policies</h3>
        <p style="font-size:11px;color:#64748b;margin-top:2px">${activePolicies.length} policies currently enforced</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:55%">Policy Name</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Action</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Level</th>
      </tr></thead>
      <tbody>${policyRows}</tbody>
    </table>
  </div>
</div>` : ''}

<!-- FOOTER -->
<div style="margin:32px 56px 0;padding:20px 24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
  <div>
    <p style="font-size:12px;font-weight:600;color:#1e293b">MazikDLP — Enterprise AI Data Loss Prevention</p>
    <p style="font-size:11px;color:#64748b;margin-top:2px">This report is confidential and intended for authorized personnel only.</p>
  </div>
  <div style="text-align:right">
    <p style="font-size:11px;color:#94a3b8">Generated on ${dateStr}</p>
    <p style="font-size:11px;color:#94a3b8">Powered by Microsoft Presidio NLP</p>
  </div>
</div>
<div style="height:32px"></div>

</body>
</html>`;

      const win = window.open('', '_blank');
      if (!win) { alert('Allow popups for this site to generate the PDF.'); return; }
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.focus(); win.print(); };
    } catch (e) {
      alert('Failed to generate report — make sure the backend is running.');
    } finally {
      setIsExporting(false);
      setShowGenerateModal(false);
    }
  }, []);

  const filteredReports = useMemo(() => {
    let result = [...generatedReports];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.generatedBy.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'all') result = result.filter(r => r.category === filterCategory);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = parseFloat(a.fileSize) - parseFloat(b.fileSize);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, filterCategory, filterStatus, sortBy, sortDir]);

  const filteredTemplates = useMemo(() => {
    let result = [...reportTemplates];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== 'all') result = result.filter(t => t.category === filterCategory);
    return result;
  }, [search, filterCategory]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronDown className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'generated', label: 'Generated Reports', icon: <FileText className="h-4 w-4" />, count: generatedReports.length },
    { key: 'templates', label: 'Report Templates', icon: <Layers className="h-4 w-4" />, count: reportTemplates.length },
    { key: 'scheduled', label: 'Scheduled Reports', icon: <Calendar className="h-4 w-4" />, count: scheduledData.filter(s => s.enabled).length },
    { key: 'compliance', label: 'Compliance', icon: <Shield className="h-4 w-4" />, count: complianceFrameworks.length },
  ];

  // ========== REPORT DETAIL VIEW ==========
  if (selectedReport) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedReport(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Reports
        </button>

        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-deep">{selectedReport.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selectedReport.status]}`}>
                  {statusIcons[selectedReport.status]} {selectedReport.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${categoryColors[selectedReport.category]}`}>
                  {categoryLabels[selectedReport.category]}
                </span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {selectedReport.dateRange}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Generated {new Date(selectedReport.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center gap-1">By {selectedReport.generatedBy}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {selectedReport.status === 'completed' && (
                <>
                  <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Share
                  </button>
                  <button onClick={generatePDFReport} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60" disabled={isExporting}>
                    {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {isExporting ? 'Generating…' : 'Download PDF'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Highlights */}
        {selectedReport.highlights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {selectedReport.highlights.map((h, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">{h.label}</span>
                  {h.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                  {h.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  {h.trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-gray-400" />}
                </div>
                <p className="text-xl font-bold text-deep">{h.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Sections */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-deep mb-4">Report Sections</h3>
            <div className="space-y-3">
              {selectedReport.sections.map((section, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-deep flex-1">{section}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3">Report Details</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Report ID', value: selectedReport.id },
                  { label: 'Format', value: selectedReport.format },
                  { label: 'File Size', value: selectedReport.fileSize },
                  { label: 'Pages', value: selectedReport.pages.toString() },
                  { label: 'Generation Time', value: selectedReport.duration },
                  { label: 'Downloads', value: selectedReport.downloadCount.toString() },
                  { label: 'Date Range', value: selectedReport.dateRange },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-divider last:border-0">
                    <span className="text-muted">{d.label}</span>
                    <span className="text-deep font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted" /> Regenerate Report
                </button>
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted" /> Schedule This Report
                </button>
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Send className="h-3.5 w-3.5 text-muted" /> Email Report
                </button>
                <button className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== TEMPLATE DETAIL VIEW ==========
  if (selectedTemplate) {
    const templateReports = generatedReports.filter(r => r.templateId === selectedTemplate.id);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTemplate(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Templates
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 flex items-center justify-center text-3xl flex-shrink-0">
              {selectedTemplate.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-deep">{selectedTemplate.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${categoryColors[selectedTemplate.category]}`}>
                  {categoryLabels[selectedTemplate.category]}
                </span>
                {selectedTemplate.isCustom && <span className="rounded-full bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 text-xs font-medium">Custom</span>}
              </div>
              <p className="text-sm text-muted mt-1">{selectedTemplate.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {selectedTemplate.estimatedTime}</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Generated {selectedTemplate.generationCount} times</span>
                {selectedTemplate.lastGenerated && (
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Last: {selectedTemplate.lastGenerated}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => { setGenerateTemplate(selectedTemplate); setShowGenerateModal(true); }}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Play className="h-4 w-4" /> Generate Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Sections */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Report Sections ({selectedTemplate.sections.length})</h3>
              <div className="space-y-2">
                {selectedTemplate.sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                    <div className="h-7 w-7 rounded bg-primary-50 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <span className="text-sm text-deep">{section}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Reports */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-4">Previously Generated ({templateReports.length})</h3>
              {templateReports.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No reports generated from this template yet.</p>
              ) : (
                <div className="space-y-2">
                  {templateReports.map(r => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 cursor-pointer transition-colors"
                      onClick={() => { setSelectedTemplate(null); setSelectedReport(r); }}>
                      <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {formatIcons[r.format] || <FileText className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-deep truncate">{r.name}</p>
                        <p className="text-xs text-muted">{r.dateRange} · {r.fileSize} · {r.pages} pages</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[r.status]}`}>
                        {statusIcons[r.status]} {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3">Export Formats</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.formats.map(fmt => (
                  <span key={fmt} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-gray-50 px-3 py-1.5 text-xs font-medium text-deep">
                    {formatIcons[fmt]} {fmt}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-primary-50 border border-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-deep mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => { setGenerateTemplate(selectedTemplate); setShowGenerateModal(true); }}
                  className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <Play className="h-3.5 w-3.5" /> Generate Report
                </button>
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted" /> Schedule
                </button>
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Edit2 className="h-3.5 w-3.5 text-muted" /> Customize Template
                </button>
                <button className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-deep hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Copy className="h-3.5 w-3.5 text-muted" /> Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== COMPLIANCE DETAIL VIEW ==========
  if (selectedFramework) {
    const scoreColor = selectedFramework.score >= 90 ? 'text-emerald-600' : selectedFramework.score >= 70 ? 'text-amber-600' : 'text-red-600';
    const scoreRingColor = selectedFramework.score >= 90 ? '#10B981' : selectedFramework.score >= 70 ? '#F59E0B' : '#EF4444';
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedFramework(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Compliance
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
              <Shield className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-deep">{selectedFramework.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${complianceColors[selectedFramework.status]}`}>
                  {complianceLabels[selectedFramework.status]}
                </span>
              </div>
              <p className="text-sm text-muted mt-1">{selectedFramework.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Last assessed: {selectedFramework.lastAssessment}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Next: {selectedFramework.nextAssessment}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Re-assess
              </button>
              <button onClick={generatePDFReport} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60" disabled={isExporting}>
                {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export PDF Report
              </button>
            </div>
          </div>
        </div>

        {/* Score & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="sm:col-span-1 rounded-xl border border-border bg-card p-5 shadow-soft flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreRingColor}
                  strokeWidth="10" strokeDasharray={`${selectedFramework.score * 3.14} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{selectedFramework.score}%</span>
              </div>
            </div>
            <span className="text-xs text-muted mt-2">Compliance Score</span>
          </div>
          {[
            { label: 'Total Controls', value: selectedFramework.totalControls, icon: <Layers className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
            { label: 'Passed', value: selectedFramework.passedControls, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Failed', value: selectedFramework.failedControls, icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
            { label: 'In Progress', value: selectedFramework.inProgressControls, icon: <RefreshCw className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-bold text-deep">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-semibold text-deep mb-4">Compliance Controls</h3>
          <div className="space-y-3">
            {selectedFramework.controls.map(ctrl => {
              const cStatus = controlStatusColors[ctrl.status];
              return (
                <div key={ctrl.id} className="rounded-lg border border-divider p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cStatus.bg}`}>
                      {cStatus.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-deep">{ctrl.name}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColors[ctrl.severity]}`}>{ctrl.severity}</span>
                      </div>
                      <p className="text-xs text-muted mb-2">{ctrl.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {ctrl.evidence}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Checked: {ctrl.lastChecked}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      ctrl.status === 'passed' ? 'bg-emerald-50 text-emerald-600' :
                      ctrl.status === 'failed' ? 'bg-red-50 text-red-600' :
                      ctrl.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ctrl.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
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
          <h1 className="text-2xl font-bold text-deep">Reports & Compliance</h1>
          <p className="text-sm text-muted mt-1">Generate reports, track compliance, and schedule automated deliveries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScheduleModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-deep shadow-soft hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" /> Schedule
          </button>
          <button onClick={() => { setGenerateTemplate(null); setShowGenerateModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Generated', value: reportMetrics.totalGenerated, icon: <FileText className="h-4 w-4" />, color: 'text-primary bg-primary-50' },
          { label: 'This Month', value: reportMetrics.thisMonth, icon: <BarChart3 className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Scheduled Active', value: reportMetrics.scheduled, icon: <Calendar className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Compliance Score', value: `${reportMetrics.complianceScore}%`, icon: <Shield className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Templates', value: reportMetrics.templatesAvailable, icon: <Layers className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
          { label: 'Avg Gen Time', value: reportMetrics.avgGenerationTime, icon: <Clock className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100' },
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
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilterCategory('all'); setFilterStatus('all'); }}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.key ? 'text-primary' : 'text-muted hover:text-deep'}`}>
            {t.icon} {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === t.key ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-muted'}`}>{t.count}</span>
            )}
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* ===================== GENERATED TAB ===================== */}
      {tab === 'generated' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('name')}>Report <SortIcon col="name" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Category</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">Format</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('size')}>Size <SortIcon col="size" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">
                      <button className="flex items-center gap-1 hover:text-deep" onClick={() => handleSort('date')}>Generated <SortIcon col="date" /></button>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted">By</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(r => (
                    <tr key={r.id} className="border-b border-divider last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(r)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                            {formatIcons[r.format] || <FileText className="h-4 w-4 text-gray-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-deep truncate max-w-[250px]">{r.name}</p>
                            <p className="text-xs text-muted">{r.dateRange}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryColors[r.category]}`}>
                          {categoryLabels[r.category]}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[r.status]}`}>
                          {statusIcons[r.status]} {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-xs text-deep">{formatIcons[r.format]} {r.format}</span>
                      </td>
                      <td className="py-3 px-3 text-sm text-deep">{r.fileSize}</td>
                      <td className="py-3 px-3 text-xs text-muted">
                        {new Date(r.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-sm text-muted">{r.generatedBy}</td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          {r.status === 'completed' && (
                            <button onClick={(e) => { e.stopPropagation(); downloadCSV(); }} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors" title="Download CSV">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors" title="View"
                            onClick={() => setSelectedReport(r)}>
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredReports.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted">No reports found matching your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TEMPLATES TAB ===================== */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-deep shadow-soft hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" /> Custom Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary-200 transition-all cursor-pointer group"
                onClick={() => setSelectedTemplate(t)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-deep truncate">{t.name}</h3>
                      {t.isCustom && <span className="rounded bg-purple-50 text-purple-600 px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0">Custom</span>}
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium mt-1 ${categoryColors[t.category]}`}>
                      {categoryLabels[t.category]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted line-clamp-2 mb-3">{t.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {t.formats.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 rounded bg-gray-50 border border-divider px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      {formatIcons[f]} {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted border-t border-divider pt-3">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.estimatedTime}</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {t.generationCount} generated</span>
                </div>
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setGenerateTemplate(t); setShowGenerateModal(true); }}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                    <Play className="h-3 w-3" /> Generate
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t); }}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors">
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== SCHEDULED TAB ===================== */}
      {tab === 'scheduled' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{scheduledData.filter(s => s.enabled).length} active schedules, {scheduledData.filter(s => !s.enabled).length} paused</p>
            <button onClick={() => setShowScheduleModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> New Schedule
            </button>
          </div>

          {/* Active */}
          <div>
            <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-500" /> Active Schedules
            </h3>
            <div className="space-y-3">
              {scheduledData.filter(s => s.enabled).map(sch => {
                const template = reportTemplates.find(t => t.id === sch.templateId);
                return (
                  <div key={sch.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-deep">{sch.name}</h4>
                          <span className="rounded-full bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[10px] font-medium">{frequencyLabels[sch.frequency]}</span>
                          <span className="inline-flex items-center gap-1 rounded bg-gray-50 border border-divider px-1.5 py-0.5 text-[10px] font-medium text-muted">
                            {formatIcons[sch.format]} {sch.format}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-gray-50 border border-divider px-1.5 py-0.5 text-[10px] font-medium text-muted">
                            {deliveryIcons[sch.deliveryMethod]} {sch.deliveryMethod}
                          </span>
                        </div>
                        {template && <p className="text-xs text-muted mb-2">Template: {template.name}</p>}
                        <div className="flex flex-wrap gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Next: {new Date(sch.nextRun).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {sch.lastRun && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Last: {new Date(sch.lastRun).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {sch.recipients.map(r => (
                            <span key={r} className="rounded bg-primary-50 border border-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5" /> {r}
                            </span>
                          ))}
                        </div>
                        {sch.filters.departments && sch.filters.departments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] text-muted mr-1">Filters:</span>
                            {sch.filters.departments.map(d => (
                              <span key={d} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                          <Play className="h-3 w-3" /> Run Now
                        </button>
                        <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-100 transition-colors flex items-center gap-1">
                          <Pause className="h-3 w-3" /> Pause
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paused */}
          {scheduledData.filter(s => !s.enabled).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-deep mb-3 flex items-center gap-2">
                <Pause className="h-4 w-4 text-gray-400" /> Paused Schedules
              </h3>
              <div className="space-y-3">
                {scheduledData.filter(s => !s.enabled).map(sch => {
                  const template = reportTemplates.find(t => t.id === sch.templateId);
                  return (
                    <div key={sch.id} className="rounded-xl border border-border bg-card p-5 shadow-soft opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                          <Pause className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-deep">{sch.name}</h4>
                          <p className="text-xs text-muted">{template?.name} · {frequencyLabels[sch.frequency]} · {sch.format}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                            <Play className="h-3 w-3" /> Resume
                          </button>
                          <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule Overview */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-base font-semibold text-deep mb-4">Upcoming Schedule</h3>
            <div className="space-y-2">
              {scheduledData.filter(s => s.enabled)
                .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
                .map(sch => {
                  const daysUntil = Math.ceil((new Date(sch.nextRun).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={sch.id} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${daysUntil <= 1 ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary'}`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-deep truncate">{sch.name}</p>
                        <p className="text-xs text-muted">{frequencyLabels[sch.frequency]}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-deep">
                          {new Date(sch.nextRun).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className={`text-xs ${daysUntil <= 1 ? 'text-amber-600 font-medium' : 'text-muted'}`}>
                          {daysUntil <= 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== COMPLIANCE TAB ===================== */}
      {tab === 'compliance' && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#8B5CF6" strokeWidth="10"
                      strokeDasharray={`${reportMetrics.complianceScore * 3.14} 314`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{reportMetrics.complianceScore}%</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-deep">Overall Compliance Score</h3>
                  <p className="text-sm text-muted mt-1">Across {complianceFrameworks.length} regulatory frameworks</p>
                </div>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Compliant', value: complianceFrameworks.filter(f => f.status === 'compliant').length, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Partial', value: complianceFrameworks.filter(f => f.status === 'partial').length, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Non-Compliant', value: complianceFrameworks.filter(f => f.status === 'non_compliant').length, color: 'text-red-600 bg-red-50' },
                    { label: 'In Progress', value: complianceFrameworks.filter(f => f.status === 'in_progress').length, color: 'text-blue-600 bg-blue-50' },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                      <p className="text-[10px] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Frameworks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {complianceFrameworks.map(fw => {
              const scoreColor = fw.score >= 90 ? '#10B981' : fw.score >= 70 ? '#F59E0B' : '#EF4444';
              return (
                <div key={fw.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary-200 transition-all cursor-pointer"
                  onClick={() => setSelectedFramework(fw)}>
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor}
                          strokeWidth="8" strokeDasharray={`${fw.score * 3.14} 314`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{fw.score}%</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-deep">{fw.shortName}</h3>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${complianceColors[fw.status]}`}>
                          {complianceLabels[fw.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted line-clamp-1 mb-3">{fw.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold text-emerald-600">{fw.passedControls}</p>
                          <p className="text-[10px] text-muted">Passed</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600">{fw.failedControls}</p>
                          <p className="text-[10px] text-muted">Failed</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-600">{fw.inProgressControls}</p>
                          <p className="text-[10px] text-muted">In Progress</p>
                        </div>
                      </div>
                      {/* Control status bar */}
                      <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-gray-100">
                        <div className="bg-emerald-500 transition-all" style={{ width: `${(fw.passedControls / fw.totalControls) * 100}%` }} />
                        <div className="bg-blue-500 transition-all" style={{ width: `${(fw.inProgressControls / fw.totalControls) * 100}%` }} />
                        <div className="bg-red-500 transition-all" style={{ width: `${(fw.failedControls / fw.totalControls) * 100}%` }} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                        <span>Last: {fw.lastAssessment}</span>
                        <span>Next: {fw.nextAssessment}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Compliance Actions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-base font-semibold text-deep mb-4">Failed & In-Progress Controls Requiring Attention</h3>
            <div className="space-y-2">
              {complianceFrameworks.flatMap(fw =>
                fw.controls
                  .filter(c => c.status === 'failed' || c.status === 'in_progress')
                  .map(c => ({ ...c, framework: fw.shortName, frameworkId: fw.id }))
              ).sort((a, b) => {
                const sev = { critical: 0, high: 1, medium: 2, low: 3 };
                return sev[a.severity] - sev[b.severity];
              }).map(ctrl => (
                <div key={`${ctrl.frameworkId}_${ctrl.id}`} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:border-primary-200 transition-colors">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${controlStatusColors[ctrl.status].bg}`}>
                    {controlStatusColors[ctrl.status].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{ctrl.framework}</span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-sm font-medium text-deep">{ctrl.name}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{ctrl.evidence}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColors[ctrl.severity]}`}>{ctrl.severity}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    ctrl.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>{ctrl.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== GENERATE MODAL ===================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-dropdown max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-divider p-5 sticky top-0 bg-card rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-deep">Generate Report</h2>
              <button onClick={() => setShowGenerateModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Report Template</label>
                <select
                  value={generateTemplate?.id || ''}
                  onChange={e => setGenerateTemplate(reportTemplates.find(t => t.id === e.target.value) || null)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a template...</option>
                  {reportTemplates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
              </div>

              {generateTemplate && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-3">
                  <p className="text-xs text-muted">{generateTemplate.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {generateTemplate.sections.map(s => (
                      <span key={s} className="rounded bg-white border border-divider px-1.5 py-0.5 text-[10px] text-muted">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Date Range</label>
                  <select value={generateConfig.dateRange} onChange={e => setGenerateConfig(c => ({ ...c, dateRange: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="6m">Last 6 months</option>
                    <option value="1y">Last year</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Output Format</label>
                  <select value={generateConfig.format} onChange={e => setGenerateConfig(c => ({ ...c, format: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {(generateTemplate?.formats || ['PDF', 'CSV', 'XLSX']).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Departments (optional filter)</label>
                <div className="flex flex-wrap gap-2">
                  {['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'Data Science'].map(dept => (
                    <button key={dept}
                      onClick={() => setGenerateConfig(c => ({
                        ...c,
                        departments: c.departments.includes(dept) ? c.departments.filter(d => d !== dept) : [...c.departments, dept],
                      }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                        generateConfig.departments.includes(dept)
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-border text-muted hover:bg-gray-50'
                      }`}>
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'includeCharts' as const, label: 'Include charts & visualizations', desc: 'Add graphs and charts to the report' },
                  { key: 'includeRawData' as const, label: 'Include raw data appendix', desc: 'Attach raw data tables at the end' },
                  { key: 'emailOnComplete' as const, label: 'Email when ready', desc: 'Send notification when report is generated' },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                    <button
                      onClick={() => setGenerateConfig(c => ({ ...c, [opt.key]: !c[opt.key] }))}
                      className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                        generateConfig[opt.key] ? 'bg-primary text-white' : 'border border-border bg-white'
                      }`}>
                      {generateConfig[opt.key] && <Check className="h-3 w-3" />}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-deep">{opt.label}</p>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5 sticky bottom-0 bg-card rounded-b-2xl">
              <button onClick={() => setShowGenerateModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={generateConfig.format === 'PDF' ? generatePDFReport : downloadCSV}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                disabled={isExporting}
              >
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? 'Generating…' : generateConfig.format === 'PDF' ? 'Generate PDF Report' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SCHEDULE MODAL ===================== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-dropdown">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Schedule Report</h2>
              <button onClick={() => setShowScheduleModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Report Template</label>
                <select value={scheduleConfig.templateId} onChange={e => setScheduleConfig(c => ({ ...c, templateId: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select a template...</option>
                  {reportTemplates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Frequency</label>
                  <select value={scheduleConfig.frequency} onChange={e => setScheduleConfig(c => ({ ...c, frequency: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {Object.entries(frequencyLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Format</label>
                  <select value={scheduleConfig.format} onChange={e => setScheduleConfig(c => ({ ...c, format: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="PDF">PDF</option>
                    <option value="XLSX">XLSX</option>
                    <option value="CSV">CSV</option>
                    <option value="HTML">HTML</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Delivery Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
                    { key: 'slack', label: 'Slack', icon: <Slack className="h-4 w-4" /> },
                    { key: 'download', label: 'Download', icon: <Download className="h-4 w-4" /> },
                    { key: 'webhook', label: 'Webhook', icon: <Webhook className="h-4 w-4" /> },
                  ].map(m => (
                    <button key={m.key}
                      onClick={() => setScheduleConfig(c => ({ ...c, deliveryMethod: m.key as typeof c.deliveryMethod }))}
                      className={`rounded-lg border p-3 text-center transition-colors ${
                        scheduleConfig.deliveryMethod === m.key
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-border text-muted hover:bg-gray-50'
                      }`}>
                      <div className="flex flex-col items-center gap-1">
                        {m.icon}
                        <span className="text-[10px] font-medium">{m.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Recipients</label>
                <textarea value={scheduleConfig.recipients} onChange={e => setScheduleConfig(c => ({ ...c, recipients: e.target.value }))}
                  placeholder="Enter email addresses (one per line)"
                  rows={3} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-divider p-3 bg-gray-50">
                <button
                  onClick={() => setScheduleConfig(c => ({ ...c, enabled: !c.enabled }))}
                  className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    scheduleConfig.enabled ? 'bg-primary text-white' : 'border border-border bg-white'
                  }`}>
                  {scheduleConfig.enabled && <Check className="h-3 w-3" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-deep">Enable immediately</p>
                  <p className="text-xs text-muted">Start running on the next scheduled date</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowScheduleModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => setShowScheduleModal(false)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
