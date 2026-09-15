export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'EDITOR'
  | 'SALES'
  | 'CONTENT_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  lastLoginAt: string;
  createdAt?: string;
}

export interface PasswordResetResponse {
  resetToken?: string;
  resetLink: string;
  expiresInMinutes?: number;
  expiresAt?: string;
}

export interface UsersResponseData {
  users: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  slug: string;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  audienceId: string;
  productTypeId: string;
  shortDescription: string;
  technicalSummary: string;
  specifications: Record<string, string>;
  standardCertifications: string[];
  voltageRating?: string;
  currentRating?: string;
  ipRating?: string;
  featured: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  mainImage: string;
  documents: { title: string; url: string; type: 'CAD' | 'PDF' | 'MANUAL' }[];
  updatedAt: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  logo: string;
  website: string;
  tier: 'PROPRIETARY' | 'PARTNER' | 'AUTHORIZED_DISTRIBUTOR';
  description: string;
  active: boolean;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  audienceId: string;
  description: string;
  iconName: string;
  order: number;
  active: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  description: string;
  active: boolean;
}

export interface Audience {
  id: string;
  name: string;
  code: string;
  description: string;
  sector: string;
  active: boolean;
}

export interface ProductType {
  id: string;
  name: string;
  code: string;
  description: string;
  requiresCustomEngineering: boolean;
  active: boolean;
}

export interface Enquiry {
  id: string;
  referenceNumber: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  type: 'RFP_RFQ' | 'TECHNICAL_SPECIFICATION' | 'SPARE_PARTS' | 'EPC_CONSULTATION';
  subject: string;
  projectBudgetEstimate?: string;
  status: 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'CLOSED';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  internalNotes: { id: string; author: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteHeroSlide {
  id: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  badge: string;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface Solution {
  id: string;
  title: string;
  slug: string;
  sector: string;
  summary: string;
  deliverables: string[];
  keySpecs: Record<string, string>;
  featured: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  updatedAt: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  overview: string;
  complianceStandards: string[];
  active: boolean;
  caseCount: number;
}

export interface Story {
  id: string;
  title: string;
  category: 'CASE_STUDY' | 'WHITEPAPER' | 'CORPORATE_NEWS' | 'ENGINEERING_INSIGHT';
  readTime: string;
  publishDate: string;
  excerpt: string;
  content: string;
  author: string;
  status: 'PUBLISHED' | 'DRAFT';
}

export interface Project {
  id: string;
  title: string;
  client: string;
  location: string;
  capacityValue: string;
  completionYear: string;
  scopeSummary: string;
  technologiesUsed: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'COMMISSIONING';
}

export interface WebsiteContentBlock {
  id: string;
  key: string;
  section: string;
  title: string;
  content: string;
  lastModifiedBy: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'CATALOGUE_CAD' | 'PDF_SPEC' | 'CERTIFICATE' | 'PRODUCT_IMAGE' | 'CORPORATE_ASSET';
  url: string;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
}

export interface SeoConfig {
  id: string;
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  sitemapPriority: number;
  indexingDirective: 'INDEX_FOLLOW' | 'NOINDEX_FOLLOW' | 'INDEX_NOFOLLOW';
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  ipAddress: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE' | 'CONFIG_UPDATE';
  module: string;
  resourceId: string;
  details: string;
  diffSummary?: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  category: 'GENERAL' | 'SECURITY' | 'INTEGRATION' | 'EMAIL_NOTIFICATIONS';
  key: string;
  label: string;
  value: string;
  type: 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON';
  isSensitive: boolean;
  description: string;
  updatedAt: string;
}

export interface DiagnosticMetrics {
  databaseEngine: string;
  version: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OPTIMIZING';
  activeConnections: number;
  maxConnections: number;
  poolIdle: number;
  poolWaiting: number;
  cacheHitRatio: number;
  transactionCommitRate: number;
  tableStats: {
    tableName: string;
    rowCount: number;
    sizeKb: number;
    lastVacuum: string;
  }[];
  migrations: {
    migrationName: string;
    appliedAt: string;
    checksum: string;
    status: 'APPLIED' | 'PENDING';
  }[];
  uptimeSeconds: number;
  lastHealthCheck: string;
}

export type ModulePermissionKey =
  | 'system_settings'
  | 'user_management'
  | 'audit_logs'
  | 'database_diagnostics'
  | 'catalogue_management'
  | 'brand_management'
  | 'product_management'
  | 'website_content'
  | 'enquiries'
  | 'admin_dashboard';
