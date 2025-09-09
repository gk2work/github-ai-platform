import { BaseEntity, Severity, AnalysisCategory, FileLocation, Language } from './common';

export interface AnalysisResult extends BaseEntity {
  repositoryId: string;
  type: AnalysisType;
  category: AnalysisCategory;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  location: FileLocation;
  confidence: number; // 0-1
  impact: ImpactLevel;
  effort: EffortLevel;
  tags: string[];
  relatedResults?: string[]; // IDs of related analysis results
}

export type AnalysisType = 
  | 'code_smell'
  | 'security_vulnerability'
  | 'performance_issue'
  | 'complexity_warning'
  | 'duplication_detected'
  | 'test_gap'
  | 'documentation_missing'
  | 'dependency_issue'
  | 'architecture_violation';

export type ImpactLevel = 'low' | 'medium' | 'high';
export type EffortLevel = 'trivial' | 'easy' | 'medium' | 'hard';

export interface AnalysisReport extends BaseEntity {
  repositoryId: string;
  results: AnalysisResult[];
  summary: AnalysisSummary;
  executionTime: number; // in milliseconds
  analyzedFiles: number;
  skippedFiles: number;
  errors: AnalysisError[];
}

export interface AnalysisSummary {
  totalIssues: number;
  issuesByCategory: Record<AnalysisCategory, number>;
  issuesBySeverity: Record<Severity, number>;
  overallScore: number; // 0-100
  recommendations: string[];
}

export interface AnalysisError {
  file: string;
  error: string;
  type: 'parse_error' | 'analysis_error' | 'timeout';
}

export interface AnalysisConfig {
  languages: Language[];
  categories: AnalysisCategory[];
  excludePatterns: string[];
  includePatterns?: string[];
  maxFileSize: number; // in bytes
  timeout: number; // in milliseconds
  enableAI: boolean;
  customRules?: CustomRule[];
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  pattern: string; // regex or AST pattern
  category: AnalysisCategory;
  severity: Severity;
  message: string;
}
