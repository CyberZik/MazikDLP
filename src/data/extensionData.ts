export interface ExtensionDevice {
  id: string;
  userId: string;
  userName: string;
  email: string;
  avatar: string;
  department: string;
  browser: 'Chrome' | 'Firefox' | 'Edge' | 'Safari' | 'Brave';
  version: string;
  status: 'active' | 'inactive' | 'outdated' | 'error' | 'pending';
  os: string;
  lastSeen: string;
  installedAt: string;
  promptsScanned: number;
  threatsBlocked: number;
  autoUpdate: boolean;
  ipAddress: string;
}

export interface ExtensionVersion {
  version: string;
  releaseDate: string;
  status: 'current' | 'supported' | 'deprecated' | 'beta';
  changelog: string[];
  downloads: number;
  activeInstalls: number;
  minBrowser: string;
  size: string;
}

export interface ExtensionConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'toggle' | 'select' | 'number' | 'text';
  value: string | boolean | number;
  options?: string[];
  defaultValue: string | boolean | number;
}

export interface DeploymentGroup {
  id: string;
  name: string;
  description: string;
  departments: string[];
  totalUsers: number;
  installed: number;
  active: number;
  outdated: number;
  policy: string;
  version: string;
  autoUpdate: boolean;
  createdAt: string;
}

export const extensionVersions: ExtensionVersion[] = [
  {
    version: '2.4.1',
    releaseDate: '2025-01-08',
    status: 'current',
    changelog: [
      'Added support for DeepSeek AI platform',
      'Improved PAN number detection accuracy by 15%',
      'Fixed false positive issue with Indian phone numbers',
      'Enhanced image redaction quality',
      'Performance optimization: 30% faster prompt scanning',
    ],
    downloads: 1847,
    activeInstalls: 1623,
    minBrowser: 'Chrome 120+',
    size: '2.4 MB',
  },
  {
    version: '2.4.0',
    releaseDate: '2024-12-15',
    status: 'supported',
    changelog: [
      'New image redaction feature with OCR support',
      'Added Claude and Grok platform support',
      'Multi-language prompt detection (Hindi, Tamil)',
      'Redesigned extension popup UI',
      'Added offline mode capability',
    ],
    downloads: 2340,
    activeInstalls: 412,
    minBrowser: 'Chrome 118+',
    size: '2.3 MB',
  },
  {
    version: '2.3.2',
    releaseDate: '2024-11-20',
    status: 'supported',
    changelog: [
      'Bug fix: Extension crash on large text paste',
      'Improved Aadhaar masking precision',
      'Added keyboard shortcut (Ctrl+Shift+M) for quick mask',
      'Better tooltip positioning on blocked prompts',
    ],
    downloads: 3100,
    activeInstalls: 198,
    minBrowser: 'Chrome 116+',
    size: '2.2 MB',
  },
  {
    version: '2.3.1',
    releaseDate: '2024-10-28',
    status: 'deprecated',
    changelog: [
      'Security patch for XSS vulnerability',
      'Fixed memory leak in background service worker',
      'Updated Presidio engine to v2.2',
    ],
    downloads: 2800,
    activeInstalls: 34,
    minBrowser: 'Chrome 114+',
    size: '2.1 MB',
  },
  {
    version: '2.5.0-beta',
    releaseDate: '2025-01-10',
    status: 'beta',
    changelog: [
      'Experimental: AI response inspection',
      'New policy override UI for managers',
      'WebSocket-based real-time policy sync',
      'Dark mode support',
      'Biometric authentication option',
    ],
    downloads: 156,
    activeInstalls: 89,
    minBrowser: 'Chrome 121+',
    size: '2.6 MB',
  },
];

const browsers: Array<'Chrome' | 'Firefox' | 'Edge' | 'Safari' | 'Brave'> = ['Chrome', 'Firefox', 'Edge', 'Safari', 'Brave'];
const oses = ['Windows 11', 'Windows 10', 'macOS Sonoma', 'macOS Ventura', 'Ubuntu 22.04', 'Fedora 39'];
const depts = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'Support', 'Data Science'];
const statuses: Array<'active' | 'inactive' | 'outdated' | 'error' | 'pending'> = ['active', 'active', 'active', 'active', 'active', 'active', 'inactive', 'outdated', 'error', 'pending'];
const versions = ['2.4.1', '2.4.1', '2.4.1', '2.4.0', '2.4.0', '2.3.2', '2.4.1', '2.4.1'];
const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Karthik', 'Divya', 'Amit', 'Meera', 'Rohit', 'Neha', 'Sanjay', 'Pooja', 'Aditya', 'Kavita', 'Rajesh', 'Swati', 'Manish', 'Deepa', 'Suresh', 'Rekha', 'Vivek', 'Asha', 'Nikhil', 'Sunita', 'Gaurav', 'Pallavi', 'Harsh', 'Tanvi'];
const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Joshi', 'Nair', 'Iyer', 'Desai', 'Mehta', 'Choudhary', 'Verma', 'Rao', 'Mishra'];

