export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'security' | 'usage' | 'executive' | 'audit' | 'incident';
  icon: string;
  sections: string[];
  formats: string[];
  estimatedTime: string;
  lastGenerated: string | null;
  generationCount: number;
  isCustom: boolean;
  tags: string[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  category: string;
  status: 'completed' | 'generating' | 'failed' | 'queued';
  format: string;
  fileSize: string;
  generatedBy: string;
  generatedAt: string;
  dateRange: string;
  duration: string;
  pages: number;
  downloadCount: number;
  sections: string[];
  highlights: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  nextRun: string;
  lastRun: string | null;
  recipients: string[];
  format: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  deliveryMethod: 'email' | 'slack' | 'download' | 'webhook';
  filters: { departments?: string[]; aiApps?: string[]; dateRange?: string };
}

export interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'in_progress';
  score: number;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  inProgressControls: number;
  lastAssessment: string;
  nextAssessment: string;
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'in_progress' | 'not_applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  lastChecked: string;
}

export const reportTemplates: ReportTemplate[] = [
  {
    id: 'tpl_01', name: 'Executive Summary', description: 'High-level overview of AI security posture, key metrics, and recommendations for leadership.', category: 'executive',
    icon: '📊', sections: ['KPI Overview', 'Threat Summary', 'Top Risks', 'Policy Compliance', 'Recommendations', 'Trend Analysis'],
    formats: ['PDF', 'PPTX', 'HTML'], estimatedTime: '2-3 min', lastGenerated: '2025-01-10', generationCount: 24, isCustom: false,
    tags: ['leadership', 'quarterly', 'board-ready'],
  },
  {
    id: 'tpl_02', name: 'Data Leakage Incident Report', description: 'Detailed breakdown of all data leakage incidents including blocked prompts, masked data, and policy violations.', category: 'incident',
    icon: '🚨', sections: ['Incident Timeline', 'Affected Users', 'Data Types Exposed', 'Policy Actions Taken', 'Root Cause Analysis', 'Remediation Steps'],
    formats: ['PDF', 'CSV', 'JSON'], estimatedTime: '3-5 min', lastGenerated: '2025-01-09', generationCount: 47, isCustom: false,
    tags: ['incident-response', 'forensics', 'critical'],
  },
  {
    id: 'tpl_03', name: 'GDPR Compliance Assessment', description: 'Full GDPR compliance report covering data processing, consent, breach notifications, and DPO requirements.', category: 'compliance',
    icon: '🇪🇺', sections: ['Data Processing Activities', 'Consent Management', 'Breach Log', 'DPIA Assessments', 'DPO Report', 'Cross-Border Transfers'],
    formats: ['PDF', 'DOCX'], estimatedTime: '5-8 min', lastGenerated: '2025-01-05', generationCount: 12, isCustom: false,
    tags: ['gdpr', 'privacy', 'regulation'],
  },
  {
    id: 'tpl_04', name: 'AI Usage Analytics', description: 'Comprehensive analytics on AI tool adoption, prompt patterns, user behavior, and productivity insights.', category: 'usage',
    icon: '📈', sections: ['Usage Trends', 'Platform Breakdown', 'User Adoption', 'Prompt Categories', 'Peak Usage Times', 'Cost Estimation'],
    formats: ['PDF', 'CSV', 'XLSX', 'HTML'], estimatedTime: '2-4 min', lastGenerated: '2025-01-10', generationCount: 56, isCustom: false,
    tags: ['analytics', 'adoption', 'productivity'],
  },
  {
    id: 'tpl_05', name: 'Security Audit Trail', description: 'Complete audit trail of all security events, policy changes, user actions, and system modifications.', category: 'audit',
    icon: '🔍', sections: ['Event Timeline', 'Policy Changes', 'User Administration', 'Access Log', 'Configuration Changes', 'Anomaly Detection'],
    formats: ['PDF', 'CSV', 'JSON'], estimatedTime: '4-6 min', lastGenerated: '2025-01-08', generationCount: 31, isCustom: false,
    tags: ['audit', 'soc2', 'trail'],
  },
  {
    id: 'tpl_06', name: 'Department Risk Assessment', description: 'Per-department risk analysis with user risk scores, violation patterns, and security recommendations.', category: 'security',
    icon: '🏢', sections: ['Department Overview', 'Risk Scores', 'Top Violators', 'Violation Trends', 'Policy Gaps', 'Recommended Actions'],
    formats: ['PDF', 'XLSX'], estimatedTime: '3-5 min', lastGenerated: '2025-01-07', generationCount: 18, isCustom: false,
    tags: ['risk', 'department', 'assessment'],
  },
  {
    id: 'tpl_07', name: 'SOC 2 Type II Report', description: 'SOC 2 Type II compliance report covering security, availability, processing integrity, and confidentiality.', category: 'compliance',
    icon: '🛡️', sections: ['Security Controls', 'Availability Monitoring', 'Processing Integrity', 'Confidentiality Measures', 'Change Management', 'Incident Response'],
    formats: ['PDF', 'DOCX'], estimatedTime: '8-12 min', lastGenerated: '2024-12-15', generationCount: 4, isCustom: false,
    tags: ['soc2', 'compliance', 'enterprise'],
  },
  {
    id: 'tpl_08', name: 'PII Exposure Report', description: 'Focused report on personally identifiable information detected, masked, or blocked across AI interactions.', category: 'security',
    icon: '🔐', sections: ['PII Summary', 'Detection by Type', 'Indian PII Breakdown', 'User Exposure Risk', 'Masking Effectiveness', 'Recommendations'],
    formats: ['PDF', 'CSV'], estimatedTime: '2-4 min', lastGenerated: '2025-01-09', generationCount: 38, isCustom: false,
    tags: ['pii', 'privacy', 'exposure'],
  },
  {
    id: 'tpl_09', name: 'Policy Effectiveness Review', description: 'Analysis of policy performance, detection rates, false positives, and configuration recommendations.', category: 'security',
    icon: '📋', sections: ['Policy Performance', 'Detection Accuracy', 'False Positive Analysis', 'Coverage Gaps', 'Optimization Suggestions', 'Benchmarks'],
    formats: ['PDF', 'HTML'], estimatedTime: '3-5 min', lastGenerated: '2025-01-06', generationCount: 15, isCustom: false,
    tags: ['policy', 'optimization', 'accuracy'],
  },
  {
    id: 'tpl_10', name: 'DPDPA Compliance Report', description: 'Digital Personal Data Protection Act (India) compliance assessment covering data processing, consent, and breach management.', category: 'compliance',
    icon: '🇮🇳', sections: ['Data Principal Rights', 'Consent Records', 'Data Fiduciary Obligations', 'Breach Notification Log', 'Significant Data Fiduciary Assessment', 'Cross-Border Transfer Compliance'],
    formats: ['PDF', 'DOCX'], estimatedTime: '5-8 min', lastGenerated: '2025-01-04', generationCount: 8, isCustom: false,
    tags: ['dpdpa', 'india', 'privacy', 'regulation'],
  },
  {
    id: 'tpl_11', name: 'Custom Weekly Digest', description: 'Custom weekly summary tailored for the security team with key metrics, incidents, and action items.', category: 'executive',
    icon: '📬', sections: ['Weekly Highlights', 'Key Metrics', 'Incident Summary', 'Action Items', 'Next Week Focus'],
    formats: ['PDF', 'HTML'], estimatedTime: '1-2 min', lastGenerated: '2025-01-10', generationCount: 42, isCustom: true,
    tags: ['weekly', 'digest', 'custom'],
  },
  {
    id: 'tpl_12', name: 'Source Code Leakage Report', description: 'Detailed report on source code and intellectual property exposure through AI tools.', category: 'incident',
    icon: '💻', sections: ['Code Exposure Summary', 'Language Breakdown', 'Repositories Affected', 'User Analysis', 'Detection Rules', 'Prevention Measures'],
    formats: ['PDF', 'CSV'], estimatedTime: '3-5 min', lastGenerated: '2025-01-08', generationCount: 21, isCustom: false,
    tags: ['source-code', 'ip', 'leakage'],
  },
];

