import { BaseEntity, AnalysisCategory } from './common';

export interface AIInsight extends BaseEntity {
  repositoryId: string;
  query: string;
  response: string;
  confidence: number;
  category?: AnalysisCategory;
  context: string[]; // Related file paths or code snippets
  feedback?: UserFeedback;
}

export interface UserFeedback {
  helpful: boolean;
  rating?: number; // 1-5
  comment?: string;
  userId?: string;
}

export interface AIAnalysisRequest {
  repositoryId: string;
  codeSnippet: string;
  context: {
    file: string;
    language: string;
    surroundingCode?: string;
    relatedFiles?: string[];
  };
  analysisType: AIAnalysisType;
  userQuery?: string;
}

export type AIAnalysisType = 
  | 'explain_code'
  | 'suggest_improvement'
  | 'security_review'
  | 'performance_optimization'
  | 'refactoring_suggestion'
  | 'documentation_generation'
  | 'test_generation';

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning: string;
  suggestions: AISuggestion[];
  relatedInsights: string[];
}

export interface AISuggestion {
  title: string;
  description: string;
  code?: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}
