export interface AIApplication {
  id: string;
  name: string;
  icon: string;
  category: string;
  vendor: string;
  website: string;
  status: 'whitelisted' | 'blocked' | 'pending' | 'restricted';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  models: AIModel[];
  securityAssessment: SecurityAssessment;
  usageStats: AppUsageStats;
  policies: string[];
  addedBy: string;
  addedDate: string;
  lastReviewed: string;
  reviewCycle: number;
  tags: string[];
  dataRetention: string;
  complianceCerts: string[];
  apiEndpoints: string[];
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  status: 'allowed' | 'blocked' | 'restricted';
  policyLevel: string;
  maxTokens: number;
}

export interface SecurityAssessment {
  overallScore: number;
  dataEncryption: 'strong' | 'moderate' | 'weak' | 'none';
  dataRetention: string;
  gdprCompliant: boolean;
  soc2Compliant: boolean;
  hipaaCompliant: boolean;
  iso27001: boolean;
  penTestDate: string;
  vulnerabilities: number;
  lastAudit: string;
  notes: string;
}

export interface AppUsageStats {
  totalPrompts: number;
  activeUsers: number;
  blockedPrompts: number;
  maskedPrompts: number;
  avgResponseTime: number;
  dataExposureIncidents: number;
  last30DaysTrend: number[];
  topDepartments: { name: string; usage: number }[];
}

export interface AccessRequest {
  id: string;
  appName: string;
  appIcon: string;
  requestedBy: string;
  requestedByEmail: string;
  department: string;
  requestDate: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
  priority: 'low' | 'medium' | 'high';
  usersRequested: number;
}

export interface AppCategory {
  name: string;
  count: number;
  icon: string;
}

