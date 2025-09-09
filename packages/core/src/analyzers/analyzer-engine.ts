// packages/core/src/analyzers/analyzer-engine.ts
// Step 4A: Enhanced Analyzer Engine with Performance Analyzer Integration

import { Language, AnalysisResult, AnalysisCategory, Severity} from '@github-ai/shared';
import { EnhancedFileInfo } from '../models/file';
import { CoreAnalysisConfig } from '../models/analysis';
import { complexityAnalyzer, ComplexityResult } from './complexity';
import { securityAnalyzer, SecurityAnalysisResult } from './security';
import { patternDetector, PatternAnalysisResult } from './pattern-detector';
import { PerformanceAnalyzer, PerformanceAnalysisResult } from './performance';

export interface AnalyzerEngineResult {
  complexity?: ComplexityResult;
  security?: SecurityAnalysisResult;
  patterns?: PatternAnalysisResult;
  performance?: PerformanceAnalysisResult; // NEW: Added performance results
  issues: AnalysisResult[];
  summary: AnalyzerSummary;
  executionTime: number;
}

export interface AnalyzerSummary {
  totalIssues: number;
  issuesByCategory: Record<AnalysisCategory, number>;
  issuesBySeverity: Record<Severity, number>;
  analysisTime: {
    complexity: number;
    security: number;
    patterns: number;
    performance: number; // NEW: Added performance timing
    total: number;
  };
  scores: {
    complexity: number;
    security: number;
    maintainability: number;
    performance: number; // NEW: Added performance score
    overall: number;
  };
}

export interface AnalysisOptions {
  enableComplexity: boolean;
  enableSecurity: boolean;
  enablePatterns: boolean;
  enablePerformance: boolean; // NOW IMPLEMENTED!
  maxIssuesPerCategory: number;
  confidenceThreshold: number;
}

export class AnalyzerEngine {
  private config: CoreAnalysisConfig;
  private analysisOptions: AnalysisOptions;
  private performanceAnalyzer: PerformanceAnalyzer; // NEW: Performance analyzer instance