export const extensionDevices: ExtensionDevice[] = Array.from({ length: 5 }, (_, i) => {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  const st = statuses[i % statuses.length];
  const ver = st === 'outdated' ? '2.3.2' : st === 'error' ? '2.3.1' : versions[i % versions.length];
  return {
    id: `dev_${String(i + 1).padStart(4, '0')}`,
    userId: `usr_${String(i + 1).padStart(4, '0')}`,
    userName: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@maziktech.com`,
    avatar: `${fn[0]}${ln[0]}`,
    department: depts[i % depts.length],
    browser: browsers[i % browsers.length],
    version: ver,
    status: st,
    os: oses[i % oses.length],
    lastSeen: st === 'active' ? 'Just now' : st === 'inactive' ? '3 days ago' : st === 'pending' ? 'Never' : '1 hour ago',
    installedAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    promptsScanned: Math.floor(Math.random() * 3000) + 100,
    threatsBlocked: Math.floor(Math.random() * 200) + 5,
    autoUpdate: Math.random() > 0.15,
    ipAddress: `192.168.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 254) + 1}`,
  };
});

export const deploymentGroups: DeploymentGroup[] = [
  {
    id: 'dg_01',
    name: 'Engineering - Full Protection',
    description: 'All engineering teams with strict source code and credential protection policies',
    departments: ['Engineering', 'Data Science'],
    totalUsers: 43,
    installed: 41,
    active: 39,
    outdated: 3,
    policy: 'Source Code Protection + Credential Detection',
    version: '2.4.1',
    autoUpdate: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'dg_02',
    name: 'Business Teams - Standard',
    description: 'Marketing, Sales, and Support with standard PII and business data protection',
    departments: ['Marketing', 'Sales', 'Support'],
    totalUsers: 36,
    installed: 32,
    active: 28,
    outdated: 5,
    policy: 'PII Protection + Business Data',
    version: '2.4.1',
    autoUpdate: true,
    createdAt: '2024-02-15',
  },
  {
    id: 'dg_03',
    name: 'Finance & Legal - Maximum Security',
    description: 'Finance, HR, and Legal teams with maximum sensitivity and hard block policies',
    departments: ['Finance', 'HR', 'Legal'],
    totalUsers: 19,
    installed: 19,
    active: 18,
    outdated: 0,
    policy: 'Maximum Protection + Indian PII Block',
    version: '2.4.1',
    autoUpdate: true,
    createdAt: '2024-01-25',
  },
  {
    id: 'dg_04',
    name: 'Product Team - Balanced',
    description: 'Product managers with balanced protection allowing AI usage for research',
    departments: ['Product'],
    totalUsers: 12,
    installed: 11,
    active: 10,
    outdated: 1,
    policy: 'Balanced Protection',
    version: '2.4.0',
    autoUpdate: false,
    createdAt: '2024-03-10',
  },
  {
    id: 'dg_05',
    name: 'Beta Testers',
    description: 'Selected users testing the latest beta extension features',
    departments: ['Engineering', 'Product'],
    totalUsers: 8,
    installed: 8,
    active: 7,
    outdated: 0,
    policy: 'Beta Testing Policy',
    version: '2.5.0-beta',
    autoUpdate: true,
    createdAt: '2025-01-05',
  },
];

export const extensionConfigs: ExtensionConfig[] = [
  // Scanning
  { id: 'cfg_01', name: 'Enable Prompt Scanning', description: 'Scan all prompts before submission to AI platforms', category: 'Scanning', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_02', name: 'Enable Response Scanning', description: 'Scan AI responses for sensitive data leakage', category: 'Scanning', type: 'toggle', value: true, defaultValue: false },
  { id: 'cfg_03', name: 'Scan Clipboard Paste', description: 'Automatically scan content pasted from clipboard', category: 'Scanning', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_04', name: 'Scan File Uploads', description: 'Inspect files uploaded to AI platforms', category: 'Scanning', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_05', name: 'Scan Threshold', description: 'Minimum confidence score to trigger detection (0-100)', category: 'Scanning', type: 'number', value: 70, defaultValue: 70 },
  { id: 'cfg_06', name: 'Max Scan Size (KB)', description: 'Maximum text size to scan in kilobytes', category: 'Scanning', type: 'number', value: 512, defaultValue: 256 },

  // User Experience
  { id: 'cfg_07', name: 'Show Notification Popup', description: 'Display popup notification when sensitive data is detected', category: 'User Experience', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_08', name: 'Notification Duration (sec)', description: 'How long detection notifications remain visible', category: 'User Experience', type: 'number', value: 5, defaultValue: 5 },
  { id: 'cfg_09', name: 'Show Status Badge', description: 'Display protection status badge on AI platform pages', category: 'User Experience', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_10', name: 'Block Animation Style', description: 'Visual style when a prompt is blocked', category: 'User Experience', type: 'select', value: 'slide', options: ['fade', 'slide', 'shake', 'flash', 'none'], defaultValue: 'slide' },
  { id: 'cfg_11', name: 'Warning Color Theme', description: 'Color theme for warning indicators', category: 'User Experience', type: 'select', value: 'amber', options: ['amber', 'red', 'orange', 'purple'], defaultValue: 'amber' },

  // Authentication
  { id: 'cfg_12', name: 'Require Authentication', description: 'Users must authenticate before using AI platforms', category: 'Authentication', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_13', name: 'Session Duration (hours)', description: 'How long authentication session remains valid', category: 'Authentication', type: 'number', value: 8, defaultValue: 8 },
  { id: 'cfg_14', name: 'Auth Method', description: 'Primary authentication method for extension login', category: 'Authentication', type: 'select', value: 'email', options: ['email', 'sso', 'biometric', 'certificate'], defaultValue: 'email' },
  { id: 'cfg_15', name: 'Auto-lock on Idle', description: 'Lock extension after user idle period', category: 'Authentication', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_16', name: 'Idle Timeout (min)', description: 'Minutes of inactivity before auto-lock', category: 'Authentication', type: 'number', value: 30, defaultValue: 30 },

  // Network
  { id: 'cfg_17', name: 'API Endpoint', description: 'MazikDLP backend server endpoint URL', category: 'Network', type: 'text', value: 'https://api.mazikdlp.com/v2', defaultValue: 'https://api.mazikdlp.com/v2' },
  { id: 'cfg_18', name: 'Connection Timeout (sec)', description: 'Maximum time to wait for server response', category: 'Network', type: 'number', value: 10, defaultValue: 10 },
  { id: 'cfg_19', name: 'Retry Attempts', description: 'Number of retry attempts on connection failure', category: 'Network', type: 'number', value: 3, defaultValue: 3 },
  { id: 'cfg_20', name: 'Offline Mode', description: 'Allow extension to work with cached policies when offline', category: 'Network', type: 'toggle', value: true, defaultValue: false },
  { id: 'cfg_21', name: 'Policy Sync Interval (min)', description: 'How often to sync policies from server', category: 'Network', type: 'number', value: 15, defaultValue: 15 },

  // Privacy
  { id: 'cfg_22', name: 'Log Prompt Content', description: 'Store prompt content in audit logs (hashed if disabled)', category: 'Privacy', type: 'toggle', value: false, defaultValue: false },
  { id: 'cfg_23', name: 'Send Telemetry', description: 'Send anonymous usage telemetry for product improvement', category: 'Privacy', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_24', name: 'Local Cache Duration (hours)', description: 'How long to cache detection results locally', category: 'Privacy', type: 'number', value: 24, defaultValue: 24 },

  // Image Redaction
  { id: 'cfg_25', name: 'Enable Image Redaction', description: 'Allow users to redact sensitive data from images', category: 'Image Redaction', type: 'toggle', value: true, defaultValue: true },
  { id: 'cfg_26', name: 'Auto-detect in Images', description: 'Automatically scan uploaded images for text content', category: 'Image Redaction', type: 'toggle', value: true, defaultValue: false },
  { id: 'cfg_27', name: 'Max Image Size (MB)', description: 'Maximum image file size for redaction', category: 'Image Redaction', type: 'number', value: 10, defaultValue: 5 },
  { id: 'cfg_28', name: 'Redaction Style', description: 'Visual style for redacted areas in images', category: 'Image Redaction', type: 'select', value: 'black_box', options: ['black_box', 'blur', 'pixelate', 'color_fill'], defaultValue: 'black_box' },
];

export const supportedPlatforms = [
  { name: 'ChatGPT', domain: 'chat.openai.com', status: 'supported' as const, version: '2.0.0+', icon: '🤖' },
  { name: 'Gemini', domain: 'gemini.google.com', status: 'supported' as const, version: '2.1.0+', icon: '✨' },
  { name: 'Claude', domain: 'claude.ai', status: 'supported' as const, version: '2.3.0+', icon: '🧠' },
  { name: 'Grok', domain: 'grok.x.ai', status: 'supported' as const, version: '2.4.0+', icon: '⚡' },
  { name: 'Perplexity', domain: 'perplexity.ai', status: 'supported' as const, version: '2.2.0+', icon: '🔍' },
  { name: 'Microsoft Copilot', domain: 'copilot.microsoft.com', status: 'supported' as const, version: '2.3.0+', icon: '🪟' },
  { name: 'GitHub Copilot', domain: 'github.com', status: 'supported' as const, version: '2.1.0+', icon: '🐙' },
  { name: 'DeepSeek', domain: 'chat.deepseek.com', status: 'supported' as const, version: '2.4.1+', icon: '🌊' },
  { name: 'Mistral AI', domain: 'chat.mistral.ai', status: 'beta' as const, version: '2.5.0-beta', icon: '🌀' },
  { name: 'Hugging Face', domain: 'huggingface.co', status: 'planned' as const, version: 'TBD', icon: '🤗' },
  { name: 'Meta AI', domain: 'meta.ai', status: 'planned' as const, version: 'TBD', icon: '🌐' },
  { name: 'Poe', domain: 'poe.com', status: 'planned' as const, version: 'TBD', icon: '💬' },
];

export const browserStats = {
  Chrome: { installed: 156, active: 142, icon: '🌐' },
  Firefox: { installed: 34, active: 28, icon: '🦊' },
  Edge: { installed: 42, active: 38, icon: '🔵' },
  Safari: { installed: 8, active: 6, icon: '🧭' },
  Brave: { installed: 4, active: 4, icon: '🦁' },
};

export const extensionEvents = [
  { id: 'evt_01', type: 'install', user: 'Arjun Sharma', browser: 'Chrome', version: '2.4.1', time: '5 min ago', detail: 'Fresh installation' },
  { id: 'evt_02', type: 'update', user: 'Priya Patel', browser: 'Edge', version: '2.4.0 → 2.4.1', time: '15 min ago', detail: 'Auto-update' },
  { id: 'evt_03', type: 'error', user: 'Rahul Gupta', browser: 'Chrome', version: '2.4.1', time: '32 min ago', detail: 'Connection timeout to API server' },
  { id: 'evt_04', type: 'auth', user: 'Sneha Patel', browser: 'Firefox', version: '2.4.1', time: '1 hr ago', detail: 'Authenticated via SSO' },
  { id: 'evt_05', type: 'uninstall', user: 'Vikram Singh', browser: 'Chrome', version: '2.3.2', time: '2 hrs ago', detail: 'User uninstalled extension' },
  { id: 'evt_06', type: 'block', user: 'Ananya Kumar', browser: 'Chrome', version: '2.4.1', time: '2 hrs ago', detail: 'Blocked PAN number paste to ChatGPT' },
  { id: 'evt_07', type: 'install', user: 'Karthik Reddy', browser: 'Edge', version: '2.4.1', time: '3 hrs ago', detail: 'MDM push deployment' },
  { id: 'evt_08', type: 'auth', user: 'Divya Joshi', browser: 'Chrome', version: '2.4.1', time: '3 hrs ago', detail: 'Session renewed' },
  { id: 'evt_09', type: 'update', user: 'Amit Nair', browser: 'Firefox', version: '2.3.2 → 2.4.1', time: '4 hrs ago', detail: 'Manual update' },
  { id: 'evt_10', type: 'error', user: 'Meera Desai', browser: 'Safari', version: '2.4.0', time: '5 hrs ago', detail: 'Policy sync failed - retry succeeded' },
  { id: 'evt_11', type: 'block', user: 'Rohit Mehta', browser: 'Chrome', version: '2.4.1', time: '5 hrs ago', detail: 'Blocked source code paste to Claude' },
  { id: 'evt_12', type: 'install', user: 'Neha Choudhary', browser: 'Brave', version: '2.4.1', time: '6 hrs ago', detail: 'Self-service installation' },
];
