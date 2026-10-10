import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Shield, Bell, Puzzle, Key, Database, Info,
  Save, RefreshCw, Eye, EyeOff, Copy, Plus, Trash2, X, Check,
  ChevronRight, ExternalLink, AlertTriangle, Clock, Download, Upload,
  Server, HardDrive, Cpu, Globe, Lock, Unlock, Mail, MessageSquare,
  Zap, CheckCircle, XCircle, ToggleLeft, ToggleRight, Search,
  RotateCw, Activity, Calendar,
} from 'lucide-react';
import {
  generalSettings as defaultGeneral,
  securitySettings as defaultSecurity,
  notificationSettings as defaultNotifications,
  integrations as allIntegrations,
  apiKeys as allApiKeys,
  backupRecords as allBackups,
  systemInfo,
  timezones,
  dateFormats,
  languages,
} from '../data/settingsData';
import { settingsApi, apiKeys as apiKeysApi } from '../lib/api';
import type { ApiKeyRecord } from '../lib/api';

type SettingsTab = 'general' | 'security' | 'notifications' | 'integrations' | 'api' | 'backup' | 'about';

export function Settings() {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [general, setGeneral] = useState(defaultGeneral);
  const [security, setSecurity] = useState(defaultSecurity);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [integrations] = useState(allIntegrations);
  const [apiKeys, setApiKeys] = useState(allApiKeys);
  const [liveApiKeys, setLiveApiKeys] = useState<ApiKeyRecord[]>([]);
  const [backups] = useState(allBackups);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load org settings
    settingsApi.get().then(({ data }) => {
      if (data.general) setGeneral(g => ({ ...g, ...(data.general as object) }));
      if (data.security) setSecurity(s => ({ ...s, ...(data.security as object) }));
      if (data.notifications) setNotifications(n => ({ ...n, ...(data.notifications as object) }));
    }).catch(() => {});
    // Load API keys
    apiKeysApi.list().then(setLiveApiKeys).catch(() => {});
  }, []);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [integrationDetail, setIntegrationDetail] = useState<string | null>(null);
  const [newIpEntry, setNewIpEntry] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [searchIntegrations, setSearchIntegrations] = useState('');
  const [filterIntCategory, setFilterIntCategory] = useState('all');

  const handleSave = () => {
    settingsApi.update({ general, security, notifications }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCreateApiKey = (name: string) => {
    apiKeysApi.create(name).then((key) => {
      setLiveApiKeys(prev => [...prev, key]);
      if (key.plaintext_key) {
        alert(`API Key created. Copy it now — it won't be shown again:\n\n${key.plaintext_key}`);
      }
    }).catch(() => {});
  };

  const handleRevokeApiKey = (id: string) => {
    apiKeysApi.revoke(id).then(() => {
      setLiveApiKeys(prev => prev.filter(k => k.id !== id));
    }).catch(() => {});
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General', icon: <SettingsIcon className="h-4 w-4" /> },
    { key: 'security', label: 'Security & Privacy', icon: <Shield className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { key: 'integrations', label: 'Integrations', icon: <Puzzle className="h-4 w-4" /> },
    { key: 'api', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
    { key: 'backup', label: 'Backup & Data', icon: <Database className="h-4 w-4" /> },
    { key: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
  ];

  const statusColors: Record<string, string> = {
    connected: 'bg-emerald-50 text-emerald-700',
    disconnected: 'bg-gray-100 text-gray-500',
    error: 'bg-red-50 text-red-600',
    coming_soon: 'bg-blue-50 text-blue-600',
    active: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-gray-100 text-gray-500',
    revoked: 'bg-red-50 text-red-600',
  };

  const statusDots: Record<string, string> = {
    connected: 'bg-emerald-500',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
    coming_soon: 'bg-blue-400',
    active: 'bg-emerald-500',
    expired: 'bg-gray-400',
    revoked: 'bg-red-500',
  };

  // ===================== INTEGRATION DETAIL VIEW =====================
  const selectedIntegration = integrations.find(i => i.id === integrationDetail);
  if (selectedIntegration) {
    return (
      <div className="space-y-6">
        <button onClick={() => setIntegrationDetail(null)} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Settings
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">
              {selectedIntegration.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-deep">{selectedIntegration.name}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedIntegration.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDots[selectedIntegration.status]}`} />
                  {selectedIntegration.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-muted">{selectedIntegration.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Puzzle className="h-3.5 w-3.5" /> {selectedIntegration.category}</span>
                {selectedIntegration.lastSync && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last sync: {new Date(selectedIntegration.lastSync).toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {selectedIntegration.status === 'connected' ? (
                <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                  Disconnect
                </button>
              ) : selectedIntegration.status !== 'coming_soon' ? (
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                  Connect
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Config */}
        {Object.keys(selectedIntegration.config).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-base font-semibold text-deep mb-4">Configuration</h3>
            <div className="space-y-3">
              {Object.entries(selectedIntegration.config).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-divider p-3">
                  <div>
                    <p className="text-sm font-medium text-deep capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-xs text-muted font-mono mt-0.5">{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value, key)} className="rounded-lg p-2 text-muted hover:bg-gray-100 transition-colors">
                    {copiedKey === key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <h3 className="text-base font-semibold text-deep mb-4">Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button className="flex items-center gap-3 rounded-lg border border-divider p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all text-left">
              <RefreshCw className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-deep">Sync Now</p>
                <p className="text-xs text-muted">Force immediate sync</p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-divider p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all text-left">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-deep">Export Logs</p>
                <p className="text-xs text-muted">Download integration logs</p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-divider p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all text-left">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-deep">Test Connection</p>
                <p className="text-xs text-muted">Verify connectivity</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        {selectedIntegration.status === 'connected' && (
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
            <h3 className="text-base font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-4">Disconnecting this integration will stop all data sync and notifications.</p>
            <button className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Disconnect Integration
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===================== MAIN SETTINGS VIEW =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep">Settings</h1>
          <p className="text-sm text-muted mt-1">Configure system preferences, security, integrations, and more</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 animate-fadeIn">
            <CheckCircle className="h-4 w-4" /> Settings saved successfully
          </div>
        )}
      </div>

      {/* Layout: Sidebar Tabs + Content */}
      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <nav className="rounded-xl border border-border bg-card p-2 shadow-soft sticky top-6 space-y-0.5">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  tab === t.key ? 'bg-primary-50 text-primary' : 'text-muted hover:text-deep hover:bg-gray-50'
                }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden w-full">
          <select value={tab} onChange={e => setTab(e.target.value as SettingsTab)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4">
            {tabs.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ===================== GENERAL TAB ===================== */}
          {tab === 'general' && (
            <>
              {/* Organization */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Organization</h2>
                <p className="text-xs text-muted mb-5">Basic organization details and branding</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Organization Name</label>
                    <input type="text" value={general.organizationName}
                      onChange={e => setGeneral({ ...general, organizationName: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Domain</label>
                    <input type="text" value={general.organizationDomain}
                      onChange={e => setGeneral({ ...general, organizationDomain: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Admin Email</label>
                    <input type="email" value={general.adminEmail}
                      onChange={e => setGeneral({ ...general, adminEmail: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Language</label>
                    <select value={general.language} onChange={e => setGeneral({ ...general, language: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {languages.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Locale */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Locale & Format</h2>
                <p className="text-xs text-muted mb-5">Regional settings for dates, times, and format preferences</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Timezone</label>
                    <select value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {timezones.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Date Format</label>
                    <select value={general.dateFormat} onChange={e => setGeneral({ ...general, dateFormat: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {dateFormats.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Session */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Session & Login</h2>
                <p className="text-xs text-muted mb-5">Control session timeouts and login security settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Session Timeout (minutes)</label>
                    <input type="number" value={general.sessionTimeout}
                      onChange={e => setGeneral({ ...general, sessionTimeout: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Max Login Attempts</label>
                    <input type="number" value={general.maxLoginAttempts}
                      onChange={e => setGeneral({ ...general, maxLoginAttempts: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Min Password Length</label>
                    <input type="number" value={general.passwordMinLength}
                      onChange={e => setGeneral({ ...general, passwordMinLength: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Idle Timeout (minutes)</label>
                    <input type="number" value={general.idleTimeoutMinutes}
                      onChange={e => setGeneral({ ...general, idleTimeoutMinutes: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-divider p-3">
                    <div>
                      <p className="text-sm font-medium text-deep">Enforce Password Complexity</p>
                      <p className="text-xs text-muted">Require uppercase, lowercase, number, and special character</p>
                    </div>
                    <button onClick={() => setGeneral({ ...general, enforcePasswordComplexity: !general.enforcePasswordComplexity })}
                      className="text-primary">
                      {general.enforcePasswordComplexity ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-divider p-3">
                    <div>
                      <p className="text-sm font-medium text-deep">Auto Logout on Idle</p>
                      <p className="text-xs text-muted">Automatically log out users after idle timeout</p>
                    </div>
                    <button onClick={() => setGeneral({ ...general, autoLogoutIdle: !general.autoLogoutIdle })}
                      className="text-primary">
                      {general.autoLogoutIdle ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-soft">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </>
          )}

          {/* ===================== SECURITY TAB ===================== */}
          {tab === 'security' && (
            <>
              {/* MFA */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Multi-Factor Authentication</h2>
                <p className="text-xs text-muted mb-5">Enforce MFA for all users across the organization</p>
                <div className="flex items-center justify-between rounded-lg border border-divider p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${security.mfaRequired ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-deep">Require MFA for All Users</p>
                      <p className="text-xs text-muted">Users must complete two-factor authentication to log in</p>
                    </div>
                  </div>
                  <button onClick={() => setSecurity({ ...security, mfaRequired: !security.mfaRequired })} className="text-primary">
                    {security.mfaRequired ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">MFA Method</label>
                  <select value={security.mfaMethod} onChange={e => setSecurity({ ...security, mfaMethod: e.target.value })}
                    className="w-full sm:w-64 rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="totp">Time-based OTP (TOTP)</option>
                    <option value="sms">SMS Verification</option>
                    <option value="email">Email Verification</option>
                    <option value="webauthn">WebAuthn / FIDO2</option>
                  </select>
                </div>
              </div>

              {/* SSO */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-deep mb-1">Single Sign-On (SSO)</h2>
                    <p className="text-xs text-muted">Configure SAML-based single sign-on with your identity provider</p>
                  </div>
                  <button onClick={() => setSecurity({ ...security, ssoEnabled: !security.ssoEnabled })} className="text-primary">
                    {security.ssoEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {security.ssoEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">SSO Provider</label>
                        <select value={security.ssoProvider} onChange={e => setSecurity({ ...security, ssoProvider: e.target.value })}
                          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option>Azure AD</option>
                          <option>Okta</option>
                          <option>Google Workspace</option>
                          <option>OneLogin</option>
                          <option>Custom SAML</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Entity ID</label>
                        <input type="text" value={security.ssoEntityId}
                          onChange={e => setSecurity({ ...security, ssoEntityId: e.target.value })}
                          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Login URL</label>
                      <input type="text" value={security.ssoLoginUrl}
                        onChange={e => setSecurity({ ...security, ssoLoginUrl: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">SAML Certificate</label>
                      <textarea value={security.ssoCertificate}
                        onChange={e => setSecurity({ ...security, ssoCertificate: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* IP Whitelist */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-deep mb-1">IP Whitelist</h2>
                    <p className="text-xs text-muted">Restrict access to specific IP addresses or CIDR ranges</p>
                  </div>
                  <button onClick={() => setSecurity({ ...security, ipWhitelistEnabled: !security.ipWhitelistEnabled })} className="text-primary">
                    {security.ipWhitelistEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {security.ipWhitelistEnabled && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input type="text" value={newIpEntry} onChange={e => setNewIpEntry(e.target.value)}
                        placeholder="e.g. 10.0.0.0/8 or 192.168.1.100"
                        className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <button onClick={() => {
                        if (newIpEntry.trim()) {
                          setSecurity({ ...security, ipWhitelist: [...security.ipWhitelist, newIpEntry.trim()] });
                          setNewIpEntry('');
                        }
                      }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {security.ipWhitelist.map((ip, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-divider px-3 py-2">
                          <span className="text-sm font-mono text-deep">{ip}</span>
                          <button onClick={() => setSecurity({ ...security, ipWhitelist: security.ipWhitelist.filter((_, j) => j !== i) })}
                            className="rounded p-1 text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rate Limiting */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-deep mb-1">Rate Limiting</h2>
                    <p className="text-xs text-muted">Limit API requests to protect against abuse</p>
                  </div>
                  <button onClick={() => setSecurity({ ...security, rateLimitEnabled: !security.rateLimitEnabled })} className="text-primary">
                    {security.rateLimitEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {security.rateLimitEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Requests per Minute</label>
                    <input type="number" value={security.rateLimitPerMinute}
                      onChange={e => setSecurity({ ...security, rateLimitPerMinute: Number(e.target.value) })}
                      className="w-full sm:w-48 rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                )}
              </div>

              {/* Encryption & Data */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Encryption & Data Retention</h2>
                <p className="text-xs text-muted mb-5">Configure data protection and retention policies</p>
                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Encryption at Rest', desc: 'All stored data is encrypted using AES-256', value: security.encryptionAtRest, key: 'encryptionAtRest' as const },
                    { label: 'Encryption in Transit', desc: 'All API communications use TLS 1.3', value: security.encryptionInTransit, key: 'encryptionInTransit' as const },
                    { label: 'Store Prompt Content', desc: 'Save full prompt text in audit logs (disable for privacy)', value: security.promptStorageEnabled, key: 'promptStorageEnabled' as const },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-divider p-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.value ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {item.value ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-deep">{item.label}</p>
                          <p className="text-xs text-muted">{item.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => setSecurity({ ...security, [item.key]: !item.value })} className="text-primary">
                        {item.value ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Audit Log Retention (days)</label>
                    <input type="number" value={security.auditLogRetentionDays}
                      onChange={e => setSecurity({ ...security, auditLogRetentionDays: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Data Retention (days)</label>
                    <input type="number" value={security.dataRetentionDays}
                      onChange={e => setSecurity({ ...security, dataRetentionDays: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Anonymize Logs After (days)</label>
                    <input type="number" value={security.anonymizeLogsAfterDays}
                      onChange={e => setSecurity({ ...security, anonymizeLogsAfterDays: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-soft">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </>
          )}

          {/* ===================== NOTIFICATIONS TAB ===================== */}
          {tab === 'notifications' && (
            <>
              {/* Email */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-deep mb-1">Email (SMTP)</h2>
                    <p className="text-xs text-muted">Configure SMTP server for email notifications</p>
                  </div>
                  <button onClick={() => setNotifications({ ...notifications, emailEnabled: !notifications.emailEnabled })} className="text-primary">
                    {notifications.emailEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {notifications.emailEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">SMTP Host</label>
                      <input type="text" value={notifications.smtpHost}
                        onChange={e => setNotifications({ ...notifications, smtpHost: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Port</label>
                      <input type="number" value={notifications.smtpPort}
                        onChange={e => setNotifications({ ...notifications, smtpPort: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
                      <input type="text" value={notifications.smtpUser}
                        onChange={e => setNotifications({ ...notifications, smtpUser: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
                      <input type="password" value={notifications.smtpPassword}
                        onChange={e => setNotifications({ ...notifications, smtpPassword: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-divider p-3">
                      <div>
                        <p className="text-sm font-medium text-deep">TLS Encryption</p>
                        <p className="text-xs text-muted">Use TLS for secure email transmission</p>
                      </div>
                      <button onClick={() => setNotifications({ ...notifications, smtpTls: !notifications.smtpTls })} className="text-primary">
                        {notifications.smtpTls ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                      </button>
                    </div>
                    <div className="sm:col-span-2">
                      <button className="rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary-50 transition-colors flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Send Test Email
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Slack */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <h2 className="text-base font-semibold text-deep">Slack</h2>
                      <p className="text-xs text-muted">Real-time alerts to Slack channels</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifications({ ...notifications, slackEnabled: !notifications.slackEnabled })} className="text-primary">
                    {notifications.slackEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {notifications.slackEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-muted mb-1.5">Webhook URL</label>
                      <input type="text" value={notifications.slackWebhookUrl}
                        onChange={e => setNotifications({ ...notifications, slackWebhookUrl: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Channel</label>
                      <input type="text" value={notifications.slackChannel}
                        onChange={e => setNotifications({ ...notifications, slackChannel: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div className="flex items-end">
                      <button className="rounded-lg border border-primary text-primary px-4 py-2.5 text-sm font-medium hover:bg-primary-50 transition-colors flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Send Test Message
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Microsoft Teams */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🟣</span>
                    <div>
                      <h2 className="text-base font-semibold text-deep">Microsoft Teams</h2>
                      <p className="text-xs text-muted">Alerts and notifications to Teams channels</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifications({ ...notifications, teamsEnabled: !notifications.teamsEnabled })} className="text-primary">
                    {notifications.teamsEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {notifications.teamsEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Webhook URL</label>
                    <input type="text" value={notifications.teamsWebhookUrl}
                      onChange={e => setNotifications({ ...notifications, teamsWebhookUrl: e.target.value })}
                      placeholder="https://outlook.office.com/webhook/..."
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                )}
              </div>

              {/* Webhook */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔗</span>
                    <div>
                      <h2 className="text-base font-semibold text-deep">Custom Webhook</h2>
                      <p className="text-xs text-muted">Send events to a custom HTTP endpoint</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifications({ ...notifications, webhookEnabled: !notifications.webhookEnabled })} className="text-primary">
                    {notifications.webhookEnabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                  </button>
                </div>
                {notifications.webhookEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-muted mb-1.5">Endpoint URL</label>
                      <input type="text" value={notifications.webhookUrl}
                        onChange={e => setNotifications({ ...notifications, webhookUrl: e.target.value })}
                        placeholder="https://your-endpoint.com/webhook"
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Signing Secret</label>
                      <input type="password" value={notifications.webhookSecret}
                        onChange={e => setNotifications({ ...notifications, webhookSecret: e.target.value })}
                        placeholder="Webhook signing secret"
                        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* Alert Preferences */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Alert Preferences</h2>
                <p className="text-xs text-muted mb-5">Choose which events trigger notifications</p>
                <div className="space-y-2">
                  {[
                    { label: 'Hard Block Events', desc: 'Alert when a prompt is blocked', key: 'notifyOnBlock' as const, value: notifications.notifyOnBlock },
                    { label: 'High Risk Users', desc: 'Alert when a user exceeds risk threshold', key: 'notifyOnHighRisk' as const, value: notifications.notifyOnHighRisk },
                    { label: 'Policy Violations', desc: 'Alert on policy violation events', key: 'notifyOnPolicyViolation' as const, value: notifications.notifyOnPolicyViolation },
                    { label: 'New User Registration', desc: 'Alert when new users are added', key: 'notifyOnNewUser' as const, value: notifications.notifyOnNewUser },
                    { label: 'System Alerts', desc: 'Alert on system errors or downtime', key: 'notifyOnSystemAlert' as const, value: notifications.notifyOnSystemAlert },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-divider px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-deep">{item.label}</p>
                        <p className="text-xs text-muted">{item.desc}</p>
                      </div>
                      <button onClick={() => setNotifications({ ...notifications, [item.key]: !item.value })} className="text-primary">
                        {item.value ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digest */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Scheduled Reports</h2>
                <p className="text-xs text-muted mb-5">Automated email digests and reports</p>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between rounded-lg border border-divider px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-deep">Daily Digest</p>
                      <p className="text-xs text-muted">Summary of daily security activity</p>
                    </div>
                    <button onClick={() => setNotifications({ ...notifications, dailyDigest: !notifications.dailyDigest })} className="text-primary">
                      {notifications.dailyDigest ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-divider px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-deep">Weekly Report</p>
                      <p className="text-xs text-muted">Comprehensive weekly security report</p>
                    </div>
                    <button onClick={() => setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })} className="text-primary">
                      {notifications.weeklyReport ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Digest Recipients</label>
                  <div className="flex gap-2 mb-2">
                    <input type="email" value={newRecipient} onChange={e => setNewRecipient(e.target.value)}
                      placeholder="email@maziktech.com"
                      className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <button onClick={() => {
                      if (newRecipient.trim()) {
                        setNotifications({ ...notifications, digestRecipients: [...notifications.digestRecipients, newRecipient.trim()] });
                        setNewRecipient('');
                      }
                    }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notifications.digestRecipients.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary">
                        <Mail className="h-3 w-3" /> {r}
                        <button onClick={() => setNotifications({ ...notifications, digestRecipients: notifications.digestRecipients.filter((_, j) => j !== i) })}
                          className="ml-1 hover:text-red-500 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-soft">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </>
          )}

          {/* ===================== INTEGRATIONS TAB ===================== */}
          {tab === 'integrations' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input type="text" value={searchIntegrations} onChange={e => setSearchIntegrations(e.target.value)}
                    placeholder="Search integrations..."
                    className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft" />
                </div>
                <select value={filterIntCategory} onChange={e => setFilterIntCategory(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft">
                  <option value="all">All Categories</option>
                  {[...new Set(integrations.map(i => i.category))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: integrations.length, color: 'text-primary bg-primary-50' },
                  { label: 'Connected', value: integrations.filter(i => i.status === 'connected').length, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Errors', value: integrations.filter(i => i.status === 'error').length, color: 'text-red-600 bg-red-50' },
                  { label: 'Coming Soon', value: integrations.filter(i => i.status === 'coming_soon').length, color: 'text-blue-600 bg-blue-50' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
                    <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations
                  .filter(i => {
                    if (filterIntCategory !== 'all' && i.category !== filterIntCategory) return false;
                    if (searchIntegrations) {
                      const q = searchIntegrations.toLowerCase();
                      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map(int => (
                  <div key={int.id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-card hover:border-primary-200 transition-all cursor-pointer"
                    onClick={() => setIntegrationDetail(int.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{int.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-deep">{int.name}</h3>
                          <span className="text-[10px] text-muted">{int.category}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[int.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDots[int.status]}`} />
                        {int.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 mb-3">{int.description}</p>
                    {int.lastSync && (
                      <p className="text-[10px] text-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(int.lastSync).toLocaleString()}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===================== API KEYS TAB ===================== */}
          {tab === 'api' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-deep">API Keys</h2>
                  <p className="text-xs text-muted">Manage API keys for programmatic access to MazikDLP</p>
                </div>
                <button onClick={() => setShowApiKeyModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-soft">
                  <Plus className="h-4 w-4" /> Generate Key
                </button>
              </div>

              {/* Info Banner */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Keep your API keys secure</p>
                  <p className="text-xs text-amber-700 mt-0.5">API keys grant access to your MazikDLP data. Never share keys publicly or commit them to source code. Rotate keys regularly.</p>
                </div>
              </div>

              {/* Keys List */}
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className={`rounded-xl border bg-card p-5 shadow-soft ${key.status === 'active' ? 'border-border' : 'border-gray-200 opacity-75'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        key.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        key.status === 'expired' ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-500'
                      }`}>
                        <Key className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-deep">{key.name}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[key.status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDots[key.status]}`} />
                            {key.status}
                          </span>
                        </div>

                        {/* Key Value */}
                        <div className="flex items-center gap-2 mb-3">
                          <code className="rounded bg-gray-100 px-2.5 py-1 text-xs font-mono text-deep">
                            {revealedKeys.has(key.id) ? key.key : `${key.key.substring(0, 8)}${'•'.repeat(20)}`}
                          </code>
                          <button onClick={() => toggleKeyReveal(key.id)}
                            className="rounded p-1 text-muted hover:bg-gray-100 transition-colors">
                            {revealedKeys.has(key.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => copyToClipboard(key.key, key.id)}
                            className="rounded p-1 text-muted hover:bg-gray-100 transition-colors">
                            {copiedKey === key.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {/* Permissions */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {key.permissions.map(p => (
                            <span key={p} className="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary-100">{p}</span>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span>Created by {key.createdBy}</span>
                          <span>·</span>
                          <span>Created {key.createdAt}</span>
                          <span>·</span>
                          <span>Expires {key.expiresAt}</span>
                          <span>·</span>
                          <span>{key.usageCount.toLocaleString()} requests</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {key.status === 'active' && (
                          <>
                            <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-50 transition-colors flex items-center gap-1">
                              <RotateCw className="h-3 w-3" /> Rotate
                            </button>
                            <button onClick={() => setShowDeleteConfirm(key.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1">
                              <Trash2 className="h-3 w-3" /> Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete Confirm */}
                    {showDeleteConfirm === key.id && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700 mb-2">Are you sure you want to revoke this key?</p>
                        <p className="text-xs text-red-600 mb-3">This action cannot be undone. Any applications using this key will lose access.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowDeleteConfirm(null)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
                          <button onClick={() => { handleRevokeApiKey(showDeleteConfirm!); setShowDeleteConfirm(null); }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors">Revoke Key</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* API Documentation */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-2">API Documentation</h3>
                <p className="text-sm text-muted mb-4">Reference documentation for the MazikDLP API</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Scan API', desc: 'POST /scan — Analyze text for sensitive data', path: '/api/v1/scan' },
                    { label: 'Restore API', desc: 'POST /restore — Restore masked values', path: '/api/v1/restore' },
                    { label: 'Policies API', desc: 'GET /policies — List all active policies', path: '/api/v1/policies' },
                  ].map(ep => (
                    <div key={ep.path} className="rounded-lg border border-divider p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer">
                      <p className="text-sm font-medium text-deep mb-1">{ep.label}</p>
                      <p className="text-xs text-muted mb-2">{ep.desc}</p>
                      <code className="text-[10px] font-mono text-primary bg-primary-50 px-2 py-0.5 rounded">{ep.path}</code>
                    </div>
                  ))}
                </div>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> View Full API Documentation
                </button>
              </div>
            </>
          )}

          {/* ===================== BACKUP TAB ===================== */}
          {tab === 'backup' && (
            <>
              {/* Backup Actions */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-base font-semibold text-deep mb-1">Backup Configuration</h2>
                <p className="text-xs text-muted mb-5">Create and manage system backups</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Full Backup', desc: 'Complete system backup including all data', icon: <HardDrive className="h-5 w-5" />, color: 'text-primary bg-primary-50' },
                    { label: 'Incremental', desc: 'Only changes since last backup', icon: <RefreshCw className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Config Only', desc: 'Policies, patterns, and settings', icon: <SettingsIcon className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
                  ].map(b => (
                    <button key={b.label} className="flex items-center gap-3 rounded-lg border border-divider p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all text-left">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${b.color}`}>{b.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-deep">{b.label}</p>
                        <p className="text-xs text-muted">{b.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Schedule */}
                <div className="rounded-lg border border-divider p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-deep">Automatic Backups</p>
                      <p className="text-xs text-muted">Schedule automated backups</p>
                    </div>
                    <ToggleRight className="h-7 w-7 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Full Backup</label>
                      <select className="w-full rounded-lg border border-border px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Weekly (Sunday 2:00 AM)</option>
                        <option>Daily (2:00 AM)</option>
                        <option>Monthly (1st, 2:00 AM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Incremental</label>
                      <select className="w-full rounded-lg border border-border px-3 py-2 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Daily (2:00 AM)</option>
                        <option>Every 12 hours</option>
                        <option>Every 6 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup History */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-4">Backup History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Type</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Status</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Size</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Created</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Duration</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted">Retention</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map(b => {
                        const created = new Date(b.createdAt);
                        const completed = new Date(b.completedAt);
                        const dur = Math.round((completed.getTime() - created.getTime()) / 60000);
                        return (
                          <tr key={b.id} className="border-b border-divider last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                                b.type === 'full' ? 'bg-primary-50 text-primary' :
                                b.type === 'incremental' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {b.type === 'config_only' ? 'Config' : b.type}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                b.status === 'completed' ? 'text-emerald-600' :
                                b.status === 'in_progress' ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {b.status === 'completed' ? <CheckCircle className="h-3.5 w-3.5" /> :
                                 b.status === 'failed' ? <XCircle className="h-3.5 w-3.5" /> :
                                 <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm text-deep">{b.size}</td>
                            <td className="py-3 px-3 text-xs text-muted">{created.toLocaleString()}</td>
                            <td className="py-3 px-3 text-xs text-muted">{dur} min</td>
                            <td className="py-3 px-3 text-xs text-muted">{b.retentionDays} days</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {b.status === 'completed' && (
                                  <>
                                    <button className="rounded p-1.5 text-muted hover:bg-gray-100 transition-colors" title="Download">
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button className="rounded p-1.5 text-muted hover:bg-gray-100 transition-colors" title="Restore">
                                      <Upload className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                <button className="rounded p-1.5 text-muted hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storage */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-4">Storage Usage</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">{systemInfo.storageUsed} used of {systemInfo.storageTotal}</span>
                    <span className="text-sm font-semibold text-deep">{Math.round(parseFloat(systemInfo.storageUsed) / parseFloat(systemInfo.storageTotal) * 100)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${parseFloat(systemInfo.storageUsed) / parseFloat(systemInfo.storageTotal) * 100}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Audit Logs', size: '18.4 GB', pct: 38, color: 'bg-primary' },
                    { label: 'Backups', size: '14.2 GB', pct: 29, color: 'bg-blue-500' },
                    { label: 'Analytics', size: '9.8 GB', pct: 20, color: 'bg-amber-500' },
                    { label: 'Config', size: '5.8 GB', pct: 12, color: 'bg-emerald-500' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="h-2 rounded-full bg-gray-100 mb-2">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                      </div>
                      <p className="text-sm font-semibold text-deep">{s.size}</p>
                      <p className="text-[10px] text-muted">{s.label} ({s.pct}%)</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-soft">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </>
          )}

          {/* ===================== ABOUT TAB ===================== */}
          {tab === 'about' && (
            <>
              {/* System Info */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-deep">MazikDLP</h1>
                    <p className="text-sm text-muted">Enterprise AI Data Loss Prevention Platform</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary">v{systemInfo.version}</span>
                      <span className="text-xs text-muted">Build {systemInfo.buildNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Environment', value: systemInfo.environment, icon: <Globe className="h-4 w-4" /> },
                    { label: 'Region', value: systemInfo.region, icon: <Globe className="h-4 w-4" /> },
                    { label: 'Server Nodes', value: systemInfo.serverNodes.toString(), icon: <Server className="h-4 w-4" /> },
                    { label: 'Uptime', value: systemInfo.uptime, icon: <Activity className="h-4 w-4" /> },
                    { label: 'Last Restart', value: new Date(systemInfo.lastRestart).toLocaleString(), icon: <RefreshCw className="h-4 w-4" /> },
                    { label: 'Release Date', value: systemInfo.releaseDate, icon: <Calendar className="h-4 w-4" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 rounded-lg border border-divider p-3">
                      <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs text-muted">{item.label}</p>
                        <p className="text-sm font-medium text-deep">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-4">Technology Stack</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Database', value: systemInfo.databaseVersion, icon: <Database className="h-4 w-4" /> },
                    { label: 'Cache', value: systemInfo.redisVersion, icon: <Zap className="h-4 w-4" /> },
                    { label: 'Runtime', value: systemInfo.pythonVersion, icon: <Cpu className="h-4 w-4" /> },
                    { label: 'Presidio', value: systemInfo.presidioVersion, icon: <Shield className="h-4 w-4" /> },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-divider p-4 text-center">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 text-muted flex items-center justify-center mx-auto mb-2">
                        {item.icon}
                      </div>
                      <p className="text-sm font-semibold text-deep">{item.value}</p>
                      <p className="text-[10px] text-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* License */}
              <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> License
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <p className="text-xs text-muted">License Type</p>
                    <p className="text-lg font-bold text-primary">{systemInfo.license.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Seats Used</p>
                    <p className="text-lg font-bold text-deep">{systemInfo.license.usedSeats} / {systemInfo.license.seats}</p>
                    <div className="h-1.5 rounded-full bg-gray-200 mt-1">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(systemInfo.license.usedSeats / systemInfo.license.seats) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Expires</p>
                    <p className="text-lg font-bold text-deep">{systemInfo.license.expiresAt}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted mb-2">Licensed Features</p>
                  <div className="flex flex-wrap gap-2">
                    {systemInfo.license.features.map(f => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-lg bg-white border border-primary-200 px-2.5 py-1 text-xs font-medium text-primary">
                        <Check className="h-3 w-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform Stats */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-base font-semibold text-deep mb-4">Platform Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: systemInfo.totalUsers.toLocaleString() },
                    { label: 'Active Policies', value: systemInfo.totalPolicies.toString() },
                    { label: 'Custom Patterns', value: systemInfo.totalPatterns.toString() },
                    { label: 'Total Scans', value: (systemInfo.totalScans / 1000000).toFixed(1) + 'M' },
                  ].map(s => (
                    <div key={s.label} className="text-center rounded-lg border border-divider p-4">
                      <p className="text-2xl font-bold text-primary">{s.value}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
                <h3 className="text-base font-semibold text-red-700 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">These actions are irreversible and should be used with extreme caution.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-deep">Clear All Logs</p>
                      <p className="text-xs text-muted">Permanently delete all audit logs and activity data</p>
                    </div>
                    <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      Clear Logs
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-deep">Reset All Settings</p>
                      <p className="text-xs text-muted">Restore all settings to factory defaults</p>
                    </div>
                    <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      Reset Settings
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-deep">Delete Organization</p>
                      <p className="text-xs text-muted">Permanently remove the organization and all data</p>
                    </div>
                    <button className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors">
                      Delete Organization
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===================== NEW API KEY MODAL ===================== */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-dropdown">
            <div className="flex items-center justify-between border-b border-divider p-5">
              <h2 className="text-lg font-semibold text-deep">Generate API Key</h2>
              <button onClick={() => setShowApiKeyModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Key Name</label>
                <input type="text" placeholder="e.g. Production API Key"
                  value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Expiration</label>
                <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-deep focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>180 days</option>
                  <option>1 year</option>
                  <option>No expiration</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-2">Permissions</label>
                <div className="space-y-2">
                  {[
                    { id: 'scan', label: 'Scan API', desc: 'Analyze text for sensitive data' },
                    { id: 'restore', label: 'Restore API', desc: 'Restore masked values' },
                    { id: 'auth', label: 'Authentication', desc: 'Extension authentication' },
                    { id: 'policies:read', label: 'Read Policies', desc: 'View policy configurations' },
                    { id: 'policies:write', label: 'Write Policies', desc: 'Create and modify policies' },
                    { id: 'logs:read', label: 'Read Logs', desc: 'Access audit logs' },
                    { id: 'analytics:read', label: 'Read Analytics', desc: 'Access analytics data' },
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-3 rounded-lg border border-divider p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                      <div>
                        <p className="text-sm font-medium text-deep">{p.label}</p>
                        <p className="text-xs text-muted">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-divider p-5">
              <button onClick={() => setShowApiKeyModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { handleCreateApiKey(newKeyName || 'API Key'); setNewKeyName(''); setShowApiKeyModal(false); }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Key className="h-4 w-4" /> Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
