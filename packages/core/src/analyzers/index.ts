// Analysis modules will be implemented in Phase A3
export * from './complexity';
export * from './security';
export * from './performance';

// Placeholder exports for now
export interface ComplexityAnalyzer {
  analyzeComplexity(content: string): Promise<number>;
}

export interface SecurityAnalyzer {
  detectSecurityIssues(content: string): Promise<any[]>;
}

export interface PerformanceAnalyzer {
  detectPerformanceIssues(content: string): Promise<any[]>;
}
