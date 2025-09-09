import { BaseEntity, Language } from './common';

export interface Repository extends BaseEntity {
  name: string;
  owner: string;
  url: string;
  description?: string;
  primaryLanguage: Language;
  languages: LanguageStats[];
  size: number; // in bytes
  starCount?: number;
  forkCount?: number;
  lastCommitAt?: Date;
  analyzedAt?: Date;
  isPrivate: boolean;
  defaultBranch: string;
  metrics?: RepositoryMetrics;
}

export interface LanguageStats {
  language: Language;
  percentage: number;
  bytes: number;
}

export interface RepositoryMetrics {
  totalFiles: number;
  totalLines: number;
  totalComplexity: number;
  averageComplexity: number;
  technicalDebtRatio: number;
  testCoverage?: number;
  securityScore: number;
  maintainabilityIndex: number;
  duplicationPercentage: number;
}

export interface FileInfo {
  path: string;
  language: Language;
  size: number;
  lines: number;
  complexity: number;
  lastModified: Date;
}