export const generatedReports: GeneratedReport[] = [
  {
    id: 'rpt_001', templateId: 'tpl_01', name: 'Executive Summary — January 2025', category: 'executive', status: 'completed', format: 'PDF',
    fileSize: '2.4 MB', generatedBy: 'Priya Patel', generatedAt: '2025-01-10T14:30:00', dateRange: 'Jan 1 – Jan 10, 2025', duration: '2m 14s', pages: 18,
    downloadCount: 7, sections: ['KPI Overview', 'Threat Summary', 'Top Risks', 'Policy Compliance', 'Recommendations', 'Trend Analysis'],
    highlights: [
      { label: 'Total Prompts', value: '48,293', trend: 'up' },
      { label: 'Blocked', value: '1,847', trend: 'down' },
      { label: 'Protection Rate', value: '96.2%', trend: 'up' },
      { label: 'Active Policies', value: '15', trend: 'neutral' },
    ],
  },
  {
    id: 'rpt_002', templateId: 'tpl_02', name: 'Incident Report — PAN Exposure Event', category: 'incident', status: 'completed', format: 'PDF',
    fileSize: '1.8 MB', generatedBy: 'Arjun Sharma', generatedAt: '2025-01-09T16:45:00', dateRange: 'Jan 9, 2025', duration: '3m 47s', pages: 12,
    downloadCount: 4, sections: ['Incident Timeline', 'Affected Users', 'Data Types Exposed', 'Policy Actions Taken', 'Root Cause Analysis', 'Remediation Steps'],
    highlights: [
      { label: 'Incidents', value: '3', trend: 'down' },
      { label: 'Users Affected', value: '2', trend: 'neutral' },
      { label: 'PAN Numbers Blocked', value: '5', trend: 'down' },
      { label: 'Response Time', value: '< 50ms', trend: 'neutral' },
    ],
  },
  {
    id: 'rpt_003', templateId: 'tpl_04', name: 'AI Usage Analytics — Week 2 Jan 2025', category: 'usage', status: 'completed', format: 'XLSX',
    fileSize: '3.1 MB', generatedBy: 'System', generatedAt: '2025-01-10T06:00:00', dateRange: 'Jan 6 – Jan 10, 2025', duration: '2m 55s', pages: 24,
    downloadCount: 12, sections: ['Usage Trends', 'Platform Breakdown', 'User Adoption', 'Prompt Categories', 'Peak Usage Times', 'Cost Estimation'],
    highlights: [
      { label: 'Active Users', value: '244', trend: 'up' },
      { label: 'Top Platform', value: 'ChatGPT', trend: 'neutral' },
      { label: 'Coding Prompts', value: '38%', trend: 'up' },
      { label: 'Avg Prompts/User', value: '12.4', trend: 'up' },
    ],
  },
  {
    id: 'rpt_004', templateId: 'tpl_05', name: 'Security Audit Trail — Q4 2024', category: 'audit', status: 'completed', format: 'PDF',
    fileSize: '5.7 MB', generatedBy: 'Divya Joshi', generatedAt: '2025-01-08T10:20:00', dateRange: 'Oct 1 – Dec 31, 2024', duration: '5m 12s', pages: 42,
    downloadCount: 3, sections: ['Event Timeline', 'Policy Changes', 'User Administration', 'Access Log', 'Configuration Changes', 'Anomaly Detection'],
    highlights: [
      { label: 'Total Events', value: '127,441', trend: 'up' },
      { label: 'Policy Changes', value: '23', trend: 'neutral' },
      { label: 'User Changes', value: '18', trend: 'up' },
      { label: 'Anomalies', value: '4', trend: 'down' },
    ],
  },
  {
    id: 'rpt_005', templateId: 'tpl_08', name: 'PII Exposure Report — January 2025', category: 'security', status: 'completed', format: 'PDF',
    fileSize: '1.5 MB', generatedBy: 'Sneha Patel', generatedAt: '2025-01-09T09:15:00', dateRange: 'Jan 1 – Jan 9, 2025', duration: '2m 33s', pages: 15,
    downloadCount: 6, sections: ['PII Summary', 'Detection by Type', 'Indian PII Breakdown', 'User Exposure Risk', 'Masking Effectiveness', 'Recommendations'],
    highlights: [
      { label: 'PII Detected', value: '2,341', trend: 'down' },
      { label: 'Emails Masked', value: '891', trend: 'down' },
      { label: 'PAN Blocked', value: '127', trend: 'down' },
      { label: 'Mask Accuracy', value: '99.4%', trend: 'up' },
    ],
  },
];

