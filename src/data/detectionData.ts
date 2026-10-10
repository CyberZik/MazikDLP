export interface DetectionPattern {
  id: string;
  name: string;
  pattern: string;
  type: 'regex' | 'keyword' | 'ml';
  description: string;
  enabled: boolean;
  examples: string[];
  falsePositiveRate: number;
}

export interface DetectionModule {
  id: string;
  name: string;
  description: string;
  category: 'pii' | 'indian_pii' | 'credentials' | 'code' | 'secrets' | 'database' | 'custom';
  icon: string;
  enabled: boolean;
  detectionMethod: ('regex' | 'ml' | 'keyword')[];
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  entityTypes: string[];
  patterns: DetectionPattern[];
  stats: {
    totalDetections: number;
    last24h: number;
    last7d: number;
    last30d: number;
    accuracy: number;
    falsePositiveRate: number;
    avgResponseTime: number;
  };
  config: {
    threshold: number;
    contextWindow: number;
    allowList: string[];
    denyList: string[];
  };
  lastUpdated: string;
  version: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  order: number;
  moduleId: string;
  enabled: boolean;
  avgTimeMs: number;
}

export const pipelineStages: PipelineStage[] = [
  { id: 'ps-1', name: 'Input Preprocessing', description: 'Text normalization, encoding detection, and tokenization', order: 1, moduleId: 'preprocessing', enabled: true, avgTimeMs: 2 },
  { id: 'ps-2', name: 'Secrets Detection', description: 'Detect API keys, tokens, and hardcoded secrets', order: 2, moduleId: 'mod-secrets', enabled: true, avgTimeMs: 5 },
  { id: 'ps-3', name: 'Credential Detection', description: 'Detect passwords, connection strings, auth tokens', order: 3, moduleId: 'mod-credentials', enabled: true, avgTimeMs: 4 },
  { id: 'ps-4', name: 'Source Code Detection', description: 'Detect code snippets, functions, and proprietary logic', order: 4, moduleId: 'mod-code', enabled: true, avgTimeMs: 8 },
  { id: 'ps-5', name: 'Database Schema Detection', description: 'Detect SQL queries, schema definitions, table structures', order: 5, moduleId: 'mod-database', enabled: true, avgTimeMs: 3 },
  { id: 'ps-6', name: 'PII Detection (Presidio)', description: 'Microsoft Presidio-powered PII entity recognition', order: 6, moduleId: 'mod-pii', enabled: true, avgTimeMs: 15 },
  { id: 'ps-7', name: 'Indian PII Detection', description: 'PAN, Aadhaar, GSTIN, IFSC, and other Indian identifiers', order: 7, moduleId: 'mod-indian-pii', enabled: true, avgTimeMs: 6 },
  { id: 'ps-8', name: 'Custom Pattern Matching', description: 'Enterprise-defined custom patterns and keywords', order: 8, moduleId: 'mod-custom', enabled: true, avgTimeMs: 4 },
  { id: 'ps-9', name: 'Policy Evaluation', description: 'Match detections against active enterprise policies', order: 9, moduleId: 'policy-engine', enabled: true, avgTimeMs: 3 },
];