export const aiApplications: AIApplication[] = [
  {
    id: 'app-001',
    name: 'ChatGPT',
    icon: '🤖',
    category: 'General AI Assistant',
    vendor: 'OpenAI',
    website: 'https://chat.openai.com',
    status: 'whitelisted',
    riskLevel: 'medium',
    description: 'General-purpose AI chatbot for text generation, analysis, coding assistance, and more.',
    models: [
      { id: 'm1', name: 'GPT-4o', version: '2024-05', status: 'allowed', policyLevel: 'Standard', maxTokens: 128000 },
      { id: 'm2', name: 'GPT-4o Mini', version: '2024-07', status: 'allowed', policyLevel: 'Standard', maxTokens: 128000 },
      { id: 'm3', name: 'GPT-4', version: '2024-01', status: 'restricted', policyLevel: 'Strict', maxTokens: 8192 },
      { id: 'm4', name: 'o1-preview', version: '2024-09', status: 'allowed', policyLevel: 'Standard', maxTokens: 128000 },
    ],
    securityAssessment: {
      overallScore: 78,
      dataEncryption: 'strong',
      dataRetention: '30 days (opt-out available)',
      gdprCompliant: true,
      soc2Compliant: true,
      hipaaCompliant: false,
      iso27001: true,
      penTestDate: '2024-11-15',
      vulnerabilities: 2,
      lastAudit: '2024-12-01',
      notes: 'Enterprise plan available with enhanced data controls. API usage provides better data governance.',
    },
    usageStats: {
      totalPrompts: 45230,
      activeUsers: 342,
      blockedPrompts: 1205,
      maskedPrompts: 8920,
      avgResponseTime: 2.3,
      dataExposureIncidents: 12,
      last30DaysTrend: [1200, 1350, 1180, 1420, 1530, 1290, 1680, 1750, 1620, 1480, 1320, 1190, 1560, 1720, 1830, 1490, 1380, 1610, 1740, 1550, 1420, 1670, 1800, 1930, 1680, 1520, 1440, 1590, 1710, 1850],
      topDepartments: [
        { name: 'Engineering', usage: 38 },
        { name: 'Product', usage: 22 },
        { name: 'Marketing', usage: 18 },
        { name: 'Support', usage: 12 },
        { name: 'HR', usage: 10 },
      ],
    },
    policies: ['PII Protection Standard', 'Source Code Guard', 'Credential Shield'],
    addedBy: 'admin@company.com',
    addedDate: '2024-01-15',
    lastReviewed: '2024-12-01',
    reviewCycle: 90,
    tags: ['productivity', 'coding', 'writing', 'analysis'],
    dataRetention: '30 days',
    complianceCerts: ['SOC 2 Type II', 'ISO 27001', 'GDPR'],
    apiEndpoints: ['api.openai.com', 'chat.openai.com'],
  },
  {
    id: 'app-002',
    name: 'Google Gemini',
    icon: '💎',
    category: 'General AI Assistant',
    vendor: 'Google',
    website: 'https://gemini.google.com',
    status: 'whitelisted',
    riskLevel: 'low',
    description: 'Google\'s multimodal AI assistant with advanced reasoning and integration with Google Workspace.',
    models: [
      { id: 'm5', name: 'Gemini 2.0 Flash', version: '2024-12', status: 'allowed', policyLevel: 'Standard', maxTokens: 1048576 },
      { id: 'm6', name: 'Gemini 1.5 Pro', version: '2024-05', status: 'allowed', policyLevel: 'Standard', maxTokens: 2097152 },
      { id: 'm7', name: 'Gemini 1.5 Flash', version: '2024-05', status: 'allowed', policyLevel: 'Relaxed', maxTokens: 1048576 },
    ],
    securityAssessment: {
      overallScore: 85,
      dataEncryption: 'strong',
      dataRetention: '18 months (configurable)',
      gdprCompliant: true,
      soc2Compliant: true,
      hipaaCompliant: true,
      iso27001: true,
      penTestDate: '2024-10-20',
      vulnerabilities: 0,
      lastAudit: '2024-11-15',
      notes: 'Google Workspace integration provides enterprise-grade data controls. Strong compliance posture.',
    },
    usageStats: {
      totalPrompts: 32100,
      activeUsers: 278,
      blockedPrompts: 890,
      maskedPrompts: 6340,
      avgResponseTime: 1.8,
      dataExposureIncidents: 5,
      last30DaysTrend: [950, 1020, 980, 1100, 1150, 1080, 1200, 1300, 1180, 1090, 1020, 980, 1130, 1240, 1310, 1080, 1050, 1170, 1280, 1150, 1060, 1200, 1340, 1420, 1280, 1150, 1090, 1180, 1260, 1350],
      topDepartments: [
        { name: 'Product', usage: 32 },
        { name: 'Engineering', usage: 28 },
        { name: 'Marketing', usage: 20 },
        { name: 'Sales', usage: 12 },
        { name: 'Legal', usage: 8 },
      ],
    },
    policies: ['PII Protection Standard', 'Indian PII Guard'],
    addedBy: 'admin@company.com',
    addedDate: '2024-02-10',
    lastReviewed: '2024-11-20',
    reviewCycle: 90,
    tags: ['productivity', 'research', 'workspace'],
    dataRetention: '18 months',
    complianceCerts: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'HIPAA'],
    apiEndpoints: ['generativelanguage.googleapis.com', 'gemini.google.com'],
  },
  {
    id: 'app-003',
    name: 'Claude',
    icon: '🧠',
    category: 'General AI Assistant',
    vendor: 'Anthropic',
    website: 'https://claude.ai',
    status: 'whitelisted',
    riskLevel: 'low',
    description: 'Anthropic\'s AI assistant focused on safety, helpfulness, and honesty. Strong at analysis and coding.',
    models: [
      { id: 'm8', name: 'Claude 4 Sonnet', version: '2025-05', status: 'allowed', policyLevel: 'Standard', maxTokens: 200000 },
      { id: 'm9', name: 'Claude 3.5 Sonnet', version: '2024-10', status: 'allowed', policyLevel: 'Standard', maxTokens: 200000 },
      { id: 'm10', name: 'Claude 3.5 Haiku', version: '2024-10', status: 'allowed', policyLevel: 'Relaxed', maxTokens: 200000 },
      { id: 'm11', name: 'Claude 3 Opus', version: '2024-02', status: 'restricted', policyLevel: 'Strict', maxTokens: 200000 },
    ],
    securityAssessment: {
      overallScore: 88,
      dataEncryption: 'strong',
      dataRetention: 'No training on inputs (enterprise)',
      gdprCompliant: true,
      soc2Compliant: true,
      hipaaCompliant: true,
      iso27001: true,
      penTestDate: '2024-11-01',
      vulnerabilities: 0,
      lastAudit: '2024-11-30',
      notes: 'Best-in-class data privacy. Enterprise tier does not use conversations for training. Constitutional AI approach.',
    },
    usageStats: {
      totalPrompts: 28450,
      activeUsers: 215,
      blockedPrompts: 620,
      maskedPrompts: 5120,
      avgResponseTime: 2.1,
      dataExposureIncidents: 3,
      last30DaysTrend: [780, 850, 820, 920, 990, 870, 1050, 1120, 980, 910, 860, 800, 950, 1030, 1100, 920, 880, 1000, 1080, 960, 890, 1020, 1130, 1200, 1080, 950, 910, 1000, 1070, 1150],
      topDepartments: [
        { name: 'Engineering', usage: 42 },
        { name: 'Research', usage: 25 },
        { name: 'Product', usage: 18 },
        { name: 'Legal', usage: 10 },
        { name: 'Finance', usage: 5 },
      ],
    },
    policies: ['PII Protection Standard', 'Source Code Guard', 'Credential Shield', 'Indian PII Guard'],
    addedBy: 'security@company.com',
    addedDate: '2024-03-05',
    lastReviewed: '2024-12-05',
    reviewCycle: 60,
    tags: ['productivity', 'coding', 'analysis', 'safety'],
    dataRetention: 'None (Enterprise)',
    complianceCerts: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'HIPAA'],
    apiEndpoints: ['api.anthropic.com', 'claude.ai'],
  },
  {
    id: 'app-004',
    name: 'Grok',
    icon: '⚡',
    category: 'General AI Assistant',
    vendor: 'xAI',
    website: 'https://grok.x.ai',
    status: 'blocked',
    riskLevel: 'high',
    description: 'xAI\'s conversational AI with real-time information access. Integrated with X (Twitter) platform.',
    models: [
      { id: 'm12', name: 'Grok-2', version: '2024-08', status: 'blocked', policyLevel: 'N/A', maxTokens: 131072 },
      { id: 'm13', name: 'Grok-2 Mini', version: '2024-08', status: 'blocked', policyLevel: 'N/A', maxTokens: 131072 },
    ],
    securityAssessment: {
      overallScore: 35,
      dataEncryption: 'moderate',
      dataRetention: 'Unclear - may use data for training',
      gdprCompliant: false,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: 'Not available',
      vulnerabilities: 8,
      lastAudit: 'Never',
      notes: 'Insufficient security documentation. No enterprise plan available. Data retention policies unclear. Not recommended for enterprise use.',
    },
    usageStats: {
      totalPrompts: 340,
      activeUsers: 12,
      blockedPrompts: 340,
      maskedPrompts: 0,
      avgResponseTime: 0,
      dataExposureIncidents: 0,
      last30DaysTrend: [15, 12, 8, 18, 22, 10, 5, 8, 12, 15, 9, 6, 14, 18, 20, 11, 7, 13, 16, 10, 8, 12, 15, 18, 14, 10, 8, 11, 13, 16],
      topDepartments: [
        { name: 'Engineering', usage: 45 },
        { name: 'Marketing', usage: 30 },
        { name: 'Sales', usage: 25 },
      ],
    },
    policies: [],
    addedBy: 'security@company.com',
    addedDate: '2024-06-20',
    lastReviewed: '2024-11-10',
    reviewCycle: 30,
    tags: ['social-media', 'real-time'],
    dataRetention: 'Unknown',
    complianceCerts: [],
    apiEndpoints: ['api.x.ai', 'grok.x.ai'],
  },
  {
    id: 'app-005',
    name: 'Perplexity',
    icon: '🔍',
    category: 'AI Search Engine',
    vendor: 'Perplexity AI',
    website: 'https://perplexity.ai',
    status: 'restricted',
    riskLevel: 'medium',
    description: 'AI-powered search engine that provides answers with cited sources. Useful for research and fact-checking.',
    models: [
      { id: 'm14', name: 'Perplexity Default', version: '2024', status: 'restricted', policyLevel: 'Strict', maxTokens: 4096 },
      { id: 'm15', name: 'Perplexity Pro', version: '2024', status: 'restricted', policyLevel: 'Strict', maxTokens: 4096 },
    ],
    securityAssessment: {
      overallScore: 58,
      dataEncryption: 'moderate',
      dataRetention: '90 days',
      gdprCompliant: true,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: '2024-08-15',
      vulnerabilities: 3,
      lastAudit: '2024-09-01',
      notes: 'GDPR compliant but lacks SOC 2 certification. Search queries may be logged. Restrict usage to non-sensitive research queries.',
    },
    usageStats: {
      totalPrompts: 8920,
      activeUsers: 95,
      blockedPrompts: 430,
      maskedPrompts: 1580,
      avgResponseTime: 3.2,
      dataExposureIncidents: 7,
      last30DaysTrend: [250, 280, 260, 310, 340, 290, 370, 400, 350, 320, 280, 250, 330, 360, 390, 300, 270, 340, 370, 310, 280, 340, 380, 410, 360, 320, 290, 330, 360, 390],
      topDepartments: [
        { name: 'Research', usage: 40 },
        { name: 'Product', usage: 25 },
        { name: 'Marketing', usage: 20 },
        { name: 'Sales', usage: 15 },
      ],
    },
    policies: ['PII Protection Standard'],
    addedBy: 'admin@company.com',
    addedDate: '2024-04-12',
    lastReviewed: '2024-10-15',
    reviewCycle: 60,
    tags: ['research', 'search', 'fact-checking'],
    dataRetention: '90 days',
    complianceCerts: ['GDPR'],
    apiEndpoints: ['api.perplexity.ai', 'perplexity.ai'],
  },
];