export const scheduledReports: ScheduledReport[] = [
  {
    id: 'sch_01', templateId: 'tpl_11', name: 'Weekly Security Digest', frequency: 'weekly', nextRun: '2025-01-17T06:00:00', lastRun: '2025-01-10T06:00:00',
    recipients: ['security-team@maziktech.com', 'priya.patel@maziktech.com'], format: 'HTML', enabled: true, createdBy: 'Priya Patel', createdAt: '2024-06-01',
    deliveryMethod: 'email', filters: {},
  },
  {
    id: 'sch_02', templateId: 'tpl_04', name: 'Daily AI Usage Report', frequency: 'daily', nextRun: '2025-01-11T06:00:00', lastRun: '2025-01-10T06:00:00',
    recipients: ['analytics@maziktech.com'], format: 'XLSX', enabled: true, createdBy: 'System', createdAt: '2024-08-15',
    deliveryMethod: 'email', filters: { aiApps: ['ChatGPT', 'Claude', 'Gemini'] },
  },
  {
    id: 'sch_03', templateId: 'tpl_01', name: 'Monthly Executive Summary', frequency: 'monthly', nextRun: '2025-02-01T09:00:00', lastRun: '2025-01-01T09:00:00',
    recipients: ['ciso@maziktech.com', 'cto@maziktech.com', 'ceo@maziktech.com'], format: 'PDF', enabled: true, createdBy: 'Priya Patel', createdAt: '2024-03-01',
    deliveryMethod: 'email', filters: {},
  },
  {
    id: 'sch_04', templateId: 'tpl_06', name: 'Bi-weekly Department Risk Report', frequency: 'biweekly', nextRun: '2025-01-24T08:00:00', lastRun: '2025-01-10T08:00:00',
    recipients: ['security-team@maziktech.com', 'hr@maziktech.com'], format: 'PDF', enabled: true, createdBy: 'Arjun Sharma', createdAt: '2024-09-01',
    deliveryMethod: 'slack', filters: { departments: ['Engineering', 'Data Science', 'Finance'] },
  },
  {
    id: 'sch_05', templateId: 'tpl_03', name: 'Quarterly GDPR Compliance', frequency: 'quarterly', nextRun: '2025-04-01T10:00:00', lastRun: '2025-01-05T10:00:00',
    recipients: ['legal@maziktech.com', 'dpo@maziktech.com', 'compliance@maziktech.com'], format: 'PDF', enabled: true, createdBy: 'Divya Joshi', createdAt: '2024-04-01',
    deliveryMethod: 'email', filters: {},
  },
  {
    id: 'sch_06', templateId: 'tpl_08', name: 'Weekly PII Exposure Summary', frequency: 'weekly', nextRun: '2025-01-17T07:00:00', lastRun: '2025-01-10T07:00:00',
    recipients: ['privacy@maziktech.com'], format: 'PDF', enabled: false, createdBy: 'Sneha Patel', createdAt: '2024-10-01',
    deliveryMethod: 'email', filters: {},
  },
  {
    id: 'sch_07', templateId: 'tpl_10', name: 'Quarterly DPDPA Compliance', frequency: 'quarterly', nextRun: '2025-04-01T10:00:00', lastRun: '2025-01-04T10:00:00',
    recipients: ['legal@maziktech.com', 'compliance@maziktech.com'], format: 'PDF', enabled: true, createdBy: 'Amit Nair', createdAt: '2024-07-01',
    deliveryMethod: 'email', filters: {},
  },
];

