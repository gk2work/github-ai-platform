// packages/core/src/utils/analysis-utils.ts

import { AnalysisResult, Severity, AnalysisCategory } from '@github-ai/shared';

export interface CodeMetrics {
  linesOfCode: number;
  linesOfComments: number;
  blankLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
  parameters: number;
}

/**
 * Calculate basic code metrics from content
 */
export function calculateCodeMetrics(content: string): CodeMetrics {
  const lines = content.split('\n');
  let linesOfCode = 0;
  let linesOfComments = 0;
  let blankLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      blankLines++;
    } else if (isCommentLine(trimmed)) {
      linesOfComments++;
    } else {
      linesOfCode++;
    }
  }

  // Basic complexity calculation (will be enhanced with AST parsing)
  const cyclomaticComplexity = calculateBasicComplexity(content);
  const cognitiveComplexity = calculateCognitiveComplexity(content);
  const maintainabilityIndex = calculateMaintainabilityIndex(linesOfCode, cyclomaticComplexity);

  return {
    linesOfCode,
    linesOfComments,
    blankLines,
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex
  };
}

/**
 * Check if a line is a comment
 */
function isCommentLine(line: string): boolean {
  // TypeScript/JavaScript comments
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
    return true;
  }
  
  // Python comments
  if (line.startsWith('#')) {
    return true;
  }
  
  // Go comments
  if (line.startsWith('//')) {
    return true;
  }
  
  // Java/C# comments
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
    return true;
  }
  
  return false;
}

/**
 * Calculate basic cyclomatic complexity
 * This is a simplified version - will be enhanced with proper AST parsing
 */
function calculateBasicComplexity(content: string): number {
  let complexity = 1; // Base complexity
  
  // Keywords that increase complexity
  const complexityKeywords = [
    'if', 'else if', 'elif', 'switch', 'case',
    'for', 'while', 'do',
    'catch', 'except',
    '&&', '||', '?', ':',
    'and', 'or'
  ];
  
  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Calculate cognitive complexity (approximate)
 */
function calculateCognitiveComplexity(content: string): number {
  let complexity = 0;
  let nestingLevel = 0;
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Track nesting level
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    nestingLevel += openBraces - closeBraces;
    
    // Add complexity for control structures
    if (/\b(if|for|while|switch|catch)\b/.test(trimmed)) {
      complexity += Math.max(1, nestingLevel);
    }
    
    // Add complexity for logical operators
    const logicalOps = (trimmed.match(/(\&\&|\|\|)/g) || []).length;
    complexity += logicalOps;
  }
  
  return Math.max(complexity, 0);
}

/**
 * Calculate maintainability index (simplified)
 */
function calculateMaintainabilityIndex(linesOfCode: number, complexity: number): number {
  // Simplified version of the maintainability index formula
  // Real formula: MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
  // Where HV = Halstead Volume, CC = Cyclomatic Complexity, LOC = Lines of Code
  
  if (linesOfCode === 0) return 100;
  
  const baseScore = 100;
  const complexityPenalty = complexity * 2;
  const sizePenalty = Math.log(linesOfCode) * 5;
  
  const score = Math.max(0, baseScore - complexityPenalty - sizePenalty);
  return Math.round(score);
}

/**
 * Create analysis result helper
 */
export function createAnalysisResult(
  repositoryId: string,
  file: string,
  type: string,
  category: AnalysisCategory,
  severity: Severity,
  title: string,
  description: string,
  suggestion: string,
  line: number = 1,
  confidence: number = 0.8
): AnalysisResult {
  return {
    repositoryId,
    type: type as any,
    category,
    severity,
    title,
    description,
    suggestion,
    location: { file, line },
    confidence,
    impact: severity === 'critical' || severity === 'high' ? 'high' : 
            severity === 'medium' ? 'medium' : 'low',
    effort: 'medium',
    tags: [type],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Severity scoring utilities
 */
export function severityToScore(severity: Severity): number {
  const scoreMap = {
    low: 1,
    medium: 3,
    high: 7,
    critical: 15
  };
  return scoreMap[severity];
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 15) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * File extension utilities
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot === -1 ? '' : filePath.substring(lastDot + 1).toLowerCase();
}

export function isTestFile(filePath: string): boolean {
  const testPatterns = [
    /\.test\./,
    /\.spec\./,
    /_test\./,
    /_spec\./,
    /test_.*\.py$/,
    /.*_test\.py$/,
    /tests?\//,
    /__tests__\//
  ];
  
  return testPatterns.some(pattern => pattern.test(filePath));
}

export function isConfigFile(filePath: string): boolean {
  const configPatterns = [
    /^\..*rc$/,
    /\.config\./,
    /package\.json$/,
    /tsconfig\.json$/,
    /webpack\.config\./,
    /babel\.config\./,
    /jest\.config\./,
    /\.eslintrc/,
    /\.prettierrc/,
    /Dockerfile$/,
    /docker-compose\./
  ];
  
  return configPatterns.some(pattern => pattern.test(filePath));
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private startTime: number;
  private markers: Map<string, number> = new Map();
  
  constructor() {
    this.startTime = Date.now();
  }
  
  mark(label: string): void {
    this.markers.set(label, Date.now());
  }
  
  measure(label: string): number {
    const markTime = this.markers.get(label);
    if (!markTime) {
      throw new Error(`No mark found for label: ${label}`);
    }
    return Date.now() - markTime;
  }
  
  total(): number {
    return Date.now() - this.startTime;
  }
  
  getAllMeasurements(): Record<string, number> {
    const measurements: Record<string, number> = {};
    const now = Date.now();
    
    for (const [label, time] of this.markers) {
      measurements[label] = now - time;
    }
    
    return measurements;
  }
}

/**
 * Memory usage utilities
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      percentage: (usage.heapUsed / usage.heapTotal) * 100
    };
  }
  
  return { used: 0, total: 0, percentage: 0 };
}

/**
 * Batch processing utilities
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Progress tracking utilities
 */
export interface ProgressTracker {
  total: number;
  completed: number;
  percentage: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export class ProgressCounter {
  private total: number;
  private completed: number = 0;
  private startTime: number;
  
  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }
  
  increment(): void {
    this.completed++;
  }
  
  getProgress(): ProgressTracker {
    const timeElapsed = Date.now() - this.startTime;
    const percentage = (this.completed / this.total) * 100;
    const estimatedTimeRemaining = this.completed > 0 
      ? (timeElapsed / this.completed) * (this.total - this.completed)
      : 0;
    
    return {
      total: this.total,
      completed: this.completed,
      percentage,
      timeElapsed,
      estimatedTimeRemaining
    };
  }
}