export const detectionModules: DetectionModule[] = [
  {
    id: 'mod-pii',
    name: 'PII Detection',
    description: 'Detects personally identifiable information using Microsoft Presidio NLP engine. Includes email addresses, phone numbers, credit card numbers, person names, and more.',
    category: 'pii',
    icon: 'User',
    enabled: true,
    detectionMethod: ['ml', 'regex'],
    sensitivity: 'high',
    entityTypes: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD', 'PERSON', 'LOCATION', 'DATE_TIME', 'NRP', 'IP_ADDRESS', 'URL'],
    patterns: [
      { id: 'pat-1', name: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', type: 'regex', description: 'Standard email format detection', enabled: true, examples: ['user@example.com', 'john.doe@company.co.in'], falsePositiveRate: 0.02 },
      { id: 'pat-2', name: 'Phone Number', pattern: '(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', type: 'regex', description: 'US/International phone number patterns', enabled: true, examples: ['+1-555-123-4567', '(555) 123-4567'], falsePositiveRate: 0.05 },
      { id: 'pat-3', name: 'Credit Card', pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b', type: 'regex', description: 'Visa, Mastercard, Amex detection', enabled: true, examples: ['4111111111111111', '5500000000000004'], falsePositiveRate: 0.01 },
      { id: 'pat-4', name: 'Person Name', pattern: 'NLP-based entity recognition', type: 'ml', description: 'ML-powered name recognition via spaCy NER', enabled: true, examples: ['John Smith', 'Priya Sharma'], falsePositiveRate: 0.08 },
      { id: 'pat-5', name: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', type: 'regex', description: 'IPv4 address detection', enabled: true, examples: ['192.168.1.1', '10.0.0.255'], falsePositiveRate: 0.03 },
    ],
    stats: { totalDetections: 14523, last24h: 187, last7d: 1245, last30d: 5430, accuracy: 96.8, falsePositiveRate: 2.1, avgResponseTime: 15 },
    config: { threshold: 0.7, contextWindow: 100, allowList: ['noreply@company.com', 'support@company.com'], denyList: [] },
    lastUpdated: '2025-01-14T10:30:00Z',
    version: '3.2.1',
  },
  {
    id: 'mod-indian-pii',
    name: 'Indian PII Detection',
    description: 'Specialized detection for Indian personal and financial identifiers including PAN, Aadhaar, GSTIN, IFSC codes, Passport, Voter ID, Driving License, UPI IDs, Mobile Numbers, CIN, and more.',
    category: 'indian_pii',
    icon: 'MapPin',
    enabled: true,
    detectionMethod: ['regex'],
    sensitivity: 'critical',
    entityTypes: ['IN_PAN', 'IN_AADHAAR', 'IN_GSTIN', 'IN_IFSC', 'IN_PHONE_NUMBER', 'IN_PASSPORT', 'IN_VOTER_ID', 'IN_DRIVING_LICENSE', 'IN_UPI_ID', 'IN_PIN_CODE', 'IN_VEHICLE_REG', 'IN_UAN', 'IN_PRAN', 'IN_CIN', 'IN_BANK_ACCOUNT'],
    patterns: [
      { id: 'pat-6', name: 'PAN Number', pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}', type: 'regex', description: 'Indian Permanent Account Number', enabled: true, examples: ['ABCDE1234F', 'BNZPM2501F'], falsePositiveRate: 0.01 },
      { id: 'pat-7', name: 'Aadhaar Number', pattern: '[2-9]{1}[0-9]{3}\\s[0-9]{4}\\s[0-9]{4}', type: 'regex', description: 'Indian Aadhaar 12-digit UID', enabled: true, examples: ['2345 6789 0123', '9876 5432 1098'], falsePositiveRate: 0.02 },
      { id: 'pat-8', name: 'GSTIN', pattern: '[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}', type: 'regex', description: 'Indian GST Identification Number', enabled: true, examples: ['22AAAAA0000A1Z5', '07AAGCE0000A1Z1'], falsePositiveRate: 0.01 },
      { id: 'pat-9', name: 'IFSC Code', pattern: '[A-Z]{4}0[A-Z0-9]{6}', type: 'regex', description: 'Indian Financial System Code', enabled: true, examples: ['SBIN0001234', 'HDFC0000001'], falsePositiveRate: 0.03 },
      { id: 'pat-10', name: 'Indian Mobile', pattern: '(\\+91[\\s-]?)?[6-9]\\d{9}', type: 'regex', description: 'Indian mobile number (+91 prefix optional)', enabled: true, examples: ['+91 98765 43210', '9876543210'], falsePositiveRate: 0.04 },
      { id: 'pat-33', name: 'Passport (India)', pattern: '[A-Z][0-9]{7}', type: 'regex', description: 'Indian passport number', enabled: true, examples: ['A1234567', 'J9876543'], falsePositiveRate: 0.05 },
      { id: 'pat-34', name: 'Voter ID (EPIC)', pattern: '[A-Z]{3}[0-9]{7}', type: 'regex', description: 'Indian voter ID / EPIC number', enabled: true, examples: ['ABC1234567', 'XYZ9876543'], falsePositiveRate: 0.03 },
      { id: 'pat-35', name: 'Driving License', pattern: '[A-Z]{2}[ -]?\\d{2}[ -]?\\d{4}[ -]?\\d{7}', type: 'regex', description: 'Indian driving license number', enabled: true, examples: ['MH-12-2024-0001234', 'DL14 2019 0001234'], falsePositiveRate: 0.02 },
      { id: 'pat-36', name: 'UPI ID / VPA', pattern: '[a-zA-Z0-9.\\-_]+@[a-zA-Z]+', type: 'regex', description: 'Unified Payment Interface identifier', enabled: true, examples: ['user@okaxis', 'name@paytm'], falsePositiveRate: 0.06 },
      { id: 'pat-37', name: 'PIN Code', pattern: '[1-9][0-9]{5}', type: 'regex', description: 'Indian postal PIN code (6 digits)', enabled: true, examples: ['400001', '110001'], falsePositiveRate: 0.15 },
      { id: 'pat-38', name: 'Vehicle Registration', pattern: '[A-Z]{2}[ -]?\\d{1,2}[ -]?[A-Z]{1,3}[ -]?\\d{4}', type: 'regex', description: 'Indian vehicle registration plate', enabled: true, examples: ['MH-01-AB-1234', 'DL 4C 1234'], falsePositiveRate: 0.04 },
      { id: 'pat-39', name: 'UAN (EPFO)', pattern: '\\d{12}', type: 'regex', description: 'Universal Account Number (EPFO)', enabled: true, examples: ['100123456789', '200987654321'], falsePositiveRate: 0.12 },
      { id: 'pat-40', name: 'PRAN (NPS)', pattern: '\\d{12}', type: 'regex', description: 'Permanent Retirement Account Number (NPS)', enabled: true, examples: ['110012345678', '220098765432'], falsePositiveRate: 0.12 },
      { id: 'pat-41', name: 'CIN (Company ID)', pattern: '[LU]\\d{5}[A-Z]{2}\\d{4}[A-Z]{3}\\d{6}', type: 'regex', description: 'Corporate Identity Number (MCA)', enabled: true, examples: ['L21091KA2019PLC123456', 'U74999MH2020PTC345678'], falsePositiveRate: 0.01 },
      { id: 'pat-42', name: 'Bank Account No.', pattern: '\\d{9,18}', type: 'regex', description: 'Indian bank account number (9-18 digits)', enabled: true, examples: ['123456789012', '9876543210123456'], falsePositiveRate: 0.18 },
    ],
    stats: { totalDetections: 12450, last24h: 187, last7d: 1245, last30d: 4890, accuracy: 97.5, falsePositiveRate: 1.8, avgResponseTime: 6 },
    config: { threshold: 0.85, contextWindow: 50, allowList: [], denyList: [] },
    lastUpdated: '2025-01-14T09:15:00Z',
    version: '3.0.0',
  },
  {
    id: 'mod-credentials',
    name: 'Credential Detection',
    description: 'Detects passwords, connection strings, authentication tokens, and other credential patterns that could be leaked to AI platforms.',
    category: 'credentials',
    icon: 'KeyRound',
    enabled: true,
    detectionMethod: ['regex', 'keyword'],
    sensitivity: 'critical',
    entityTypes: ['CREDENTIAL', 'PASSWORD', 'CONNECTION_STRING', 'AUTH_TOKEN', 'BEARER_TOKEN'],
    patterns: [
      { id: 'pat-11', name: 'Password Assignment', pattern: '(?:password|passwd|pwd)\\s*[:=]\\s*["\']?\\S+', type: 'regex', description: 'Password variable assignments', enabled: true, examples: ['password = "MySecret123"', "pwd: 's3cur3!'"], falsePositiveRate: 0.04 },
      { id: 'pat-12', name: 'Connection String', pattern: '(?:mongodb|mysql|postgres|redis)://[\\S]+', type: 'regex', description: 'Database connection URI patterns', enabled: true, examples: ['mongodb://user:pass@host:27017/db', 'postgres://admin:pwd@localhost/mydb'], falsePositiveRate: 0.01 },
      { id: 'pat-13', name: 'Bearer Token', pattern: 'Bearer\\s+[A-Za-z0-9\\-._~+/]+=*', type: 'regex', description: 'OAuth Bearer token patterns', enabled: true, examples: ['Bearer eyJhbGciOiJIUzI1NiJ9...'], falsePositiveRate: 0.02 },
      { id: 'pat-14', name: 'JWT Token', pattern: 'eyJ[A-Za-z0-9-_]+\\.eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+', type: 'regex', description: 'JSON Web Token format', enabled: true, examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'], falsePositiveRate: 0.01 },
    ],
    stats: { totalDetections: 3456, last24h: 42, last7d: 312, last30d: 1290, accuracy: 97.5, falsePositiveRate: 1.8, avgResponseTime: 4 },
    config: { threshold: 0.8, contextWindow: 80, allowList: [], denyList: [] },
    lastUpdated: '2025-01-13T16:45:00Z',
    version: '2.4.0',
  },
  {
    id: 'mod-code',
    name: 'Source Code Detection',
    description: 'Detects source code snippets, function definitions, class structures, and proprietary logic being pasted into AI prompts.',
    category: 'code',
    icon: 'Code',
    enabled: true,
    detectionMethod: ['regex', 'keyword', 'ml'],
    sensitivity: 'high',
    entityTypes: ['SOURCE_CODE', 'FUNCTION_DEF', 'CLASS_DEF', 'IMPORT_STATEMENT', 'CODE_BLOCK'],
    patterns: [
      { id: 'pat-15', name: 'Function Definition', pattern: '(?:def|function|const|var|let)\\s+\\w+\\s*\\(', type: 'regex', description: 'Python/JS/TS function declarations', enabled: true, examples: ['def process_data(input):', 'function handleClick() {'], falsePositiveRate: 0.06 },
      { id: 'pat-16', name: 'Class Definition', pattern: '(?:class)\\s+\\w+(?:\\s*\\(|\\s*{|\\s*:)', type: 'regex', description: 'Class declarations in common languages', enabled: true, examples: ['class UserService:', 'class PaymentHandler {'], falsePositiveRate: 0.03 },
      { id: 'pat-17', name: 'Import Statement', pattern: '(?:import|from|require|include)\\s+[\\w.*{}\\s,]+', type: 'regex', description: 'Module import patterns', enabled: true, examples: ['import pandas as pd', "from utils import helper", "const fs = require('fs')"], falsePositiveRate: 0.04 },
      { id: 'pat-18', name: 'Code Block', pattern: '```[\\s\\S]*?```', type: 'regex', description: 'Markdown-fenced code blocks', enabled: true, examples: ['```python\nprint("hello")\n```'], falsePositiveRate: 0.02 },
    ],
    stats: { totalDetections: 6782, last24h: 98, last7d: 645, last30d: 2810, accuracy: 94.3, falsePositiveRate: 3.2, avgResponseTime: 8 },
    config: { threshold: 0.65, contextWindow: 200, allowList: ['console.log', 'print'], denyList: [] },
    lastUpdated: '2025-01-14T08:20:00Z',
    version: '1.8.3',
  },
  {
    id: 'mod-secrets',
    name: 'API Keys & Secrets',
    description: 'Detects API keys, secret tokens, private keys, and other hardcoded secrets from various cloud providers and services.',
    category: 'secrets',
    icon: 'Lock',
    enabled: true,
    detectionMethod: ['regex'],
    sensitivity: 'critical',
    entityTypes: ['API_KEY', 'AWS_KEY', 'AZURE_KEY', 'GCP_KEY', 'PRIVATE_KEY', 'GITHUB_TOKEN', 'SLACK_TOKEN', 'STRIPE_KEY'],
    patterns: [
      { id: 'pat-19', name: 'AWS Access Key', pattern: 'AKIA[0-9A-Z]{16}', type: 'regex', description: 'AWS IAM access key ID', enabled: true, examples: ['AKIAIOSFODNN7EXAMPLE'], falsePositiveRate: 0.01 },
      { id: 'pat-20', name: 'GitHub Token', pattern: 'gh[ps]_[A-Za-z0-9_]{36,}', type: 'regex', description: 'GitHub personal access / service tokens', enabled: true, examples: ['ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef12'], falsePositiveRate: 0.01 },
      { id: 'pat-21', name: 'Stripe Key', pattern: 'sk_live_[0-9a-zA-Z]{24,}', type: 'regex', description: 'Stripe live secret key', enabled: true, examples: ['sk_live_REDACTED_DEMO_VALUE'], falsePositiveRate: 0.01 },
      { id: 'pat-22', name: 'Private Key Block', pattern: '-----BEGIN (?:RSA |EC )?PRIVATE KEY-----', type: 'regex', description: 'PEM-encoded private key header', enabled: true, examples: ['-----BEGIN RSA PRIVATE KEY-----'], falsePositiveRate: 0.01 },
      { id: 'pat-23', name: 'Slack Token', pattern: 'xox[baprs]-[0-9A-Za-z\\-]+', type: 'regex', description: 'Slack bot/user/app tokens', enabled: true, examples: ['xoxb-1234-5678-abcdefghij'], falsePositiveRate: 0.01 },
      { id: 'pat-24', name: 'Generic API Key', pattern: '(?:api[_-]?key|apikey)\\s*[:=]\\s*["\']?[A-Za-z0-9\\-_]{20,}', type: 'regex', description: 'Generic API key assignments', enabled: true, examples: ['api_key = "abcdef1234567890abcdef"'], falsePositiveRate: 0.05 },
    ],
    stats: { totalDetections: 2134, last24h: 28, last7d: 198, last30d: 876, accuracy: 99.1, falsePositiveRate: 0.8, avgResponseTime: 5 },
    config: { threshold: 0.9, contextWindow: 60, allowList: [], denyList: [] },
    lastUpdated: '2025-01-14T11:00:00Z',
    version: '3.0.2',
  },
  {
    id: 'mod-database',
    name: 'Database Schema Detection',
    description: 'Detects SQL queries, database schema definitions, table structures, and sensitive database operations that might expose internal architecture.',
    category: 'database',
    icon: 'Database',
    enabled: true,
    detectionMethod: ['regex', 'keyword'],
    sensitivity: 'high',
    entityTypes: ['SQL_QUERY', 'CREATE_TABLE', 'DB_SCHEMA', 'TABLE_REFERENCE', 'STORED_PROCEDURE'],
    patterns: [
      { id: 'pat-25', name: 'CREATE TABLE', pattern: 'CREATE\\s+TABLE\\s+[\\w.`"]+', type: 'regex', description: 'SQL CREATE TABLE statements', enabled: true, examples: ['CREATE TABLE users (id INT PRIMARY KEY)', 'CREATE TABLE orders.payments'], falsePositiveRate: 0.01 },
      { id: 'pat-26', name: 'SQL Query', pattern: '(?:SELECT|INSERT|UPDATE|DELETE)\\s+.*?(?:FROM|INTO|SET)\\s+[\\w.`"]+', type: 'regex', description: 'DML SQL operations', enabled: true, examples: ['SELECT * FROM customers WHERE id = 1', 'INSERT INTO logs VALUES (...)'], falsePositiveRate: 0.03 },
      { id: 'pat-27', name: 'ALTER TABLE', pattern: 'ALTER\\s+TABLE\\s+[\\w.`"]+', type: 'regex', description: 'Schema modification statements', enabled: true, examples: ['ALTER TABLE users ADD COLUMN email VARCHAR(255)'], falsePositiveRate: 0.01 },
      { id: 'pat-28', name: 'Stored Procedure', pattern: 'CREATE\\s+(?:OR REPLACE\\s+)?PROCEDURE\\s+[\\w.]+', type: 'regex', description: 'Stored procedure definitions', enabled: true, examples: ['CREATE PROCEDURE sp_get_user'], falsePositiveRate: 0.01 },
    ],
    stats: { totalDetections: 1567, last24h: 19, last7d: 145, last30d: 612, accuracy: 97.8, falsePositiveRate: 1.5, avgResponseTime: 3 },
    config: { threshold: 0.75, contextWindow: 150, allowList: ['SELECT 1', 'SELECT NOW()'], denyList: [] },
    lastUpdated: '2025-01-13T14:30:00Z',
    version: '1.5.0',
  },
  {
    id: 'mod-custom',
    name: 'Custom Enterprise Patterns',
    description: 'Enterprise-defined custom detection patterns for internal project names, proprietary identifiers, customer codes, and other organization-specific sensitive data.',
    category: 'custom',
    icon: 'Fingerprint',
    enabled: true,
    detectionMethod: ['regex', 'keyword'],
    sensitivity: 'medium',
    entityTypes: ['CUSTOM_SECRET', 'INTERNAL_PROJECT', 'CUSTOMER_ID', 'INTERNAL_URL', 'PROPRIETARY_TERM'],
    patterns: [
      { id: 'pat-29', name: 'Internal Project Code', pattern: 'PRJ-[A-Z]{2,4}-\\d{3,5}', type: 'regex', description: 'Internal project identifier format', enabled: true, examples: ['PRJ-ML-0042', 'PRJ-SEC-12345'], falsePositiveRate: 0.02 },
      { id: 'pat-30', name: 'Customer ID', pattern: 'CUST-[0-9]{6,8}', type: 'regex', description: 'Customer account identifier', enabled: true, examples: ['CUST-00012345', 'CUST-987654'], falsePositiveRate: 0.01 },
      { id: 'pat-31', name: 'Internal Domain', pattern: '(?:https?://)?[\\w.-]+\\.internal\\.company\\.com', type: 'regex', description: 'Internal infrastructure URLs', enabled: true, examples: ['https://api.internal.company.com', 'jenkins.internal.company.com'], falsePositiveRate: 0.01 },
      { id: 'pat-32', name: 'Proprietary Keywords', pattern: '', type: 'keyword', description: 'Custom keyword list for proprietary terms', enabled: true, examples: ['Project Phoenix', 'Operation Mantis'], falsePositiveRate: 0.04 },
    ],
    stats: { totalDetections: 945, last24h: 12, last7d: 89, last30d: 378, accuracy: 95.6, falsePositiveRate: 2.4, avgResponseTime: 4 },
    config: { threshold: 0.7, contextWindow: 100, allowList: [], denyList: ['Project Phoenix', 'Mantis Protocol', 'BlueShield Initiative'] },
    lastUpdated: '2025-01-14T07:45:00Z',
    version: '1.2.1',
  },
];

export interface TestResult {
  entityType: string;
  value: string;
  start: number;
  end: number;
  score: number;
  module: string;
}

export const testSamples = [
  { label: 'PII - Email & Phone', text: 'Please contact John Smith at john.smith@company.com or call +91-9876543210 for more details.' },
  { label: 'Indian PII - PAN & Aadhaar', text: 'My PAN number is ABCDE1234F and Aadhaar is 2345 6789 0123. Please verify.' },
  { label: 'Credentials', text: 'The database password is SuperSecret123! and the connection string is mongodb://admin:pass@prod-db:27017/users' },
  { label: 'API Keys', text: 'Use this AWS key: AKIAIOSFODNN7EXAMPLE and GitHub token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef12' },
  { label: 'Source Code', text: 'def process_payment(amount, card_number):\n    stripe.Charge.create(amount=amount, source=card_number)\n    return {"status": "success"}' },
  { label: 'Database Schema', text: 'CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(255), ssn VARCHAR(11), credit_card VARCHAR(19));' },
  { label: 'GSTIN & IFSC', text: 'Our company GSTIN is 22AAAAA0000A1Z5 and the IFSC code for our bank is SBIN0001234.' },
  { label: 'Passport & Voter ID', text: 'My passport number is A1234567 and voter ID is ABC1234567. Please verify identity.' },
  { label: 'DL & Vehicle', text: 'Driving license: MH-12-2024-0001234, vehicle registration: MH-01-AB-1234.' },
  { label: 'UPI & Bank', text: 'Send payment to rahul.sharma@okaxis, bank account 1234567890123456, IFSC HDFC0001234.' },
  { label: 'CIN & UAN', text: 'Company CIN: L21091KA2019PLC123456. Employee UAN: 100123456789.' },
  { label: 'Mixed Sensitive', text: 'Hi, I am Rahul (PAN: BNZPM2501F). Send payment to rahul@okicici. The API key is api_key="sk_live_REDACTED_DEMO_VALUE".' },
  { label: 'Clean Text', text: 'Can you help me write a summary of the quarterly business review meeting notes from last Tuesday?' },
  { label: 'Private Key', text: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA2Z3qX2BTLS4e...\n-----END RSA PRIVATE KEY-----' },
];

export const detectionHistory = [
  { time: '14:32:05', user: 'rahul.sharma@corp.com', module: 'Indian PII', entity: 'IN_PAN', action: 'BLOCKED', text: '***PAN***' },
  { time: '14:31:42', user: 'priya.patel@corp.com', module: 'PII Detection', entity: 'EMAIL_ADDRESS', action: 'MASKED', text: '***EMAIL***' },
  { time: '14:30:18', user: 'amit.kumar@corp.com', module: 'Source Code', entity: 'SOURCE_CODE', action: 'BLOCKED', text: '***CODE***' },
  { time: '14:29:55', user: 'neha.gupta@corp.com', module: 'Credentials', entity: 'CREDENTIAL', action: 'BLOCKED', text: '***CRED***' },
  { time: '14:28:30', user: 'vikram.singh@corp.com', module: 'API Keys', entity: 'AWS_KEY', action: 'BLOCKED', text: '***KEY***' },
];