// Note: app-006 through app-010 removed — only first 5 kept as fallback (API provides real data).
const _removedApps: AIApplication[] = [
  {
    id: 'app-006',
    name: 'Microsoft Copilot',
    icon: '🪟',
    category: 'Productivity AI',
    vendor: 'Microsoft',
    website: 'https://copilot.microsoft.com',
    status: 'whitelisted',
    riskLevel: 'low',
    description: 'AI assistant integrated with Microsoft 365 suite. Enterprise-grade with data boundary controls.',
    models: [
      { id: 'm16', name: 'Copilot (GPT-4 based)', version: '2024', status: 'allowed', policyLevel: 'Relaxed', maxTokens: 32000 },
    ],
    securityAssessment: {
      overallScore: 92,
      dataEncryption: 'strong',
      dataRetention: 'Within Microsoft tenant',
      gdprCompliant: true,
      soc2Compliant: true,
      hipaaCompliant: true,
      iso27001: true,
      penTestDate: '2024-10-01',
      vulnerabilities: 0,
      lastAudit: '2024-12-01',
      notes: 'Enterprise data stays within Microsoft tenant. Best-in-class compliance. Data boundary controls available.',
    },
    usageStats: {
      totalPrompts: 52300,
      activeUsers: 410,
      blockedPrompts: 580,
      maskedPrompts: 4200,
      avgResponseTime: 1.5,
      dataExposureIncidents: 1,
      last30DaysTrend: [1500, 1620, 1580, 1700, 1780, 1650, 1820, 1900, 1750, 1680, 1600, 1520, 1700, 1820, 1930, 1680, 1600, 1760, 1870, 1720, 1650, 1800, 1920, 2050, 1880, 1750, 1680, 1790, 1870, 1960],
      topDepartments: [
        { name: 'All Departments', usage: 100 },
      ],
    },
    policies: ['PII Protection Standard'],
    addedBy: 'admin@company.com',
    addedDate: '2024-01-01',
    lastReviewed: '2024-12-01',
    reviewCycle: 90,
    tags: ['productivity', 'office', 'enterprise'],
    dataRetention: 'Tenant-controlled',
    complianceCerts: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'HIPAA', 'FedRAMP'],
    apiEndpoints: ['copilot.microsoft.com'],
  },
  {
    id: 'app-007',
    name: 'GitHub Copilot',
    icon: '🐙',
    category: 'Code Assistant',
    vendor: 'GitHub (Microsoft)',
    website: 'https://github.com/features/copilot',
    status: 'whitelisted',
    riskLevel: 'medium',
    description: 'AI pair programming tool for code completion, generation, and review inside IDEs.',
    models: [
      { id: 'm17', name: 'Copilot (Codex based)', version: '2024', status: 'allowed', policyLevel: 'Standard', maxTokens: 8192 },
    ],
    securityAssessment: {
      overallScore: 82,
      dataEncryption: 'strong',
      dataRetention: 'Enterprise: No code retention',
      gdprCompliant: true,
      soc2Compliant: true,
      hipaaCompliant: false,
      iso27001: true,
      penTestDate: '2024-09-15',
      vulnerabilities: 1,
      lastAudit: '2024-11-01',
      notes: 'Enterprise plan does not retain code snippets. Business plan telemetry can be disabled.',
    },
    usageStats: {
      totalPrompts: 67800,
      activeUsers: 180,
      blockedPrompts: 2100,
      maskedPrompts: 9200,
      avgResponseTime: 0.8,
      dataExposureIncidents: 8,
      last30DaysTrend: [2100, 2250, 2180, 2350, 2420, 2280, 2500, 2600, 2380, 2300, 2200, 2100, 2380, 2500, 2620, 2350, 2250, 2430, 2550, 2400, 2300, 2470, 2590, 2700, 2520, 2380, 2280, 2420, 2540, 2650],
      topDepartments: [
        { name: 'Engineering', usage: 85 },
        { name: 'DevOps', usage: 10 },
        { name: 'QA', usage: 5 },
      ],
    },
    policies: ['Source Code Guard', 'Credential Shield', 'API Key Protection'],
    addedBy: 'cto@company.com',
    addedDate: '2024-01-20',
    lastReviewed: '2024-11-15',
    reviewCycle: 60,
    tags: ['coding', 'ide', 'development'],
    dataRetention: 'None (Enterprise)',
    complianceCerts: ['SOC 2 Type II', 'ISO 27001', 'GDPR'],
    apiEndpoints: ['api.githubcopilot.com'],
  },
  {
    id: 'app-008',
    name: 'DeepSeek',
    icon: '🌊',
    category: 'General AI Assistant',
    vendor: 'DeepSeek',
    website: 'https://chat.deepseek.com',
    status: 'blocked',
    riskLevel: 'critical',
    description: 'Chinese AI model with advanced reasoning capabilities. Data sovereignty concerns for enterprise use.',
    models: [
      { id: 'm18', name: 'DeepSeek-V3', version: '2024-12', status: 'blocked', policyLevel: 'N/A', maxTokens: 128000 },
      { id: 'm19', name: 'DeepSeek-R1', version: '2025-01', status: 'blocked', policyLevel: 'N/A', maxTokens: 128000 },
    ],
    securityAssessment: {
      overallScore: 18,
      dataEncryption: 'moderate',
      dataRetention: 'Stored on servers in China',
      gdprCompliant: false,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: 'Not available',
      vulnerabilities: 15,
      lastAudit: 'Never',
      notes: 'CRITICAL: Data stored on Chinese servers. Subject to Chinese data laws. Not suitable for any enterprise data. Blocked by security policy.',
    },
    usageStats: {
      totalPrompts: 120,
      activeUsers: 5,
      blockedPrompts: 120,
      maskedPrompts: 0,
      avgResponseTime: 0,
      dataExposureIncidents: 0,
      last30DaysTrend: [5, 3, 2, 8, 6, 4, 2, 3, 5, 7, 4, 2, 6, 8, 5, 3, 2, 4, 6, 3, 2, 5, 7, 8, 5, 3, 2, 4, 5, 6],
      topDepartments: [
        { name: 'Engineering', usage: 80 },
        { name: 'Research', usage: 20 },
      ],
    },
    policies: [],
    addedBy: 'ciso@company.com',
    addedDate: '2025-01-15',
    lastReviewed: '2025-01-15',
    reviewCycle: 30,
    tags: ['reasoning', 'coding'],
    dataRetention: 'China-based servers',
    complianceCerts: [],
    apiEndpoints: ['api.deepseek.com', 'chat.deepseek.com'],
  },
  {
    id: 'app-009',
    name: 'Mistral AI',
    icon: '🌬️',
    category: 'General AI Assistant',
    vendor: 'Mistral AI',
    website: 'https://chat.mistral.ai',
    status: 'pending',
    riskLevel: 'medium',
    description: 'European AI company with strong open-source models. Good data sovereignty for EU compliance.',
    models: [
      { id: 'm20', name: 'Mistral Large', version: '2024-11', status: 'blocked', policyLevel: 'N/A', maxTokens: 128000 },
      { id: 'm21', name: 'Mistral Medium', version: '2024-07', status: 'blocked', policyLevel: 'N/A', maxTokens: 32000 },
    ],
    securityAssessment: {
      overallScore: 65,
      dataEncryption: 'strong',
      dataRetention: 'EU-based, 30 days',
      gdprCompliant: true,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: '2024-07-01',
      vulnerabilities: 2,
      lastAudit: '2024-08-15',
      notes: 'EU-based company with good data sovereignty. Pending SOC 2 certification. Security assessment in progress.',
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
    addedDate: '2024-12-01',
    lastReviewed: '2024-12-01',
    reviewCycle: 30,
    tags: ['eu-based', 'open-source'],
    dataRetention: '30 days (EU)',
    complianceCerts: ['GDPR'],
    apiEndpoints: ['api.mistral.ai', 'chat.mistral.ai'],
  },
  {
    id: 'app-010',
    name: 'Hugging Face',
    icon: '🤗',
    category: 'ML Platform',
    vendor: 'Hugging Face',
    website: 'https://huggingface.co',
    status: 'restricted',
    riskLevel: 'medium',
    description: 'Open-source ML platform with model hosting, inference, and community models.',
    models: [
      { id: 'm22', name: 'Various Community Models', version: 'N/A', status: 'restricted', policyLevel: 'Strict', maxTokens: 0 },
    ],
    securityAssessment: {
      overallScore: 55,
      dataEncryption: 'moderate',
      dataRetention: 'Varies by model',
      gdprCompliant: true,
      soc2Compliant: false,
      hipaaCompliant: false,
      iso27001: false,
      penTestDate: '2024-06-01',
      vulnerabilities: 5,
      lastAudit: '2024-07-01',
      notes: 'Open platform with varying security levels per model. Community models may have unknown data practices.',
    },
    usageStats: {
      totalPrompts: 4200,
      activeUsers: 35,
      blockedPrompts: 890,
      maskedPrompts: 1200,
      avgResponseTime: 4.5,
      dataExposureIncidents: 4,
      last30DaysTrend: [120, 140, 130, 160, 170, 140, 190, 200, 170, 150, 140, 120, 160, 180, 200, 150, 130, 170, 190, 160, 140, 170, 190, 210, 180, 160, 140, 160, 170, 190],
      topDepartments: [
        { name: 'Research', usage: 55 },
        { name: 'Engineering', usage: 35 },
        { name: 'Data Science', usage: 10 },
      ],
    },
    policies: ['Source Code Guard', 'PII Protection Standard'],
    addedBy: 'admin@company.com',
    addedDate: '2024-05-10',
    lastReviewed: '2024-10-01',
    reviewCycle: 60,
    tags: ['open-source', 'ml-platform', 'research'],
    dataRetention: 'Varies',
    complianceCerts: ['GDPR'],
    apiEndpoints: ['api-inference.huggingface.co', 'huggingface.co'],
  },
];

