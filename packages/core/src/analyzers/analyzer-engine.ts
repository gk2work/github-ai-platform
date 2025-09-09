// packages/core/src/analyzers/analyzer-engine.ts

import { Language, AnalysisResult, AnalysisCategory, Severity} from '@github-ai/shared';
import { EnhancedFileInfo } from '../models/file';
import { CoreAnalysisConfig } from '../models/analysis';
import { complexityAnalyzer, ComplexityResult } from './complexity';
import { securityAnalyzer, SecurityAnalysisResult } from './security';
import { patternDetector, PatternAnalysisResult } from './pattern-detector';

export interface AnalyzerEngineResult {
  complexity?: ComplexityResult;
  security?: SecurityAnalysisResult;
  patterns?: PatternAnalysisResult;
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
    total: number;
  };
  scores: {
    complexity: number;
    security: number;
    maintainability: number;
    overall: number;
  };
}

export interface AnalysisOptions {
  enableComplexity: boolean;
  enableSecurity: boolean;
  enablePatterns: boolean;
  enablePerformance: boolean;
  maxIssuesPerCategory: number;
  confidenceThreshold: number;
}

export class AnalyzerEngine {
  private config: CoreAnalysisConfig;
  private analysisOptions: AnalysisOptions;

  constructor(config: CoreAnalysisConfig, options?: Partial<AnalysisOptions>) {
    this.config = config;
    this.analysisOptions = {
      enableComplexity: true,
      enableSecurity: true,
      enablePatterns: true,
      enablePerformance: false, // Not implemented yet
      maxIssuesPerCategory: 50,
      confidenceThreshold: 0.6,
      ...options
    };
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

    const analysisTimeTracker = {
      complexity: 0,
      security: 0,
      patterns: 0,
      total: 0
    };

    try {
      // Run complexity analysis
      if (this.analysisOptions.enableComplexity && this.shouldAnalyzeComplexity(fileInfo)) {
        const complexityStart = Date.now();
        complexityResult = await complexityAnalyzer.analyzeComplexity(content, fileInfo.language);
        analysisTimeTracker.complexity = Date.now() - complexityStart;
        
        // Convert complexity results to issues
        const complexityIssues = this.convertComplexityToIssues(complexityResult, fileInfo, repositoryId);
        issues.push(...complexityIssues);
      }

      // Run security analysis
      if (this.analysisOptions.enableSecurity && this.shouldAnalyzeSecurity(fileInfo)) {
        const securityStart = Date.now();
        securityResult = await securityAnalyzer.analyzeCode(content, fileInfo.language, fileInfo.path);
        analysisTimeTracker.security = Date.now() - securityStart;
        
        // Convert security results to issues
        const securityIssues = this.convertSecurityToIssues(securityResult, fileInfo, repositoryId);
        issues.push(...securityIssues);
      }

      // Run pattern analysis
      if (this.analysisOptions.enablePatterns) {
        const patternStart = Date.now();
        patternResult = await patternDetector.analyzePatterns(content, fileInfo.language, fileInfo.path);
        analysisTimeTracker.patterns = Date.now() - patternStart;
        
        // Convert pattern results to issues
        const patternIssues = this.convertPatternToIssues(patternResult, fileInfo, repositoryId);
        issues.push(...patternIssues);
      }

      // Filter issues by confidence threshold
      const filteredIssues = this.filterIssuesByConfidence(issues);
      
      // Limit issues per category
      const limitedIssues = this.limitIssuesPerCategory(filteredIssues);

      // Generate summary
      analysisTimeTracker.total = Date.now() - startTime;
      const summary = this.generateSummary(
        limitedIssues, 
        analysisTimeTracker, 
        complexityResult, 
        securityResult, 
        patternResult
      );

      return {
        complexity: complexityResult,
        security: securityResult,
        patterns: patternResult,
        issues: limitedIssues,
        summary,
        executionTime: analysisTimeTracker.total
      };

    } catch (error) {
      console.error(`Analysis failed for file ${fileInfo.path}:`, error);
      
      // Return minimal result with error
      return {
        issues: [{
          repositoryId,
          type: 'analysis_error' as any,
          category: 'maintainability',
          severity: 'low',
          title: 'Analysis Error',
          description: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check file syntax and encoding',
          location: { file: fileInfo.path, line: 1 },
          confidence: 1.0,
          impact: 'low',
          effort: 'easy',
          tags: ['analysis-error'],
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        summary: this.getEmptySummary(Date.now() - startTime),
        executionTime: Date.now() - startTime
      };
    }
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

    // High cyclomatic complexity functions
    for (const func of complexity.functionComplexity) {
      if (func.cyclomaticComplexity > 10) {
        issues.push({
          repositoryId,
          type: 'complexity_warning',
          category: 'complexity',
          severity: func.cyclomaticComplexity > 20 ? 'high' : 'medium',
          title: 'High Cyclomatic Complexity',
          description: `Function '${func.name}' has cyclomatic complexity of ${func.cyclomaticComplexity}`,
          suggestion: 'Consider breaking this function into smaller, more focused functions',
          location: { file: fileInfo.path, line: func.startLine },
          confidence: 0.9,
          impact: 'medium',
          effort: 'medium',
          tags: ['complexity', 'maintainability'],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // High cognitive complexity functions
    for (const func of complexity.functionComplexity) {
      if (func.cognitiveComplexity > 15) {
        issues.push({
          repositoryId,
          type: 'complexity_warning',
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
    analysisTime: { complexity: number; security: number; patterns: number; total: number },
    complexity?: ComplexityResult,
    security?: SecurityAnalysisResult,
    patterns?: PatternAnalysisResult
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
        overall: 0
      }
    };

    // Count issues by category and severity
    for (const issue of issues) {
      summary.issuesByCategory[issue.category]++;
      summary.issuesBySeverity[issue.severity]++;
    }

    // Calculate overall score
    summary.scores.overall = Math.round(
      (summary.scores.complexity + summary.scores.security + summary.scores.maintainability) / 3
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
      analysisTime: { complexity: 0, security: 0, patterns: 0, total: executionTime },
      scores: { complexity: 100, security: 100, maintainability: 100, overall: 100 }
    };
  }
}

// Export singleton factory
export function createAnalyzerEngine(config: CoreAnalysisConfig, options?: Partial<AnalysisOptions>): AnalyzerEngine {
  return new AnalyzerEngine(config, options);
}