  constructor(config: CoreAnalysisConfig, options?: Partial<AnalysisOptions>) {
    this.config = config;
    this.analysisOptions = {
      enableComplexity: true,
      enableSecurity: true,
      enablePatterns: true,
      enablePerformance: true, // NOW ENABLED BY DEFAULT!
      maxIssuesPerCategory: 50,
      confidenceThreshold: 0.6,
      ...options
    };
    
    // Initialize performance analyzer
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  /**
   * Analyze a single file with all enabled analyzers
   */
  async analyzeFile(
    fileInfo: EnhancedFileInfo, 
    content: string, 
    repositoryId: string
  ): Promise<AnalyzerEngineResult> {
    const startTime = Date.now();
    const issues: AnalysisResult[] = [];
    
    let complexityResult: ComplexityResult | undefined;
    let securityResult: SecurityAnalysisResult | undefined;
    let patternResult: PatternAnalysisResult | undefined;
    let performanceResult: PerformanceAnalysisResult | undefined; // NEW: Performance result

    const analysisTimeTracker = {
      complexity: 0,
      security: 0,
      patterns: 0,
      performance: 0, // NEW: Performance timing
      total: 0
    };

    try {
      // Run complexity analysis
      if (this.analysisOptions.enableComplexity && this.shouldAnalyzeComplexity(fileInfo)) {
        const complexityStart = Date.now();
        complexityResult = await complexityAnalyzer.analyzeComplexity(content, fileInfo.language, fileInfo.path, fileInfo.language);
        analysisTimeTracker.complexity = Date.now() - complexityStart;

        // Convert complexity results to issues
        issues.push(...this.convertComplexityToIssues(complexityResult, fileInfo, repositoryId));
      }

      // Run security analysis
      if (this.analysisOptions.enableSecurity && this.shouldAnalyzeSecurity(fileInfo)) {
        const securityStart = Date.now();
        securityResult = await securityAnalyzer.analyzeSecurity(content, fileInfo.language, fileInfo.path);
        analysisTimeTracker.security = Date.now() - securityStart;

        // Convert security results to issues
        if (securityResult) {
          issues.push(...this.convertSecurityToIssues(securityResult, fileInfo, repositoryId));
        }
      }

      // Run pattern analysis
      if (this.analysisOptions.enablePatterns && this.shouldAnalyzePatterns(fileInfo)) {
        const patternsStart = Date.now();
        patternResult = await patternDetector.analyzePatterns(content, fileInfo.language, fileInfo.path);
        analysisTimeTracker.patterns = Date.now() - patternsStart;

        // Convert pattern results to issues
        issues.push(...this.convertPatternToIssues(patternResult, fileInfo, repositoryId));
      }

      // NEW: Run performance analysis
      if (this.analysisOptions.enablePerformance && this.shouldAnalyzePerformance(fileInfo)) {
        const performanceStart = Date.now();
        performanceResult = await this.performanceAnalyzer.analyzePerformance(content, fileInfo.language, fileInfo.path);
        analysisTimeTracker.performance = Date.now() - performanceStart;

        // Convert performance results to issues
        issues.push(...this.convertPerformanceToIssues(performanceResult, fileInfo, repositoryId));
      }

    } catch (error) {
      console.error('Analysis error:', error);
    }

    // Filter and limit issues
    const filteredIssues = this.limitIssuesPerCategory(
      this.filterIssuesByConfidence(issues)
    );

    analysisTimeTracker.total = Date.now() - startTime;

    // Generate summary
    const summary = this.generateSummary(
      filteredIssues, 
      analysisTimeTracker, 
      complexityResult, 
      securityResult, 
      patternResult,
      performanceResult // NEW: Include performance in summary
    );

    return {
      complexity: complexityResult,
      security: securityResult,
      patterns: patternResult,
      performance: performanceResult, // NEW: Return performance results
      issues: filteredIssues,
      summary,
      executionTime: analysisTimeTracker.total
    };
  }

  /**
   * NEW: Convert performance analysis results to standard issues
   */
  private convertPerformanceToIssues(
    performance: PerformanceAnalysisResult, 
    fileInfo: EnhancedFileInfo, 
    repositoryId: string
  ): AnalysisResult[] {
    return performance.issues.map(issue => ({
      repositoryId,
      type: 'performance_issue',
      category: 'performance',
      severity: issue.severity,
      title: issue.message,
      description: issue.description,
      suggestion: issue.suggestion,
      location: { 
        file: fileInfo.path, 
        line: issue.line, 
        column: issue.column 
      },
      confidence: this.calculatePerformanceConfidence(issue),
      impact: this.mapPerformanceImpact(issue.impact),
      effort: this.mapPerformanceEffort(issue.severity),
      tags: ['performance', ...issue.tags],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * NEW: Check if file should be analyzed for performance
   */
  private shouldAnalyzePerformance(fileInfo: EnhancedFileInfo): boolean {
    // Analyze performance for most code files, excluding generated files and configs
    return this.config.categories.includes('performance') && 
           !fileInfo.isGenerated && 
           fileInfo.lines > 5 && // Skip very small files
           this.isCodeFile(fileInfo);
  }

  /**
   * NEW: Check if file is a code file (not config/docs)
   */
  private isCodeFile(fileInfo: EnhancedFileInfo): boolean {
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.php', '.rb', '.cs'];
    const configFiles = ['package.json', 'tsconfig.json', '.eslintrc', '.gitignore'];
    
    return codeExtensions.some(ext => fileInfo.path.endsWith(ext)) &&
           !configFiles.some(config => fileInfo.path.includes(config));
  }

  /**
   * NEW: Calculate confidence score for performance issues
   */
  private calculatePerformanceConfidence(issue: any): number {
    // Base confidence on issue type and pattern strength
    const confidenceMap = {
      'inefficient_loop': 0.9,
      'n_plus_one_query': 0.95,
      'excessive_async_await': 0.9,
      'inefficient_regex': 0.95,
      'memory_leak_risk': 0.8,
      'recursive_without_memoization': 0.85,
      'large_object_creation': 0.7,
      'inefficient_sorting': 0.8
    };
    
    return confidenceMap[issue.type as keyof typeof confidenceMap] || 0.7;
  }

  /**
   * NEW: Map performance impact to standard impact levels
   */
  private mapPerformanceImpact(impact: any): 'low' | 'medium' | 'high' {
    if (impact.cpuUsage === 'critical' || impact.networkImpact === 'critical') return 'high';
    if (impact.cpuUsage === 'high' || impact.memoryUsage === 'high') return 'high';
    if (impact.cpuUsage === 'medium' || impact.memoryUsage === 'medium') return 'medium';
    return 'low';
  }

  /**
   * NEW: Map performance severity to effort level
   */
  private mapPerformanceEffort(severity: string): 'trivial' | 'easy' | 'medium' | 'hard' {
    const effortMap: Record<string, 'trivial' | 'easy' | 'medium' | 'hard'> = {
      low: 'trivial',
      medium: 'easy',
      high: 'medium',
      critical: 'hard'
    };
    return effortMap[severity] || 'medium';
  }

  /**
   * Convert complexity analysis results to standard issues
   */
  private convertComplexityToIssues(
    complexity: ComplexityResult, 
    fileInfo: EnhancedFileInfo, 
    repositoryId: string
  ): AnalysisResult[] {
    const issues: AnalysisResult[] = [];

    // High complexity functions
    for (const func of complexity.functionComplexity) {
      if (func.cognitiveComplexity > 15) {
        issues.push({
          repositoryId,
          type: 'code_smell',
          category: 'complexity',
          severity: func.cognitiveComplexity > 25 ? 'high' : 'medium',
          title: 'High Cognitive Complexity',
          description: `Function '${func.name}' has cognitive complexity of ${func.cognitiveComplexity}`,
          suggestion: 'Simplify the logic to reduce cognitive load',
          location: { file: fileInfo.path, line: func.startLine },
          confidence: 0.9,
          impact: 'medium',
          effort: 'medium',
          tags: ['complexity', 'readability'],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Large classes
    for (const cls of complexity.classComplexity) {
      if (cls.linesOfCode > 200) {
        issues.push({
          repositoryId,
          type: 'code_smell',
          category: 'maintainability',
          severity: 'medium',
          title: 'Large Class',
          description: `Class '${cls.name}' has ${cls.linesOfCode} lines`,
          suggestion: 'Consider splitting this class into smaller, more focused classes',
          location: { file: fileInfo.path, line: cls.startLine },
          confidence: 0.8,
          impact: 'medium',
          effort: 'hard',
          tags: ['large-class', 'maintainability'],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return issues;
  }

  /**
   * Convert security analysis results to standard issues
   */
  private convertSecurityToIssues(
    security: SecurityAnalysisResult, 
    fileInfo: EnhancedFileInfo, 
    repositoryId: string
  ): AnalysisResult[] {
    return security.issues.map(issue => ({
      repositoryId,
      type: 'security_vulnerability',
      category: 'security',
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      suggestion: issue.suggestion,
      location: { 
        file: fileInfo.path, 
        line: issue.line, 
        column: issue.column 
      },
      confidence: issue.confidence,
      impact: this.mapSecurityImpact(issue.severity),
      effort: 'medium',
      tags: ['security', issue.type],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Convert pattern analysis results to standard issues
   */
  private convertPatternToIssues(
    patterns: PatternAnalysisResult, 
    fileInfo: EnhancedFileInfo, 
    repositoryId: string
  ): AnalysisResult[] {
    return patterns.issues.map(issue => ({
      repositoryId,
      type: 'code_smell',
      category: 'maintainability',
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      suggestion: issue.suggestion,
      location: { 
        file: fileInfo.path, 
        line: issue.line, 
        column: issue.column 
      },
      confidence: issue.confidence,
      impact: this.mapPatternImpact(issue.impact),
      effort: this.mapPatternEffort(issue.effort),
      tags: ['pattern', issue.type],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Filter issues by confidence threshold
   */
  private filterIssuesByConfidence(issues: AnalysisResult[]): AnalysisResult[] {
    return issues.filter(issue => issue.confidence >= this.analysisOptions.confidenceThreshold);
  }

  /**
   * Limit number of issues per category to prevent overwhelming reports
   */
  private limitIssuesPerCategory(issues: AnalysisResult[]): AnalysisResult[] {
    const limitedIssues: AnalysisResult[] = [];
    const categoryCount: Record<AnalysisCategory, number> = {
      security: 0,
      performance: 0,
      complexity: 0,
      duplication: 0,
      testing: 0,
      documentation: 0,
      maintainability: 0
    };

    // Sort by severity (critical first) then by confidence
    const sortedIssues = issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    for (const issue of sortedIssues) {
      if (categoryCount[issue.category] < this.analysisOptions.maxIssuesPerCategory) {
        limitedIssues.push(issue);
        categoryCount[issue.category]++;
      }
    }

    return limitedIssues;
  }

  /**
   * Generate comprehensive analysis summary
   */
  private generateSummary(
    issues: AnalysisResult[],
    analysisTime: { complexity: number; security: number; patterns: number; performance: number; total: number },
    complexity?: ComplexityResult,
    security?: SecurityAnalysisResult,
    patterns?: PatternAnalysisResult,
    performance?: PerformanceAnalysisResult // NEW: Include performance results
  ): AnalyzerSummary {
    const summary: AnalyzerSummary = {
      totalIssues: issues.length,
      issuesByCategory: {
        security: 0,
        performance: 0,
        complexity: 0,
        duplication: 0,
        testing: 0,
        documentation: 0,
        maintainability: 0
      },
      issuesBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      analysisTime,
      scores: {
        complexity: complexity ? this.calculateComplexityScore(complexity) : 100,
        security: security ? security.summary.securityScore : 100,
        maintainability: patterns ? patterns.summary.codeQualityScore : 100,
        performance: performance ? performance.summary.overallScore : 100, // NEW: Performance score
        overall: 0
      }
    };

    // Count issues by category and severity
    for (const issue of issues) {
      summary.issuesByCategory[issue.category]++;
      summary.issuesBySeverity[issue.severity]++;
    }

    // Calculate overall score with performance included
    summary.scores.overall = Math.round(
      (summary.scores.complexity * 0.25 + 
       summary.scores.security * 0.3 + 
       summary.scores.maintainability * 0.2 + 
       summary.scores.performance * 0.25) // NEW: Performance gets 25% weight
    );

    return summary;
  }

  /**
   * Helper methods
   */
  private shouldAnalyzeComplexity(fileInfo: EnhancedFileInfo): boolean {
    return this.config.categories.includes('complexity') && 
           !fileInfo.isGenerated && 
           fileInfo.lines > 10;
  }

  private shouldAnalyzeSecurity(fileInfo: EnhancedFileInfo): boolean {
    return this.config.categories.includes('security') && 
           !fileInfo.isGenerated;
  }

  private shouldAnalyzePatterns(fileInfo: EnhancedFileInfo): boolean {
    return this.config.categories.includes('maintainability') && 
           !fileInfo.isGenerated && 
           fileInfo.lines > 5;
  }

  private mapSecurityImpact(severity: Severity): 'low' | 'medium' | 'high' {
    return severity === 'critical' || severity === 'high' ? 'high' : 
           severity === 'medium' ? 'medium' : 'low';
  }

  private mapPatternImpact(impact: string): 'low' | 'medium' | 'high' {
    return impact as 'low' | 'medium' | 'high';
  }

  private mapPatternEffort(effort: string): 'trivial' | 'easy' | 'medium' | 'hard' {
    const effortMap: Record<string, 'trivial' | 'easy' | 'medium' | 'hard'> = {
      low: 'easy',
      medium: 'medium',
      high: 'hard'
    };
    return effortMap[effort] || 'medium';
  }

  private calculateComplexityScore(complexity: ComplexityResult): number {
    return complexity.fileComplexity.maintainabilityIndex;
  }

  private getEmptySummary(executionTime: number): AnalyzerSummary {
    return {
      totalIssues: 0,
      issuesByCategory: {
        security: 0,
        performance: 0,
        complexity: 0,
        duplication: 0,
        testing: 0,
        documentation: 0,
        maintainability: 0
      },
      issuesBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      analysisTime: { complexity: 0, security: 0, patterns: 0, performance: 0, total: executionTime },
      scores: { complexity: 100, security: 100, maintainability: 100, performance: 100, overall: 100 }
    };
  }

  /**
   * NEW: Get performance analysis statistics
   */
  getPerformanceStats(): {
    enabled: boolean;
    avgAnalysisTime: number;
    supportedLanguages: string[];
  } {
    return {
      enabled: this.analysisOptions.enablePerformance,
      avgAnalysisTime: 0, // TODO: Track average analysis time
      supportedLanguages: ['typescript', 'javascript', 'python']
    };
  }

  /**
   * NEW: Enable/disable performance analysis
   */
  setPerformanceAnalysis(enabled: boolean): void {
    this.analysisOptions.enablePerformance = enabled;
  }
}

// Export singleton factory
export function createAnalyzerEngine(config: CoreAnalysisConfig, options?: Partial<AnalysisOptions>): AnalyzerEngine {
  return new AnalyzerEngine(config, options);
}

// NEW: Export performance-enabled analyzer engine factory
export function createPerformanceEnabledAnalyzerEngine(config: CoreAnalysisConfig): AnalyzerEngine {
  return new AnalyzerEngine(config, {
    enableComplexity: true,
    enableSecurity: true,
    enablePatterns: true,
    enablePerformance: true, // Explicitly enabled
    maxIssuesPerCategory: 100, // Higher limit for performance issues
    confidenceThreshold: 0.7   // Higher confidence for cleaner results
  });
}