export const accessRequests: AccessRequest[] = [
  {
    id: 'req-001',
    appName: 'Mistral AI',
    appIcon: '🌬️',
    requestedBy: 'Priya Sharma',
    requestedByEmail: 'priya.sharma@company.com',
    department: 'Engineering',
    requestDate: '2024-12-10',
    justification: 'Need Mistral Large for code generation and review. EU-based data sovereignty aligns with our compliance requirements for the EU project.',
    status: 'pending',
    priority: 'high',
    usersRequested: 25,
  },
  {
    id: 'req-002',
    appName: 'Cohere',
    appIcon: '🔗',
    requestedBy: 'Rahul Verma',
    requestedByEmail: 'rahul.verma@company.com',
    department: 'Data Science',
    requestDate: '2024-12-08',
    justification: 'Cohere\'s embedding and RAG capabilities are needed for our semantic search project. Enterprise tier provides data isolation.',
    status: 'pending',
    priority: 'medium',
    usersRequested: 8,
  },
  {
    id: 'req-003',
    appName: 'Jasper AI',
    appIcon: '✏️',
    requestedBy: 'Ananya Patel',
    requestedByEmail: 'ananya.patel@company.com',
    department: 'Marketing',
    requestDate: '2024-12-05',
    justification: 'Marketing team needs Jasper for content generation, blog writing, and social media copy. SOC 2 certified.',
    status: 'pending',
    priority: 'low',
    usersRequested: 15,
  },
  {
    id: 'req-004',
    appName: 'Midjourney',
    appIcon: '🎨',
    requestedBy: 'Kiran Desai',
    requestedByEmail: 'kiran.desai@company.com',
    department: 'Design',
    requestDate: '2024-11-28',
    justification: 'Design team needs Midjourney for concept art and visual ideation for product mockups.',
    status: 'approved',
    reviewedBy: 'admin@company.com',
    reviewDate: '2024-12-01',
    reviewNotes: 'Approved with strict policy: no internal product designs, no customer data in prompts.',
    priority: 'medium',
    usersRequested: 6,
  },
  {
    id: 'req-005',
    appName: 'Cursor AI',
    appIcon: '📝',
    requestedBy: 'Vikram Singh',
    requestedByEmail: 'vikram.singh@company.com',
    department: 'Engineering',
    requestDate: '2024-11-25',
    justification: 'AI-powered code editor. Engineering team wants to evaluate for productivity gains.',
    status: 'rejected',
    reviewedBy: 'ciso@company.com',
    reviewDate: '2024-11-30',
    reviewNotes: 'Rejected: Insufficient security documentation. Code is sent to external servers without clear data retention policy. Re-evaluate when SOC 2 is achieved.',
    priority: 'high',
    usersRequested: 40,
  },
];

export const appCategories: AppCategory[] = [
  { name: 'General AI Assistant', count: 6, icon: '🤖' },
  { name: 'Code Assistant', count: 2, icon: '💻' },
  { name: 'AI Search Engine', count: 1, icon: '🔍' },
  { name: 'Productivity AI', count: 1, icon: '📊' },
  { name: 'ML Platform', count: 1, icon: '🧪' },
  { name: 'Image Generation', count: 0, icon: '🎨' },
];