export const complianceFrameworks: ComplianceFramework[] = [
  {
    id: 'fw_gdpr', name: 'General Data Protection Regulation', shortName: 'GDPR', description: 'EU regulation on data protection and privacy for individuals within the European Union.',
    status: 'compliant', score: 94, totalControls: 18, passedControls: 17, failedControls: 0, inProgressControls: 1,
    lastAssessment: '2025-01-05', nextAssessment: '2025-04-01',
    controls: [
      { id: 'gdpr_01', name: 'Lawful Basis for Processing', description: 'All AI data processing has documented lawful basis', status: 'passed', severity: 'critical', evidence: 'Processing register updated', lastChecked: '2025-01-05' },
      { id: 'gdpr_02', name: 'Data Minimization', description: 'Only necessary data is processed through AI tools', status: 'passed', severity: 'high', evidence: 'Masking policies active', lastChecked: '2025-01-05' },
      { id: 'gdpr_03', name: 'Right to Erasure', description: 'Users can request deletion of AI interaction logs', status: 'passed', severity: 'high', evidence: 'Deletion workflow implemented', lastChecked: '2025-01-05' },
      { id: 'gdpr_04', name: 'Data Breach Notification', description: '72-hour breach notification process in place', status: 'passed', severity: 'critical', evidence: 'Incident response plan documented', lastChecked: '2025-01-05' },
      { id: 'gdpr_05', name: 'Cross-Border Transfer Controls', description: 'Adequate safeguards for international data transfers', status: 'in_progress', severity: 'medium', evidence: 'SCCs being updated for new AI providers', lastChecked: '2025-01-05' },
    ],
  },
  {
    id: 'fw_dpdpa', name: 'Digital Personal Data Protection Act', shortName: 'DPDPA', description: 'India\'s comprehensive data protection legislation governing digital personal data processing.',
    status: 'compliant', score: 91, totalControls: 15, passedControls: 13, failedControls: 0, inProgressControls: 2,
    lastAssessment: '2025-01-04', nextAssessment: '2025-04-01',
    controls: [
      { id: 'dpdpa_01', name: 'Consent Management', description: 'Valid consent obtained before processing personal data via AI', status: 'passed', severity: 'critical', evidence: 'Consent flow integrated', lastChecked: '2025-01-04' },
      { id: 'dpdpa_02', name: 'Data Principal Rights', description: 'Right to access, correction, and erasure supported', status: 'passed', severity: 'critical', evidence: 'Self-service portal available', lastChecked: '2025-01-04' },
      { id: 'dpdpa_03', name: 'Data Fiduciary Obligations', description: 'Organizational compliance with data fiduciary requirements', status: 'passed', severity: 'high', evidence: 'DPO appointed, policies documented', lastChecked: '2025-01-04' },
      { id: 'dpdpa_04', name: 'Cross-Border Data Transfer', description: 'Personal data only transferred to approved jurisdictions', status: 'in_progress', severity: 'high', evidence: 'Jurisdiction list under government review', lastChecked: '2025-01-04' },
      { id: 'dpdpa_05', name: 'Significant Data Fiduciary Assessment', description: 'Enhanced obligations for significant data fiduciaries', status: 'in_progress', severity: 'medium', evidence: 'Assessment in progress', lastChecked: '2025-01-04' },
    ],
  },
  {
    id: 'fw_soc2', name: 'Service Organization Control 2', shortName: 'SOC 2', description: 'Trust services criteria covering security, availability, processing integrity, confidentiality, and privacy.',
    status: 'compliant', score: 97, totalControls: 22, passedControls: 21, failedControls: 0, inProgressControls: 1,
    lastAssessment: '2024-12-15', nextAssessment: '2025-06-15',
    controls: [
      { id: 'soc2_01', name: 'Access Controls', description: 'Role-based access control for all AI security features', status: 'passed', severity: 'critical', evidence: 'RBAC implemented with 5 roles', lastChecked: '2024-12-15' },
      { id: 'soc2_02', name: 'Encryption at Rest', description: 'All stored data encrypted with AES-256', status: 'passed', severity: 'critical', evidence: 'Database encryption verified', lastChecked: '2024-12-15' },
      { id: 'soc2_03', name: 'Encryption in Transit', description: 'TLS 1.3 for all API communications', status: 'passed', severity: 'critical', evidence: 'Certificate pinning active', lastChecked: '2024-12-15' },
      { id: 'soc2_04', name: 'Audit Logging', description: 'Comprehensive audit trail for all system actions', status: 'passed', severity: 'high', evidence: '48K+ events logged', lastChecked: '2024-12-15' },
      { id: 'soc2_05', name: 'Incident Response', description: 'Documented incident response procedures', status: 'in_progress', severity: 'medium', evidence: 'Updating runbooks for new AI platforms', lastChecked: '2024-12-15' },
    ],
  },
  {
    id: 'fw_iso27001', name: 'ISO/IEC 27001:2022', shortName: 'ISO 27001', description: 'International standard for information security management systems (ISMS).',
    status: 'partial', score: 82, totalControls: 20, passedControls: 16, failedControls: 1, inProgressControls: 3,
    lastAssessment: '2024-11-30', nextAssessment: '2025-05-30',
    controls: [
      { id: 'iso_01', name: 'Information Security Policy', description: 'AI security policy documented and communicated', status: 'passed', severity: 'critical', evidence: 'Policy v3.2 published', lastChecked: '2024-11-30' },
      { id: 'iso_02', name: 'Asset Management', description: 'AI tool inventory and classification', status: 'passed', severity: 'high', evidence: '10 AI apps catalogued', lastChecked: '2024-11-30' },
      { id: 'iso_03', name: 'Supplier Relationships', description: 'Security assessments for AI vendors', status: 'in_progress', severity: 'high', evidence: 'Vendor assessments 70% complete', lastChecked: '2024-11-30' },
      { id: 'iso_04', name: 'Business Continuity', description: 'AI security platform HA and DR planning', status: 'failed', severity: 'medium', evidence: 'DR site not yet configured', lastChecked: '2024-11-30' },
      { id: 'iso_05', name: 'Performance Evaluation', description: 'Regular measurement and monitoring of ISMS', status: 'in_progress', severity: 'low', evidence: 'KPI framework being defined', lastChecked: '2024-11-30' },
    ],
  },
  {
    id: 'fw_hipaa', name: 'Health Insurance Portability and Accountability Act', shortName: 'HIPAA', description: 'US regulation for protecting sensitive patient health information from disclosure.',
    status: 'non_compliant', score: 45, totalControls: 12, passedControls: 5, failedControls: 4, inProgressControls: 3,
    lastAssessment: '2024-10-15', nextAssessment: '2025-01-30',
    controls: [
      { id: 'hipaa_01', name: 'PHI Detection', description: 'Detection of Protected Health Information in AI prompts', status: 'in_progress', severity: 'critical', evidence: 'PHI entity type being added to detection engine', lastChecked: '2024-10-15' },
      { id: 'hipaa_02', name: 'Minimum Necessary Standard', description: 'Ensure only minimum PHI is shared with AI', status: 'failed', severity: 'critical', evidence: 'PHI-specific masking rules not yet configured', lastChecked: '2024-10-15' },
      { id: 'hipaa_03', name: 'Business Associate Agreements', description: 'BAAs with AI platform vendors', status: 'failed', severity: 'high', evidence: 'BAA negotiations pending with 3 vendors', lastChecked: '2024-10-15' },
      { id: 'hipaa_04', name: 'Audit Controls', description: 'PHI-specific audit trail', status: 'passed', severity: 'high', evidence: 'General audit logging covers PHI events', lastChecked: '2024-10-15' },
      { id: 'hipaa_05', name: 'Breach Notification', description: '60-day breach notification for PHI', status: 'in_progress', severity: 'critical', evidence: 'Notification workflow being configured', lastChecked: '2024-10-15' },
    ],
  },
];

export const reportMetrics = {
  totalGenerated: 156,
  thisMonth: 24,
  scheduled: 7,
  complianceScore: 89,
  templatesAvailable: 12,
  avgGenerationTime: '3m 42s',
};
