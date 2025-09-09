// packages/core/src/analyzers/index.ts
// Step 3B: Updated analyzers index with Performance Analyzer integration

// Export all analyzer classes
export * from './complexity';
export * from './security';
export * from './performance';
export * from './pattern-detector';

// Import classes for re-export and integration
import { ComplexityAnalyzer } from './complexity';
import { SecurityAnalyzer } from './security';
import { PerformanceAnalyzer } from './performance';
import { PatternDetectorAnalyzer } from './pattern-detector';

// Export types and interfaces
export type {
  ComplexityResult,
  FunctionComplexity,
  ClassComplexity
} from './complexity';

export type {
  SecurityIssue,
  SecurityAnalysisResult
} from './security';

export type {
  PerformanceIssue,
  PerformanceIssueType,
  PerformanceAnalysisResult,
  PerformanceImpact
} from './performance';

export type {
  PatternIssue,
  PatternAnalysisResult,
  PatternSummary,
  GoodPattern,
  CodeSmellType
} from './pattern-detector';

// Enhanced analyzer configuration
export interface AnalyzerConfig {
  enableComplexity: boolean;
  enableSecurity: boolean;
  enablePerformance: boolean;
  enablePatterns: boolean;
  maxIssuesPerCategory: number;
  confidenceThreshold: number;
  performanceThresholds: {
    loopOptimization: boolean;
    asyncPatterns: boolean;
    memoryLeaks: boolean;
    regexSafety: boolean;
    databaseOptimization: boolean;
    recursionMemoization: boolean;
  };
}

// Combined analysis result
export interface ComprehensiveAnalysisResult {
  complexity?: import('./complexity').ComplexityResult;
  security?: import('./security').SecurityAnalysisResult;
  performance?: import('./performance').PerformanceAnalysisResult;
  patterns?: import('./pattern-detector').PatternAnalysisResult;
  summary: AnalysisSummary;
  executionTime: number;
}

export interface AnalysisSummary {
  totalIssues: number;
  issuesByCategory: {
    complexity: number;
    security: number;
    performance: number;
    patterns: number;
  };
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  overallScore: number; // 0-100
  recommendations: string[];
}

// Enhanced unified analyzer class
export class CodeAnalyzer {
  private complexityAnalyzer: ComplexityAnalyzer;
  private securityAnalyzer: SecurityAnalyzer;
  private performanceAnalyzer: PerformanceAnalyzer;
  private patternAnalyzer: PatternDetectorAnalyzer;
  private config: AnalyzerConfig;

  constructor(config?: Partial<AnalyzerConfig>) {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.securityAnalyzer = new SecurityAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.patternAnalyzer = new PatternDetectorAnalyzer();
    
    this.config = {
      enableComplexity: true,
      enableSecurity: true,
      enablePerformance: true, // NOW ENABLED!
      enablePatterns: true,
      maxIssuesPerCategory: 50,
      confidenceThreshold: 0.6,
      performanceThresholds: {
        loopOptimization: true,
        asyncPatterns: true,
        memoryLeaks: true,
        regexSafety: true,
        databaseOptimization: true,
        recursionMemoization: true
      },
      ...config
    };
  }

  /**
   * Run comprehensive analysis on code with all enabled analyzers
   */
  async analyzeCode(
    content: string, 
    language: import('@github-ai/shared').Language, 
    filePath?: string
  ): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();
    
    const results = await Promise.allSettled([
      this.config.enableComplexity ? this.complexityAnalyzer.analyzeComplexity(content, language, filePath, language) : null,
      this.config.enableSecurity ? this.securityAnalyzer.analyzeSecurity(content, language, filePath) : null,
      this.config.enablePerformance ? this.performanceAnalyzer.analyzePerformance(content, language, filePath) : null,
      this.config.enablePatterns ? this.patternAnalyzer.analyzePatterns(content, language, filePath) : null
    ]);

    // Extract results safely
    const complexity = results[0].status === 'fulfilled' && results[0].value !== null ? results[0].value : undefined;
    const security = results[1].status === 'fulfilled' && results[1].value !== null ? results[1].value : undefined;
    const performance = results[2].status === 'fulfilled' && results[2].value !== null ? results[2].value : undefined;
    const patterns = results[3].status === 'fulfilled' && results[3].value !== null ? results[3].value : undefined;

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const analyzerNames = ['complexity', 'security', 'performance', 'patterns'];
        console.error(`${analyzerNames[index]} analyzer failed:`, result.reason);
      }
    });

    const summary = this.generateComprehensiveSummary(complexity, security, performance, patterns);
    
    return {
      security,
      performance,
      patterns,
      summary,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Quick performance-only analysis
   */
  async analyzePerformanceOnly(
    content: string, 
    language: import('@github-ai/shared').Language, 
    filePath?: string
  ): Promise<import('./performance').PerformanceAnalysisResult> {
    return this.performanceAnalyzer.analyzePerformance(content, language, filePath);
  }

  /**
   * Batch analyze multiple files
   */
  async analyzeBatch(
    files: Array<{ content: string; language: import('@github-ai/shared').Language; path: string }>
  ): Promise<Map<string, ComprehensiveAnalysisResult>> {
    const results = new Map<string, ComprehensiveAnalysisResult>();
    
    // Process files in parallel (with concurrency limit)
    const concurrencyLimit = 5;
    const batches = this.chunkArray(files, concurrencyLimit);
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async file => ({
          path: file.path,
          result: await this.analyzeCode(file.content, file.language, file.path)
        }))
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.set(result.value.path, result.value.result);
        } else {
          console.error('Batch analysis failed for file:', result.reason);
        }
      });
    }
    
    return results;
  }

  /**
   * Get analyzer statistics and health
   */
  getAnalyzerStats(): {
    enabledAnalyzers: string[];
    config: AnalyzerConfig;
    performanceEnabled: boolean;
  } {
    const enabledAnalyzers = [];
    if (this.config.enableComplexity) enabledAnalyzers.push('complexity');
    if (this.config.enableSecurity) enabledAnalyzers.push('security');
    if (this.config.enablePerformance) enabledAnalyzers.push('performance');
    if (this.config.enablePatterns) enabledAnalyzers.push('patterns');

    return {
      enabledAnalyzers,
      config: this.config,
      performanceEnabled: this.config.enablePerformance
    };
  }

  /**
   * Update analyzer configuration
   */
  updateConfig(newConfig: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private generateComprehensiveSummary(
    complexity?: any,
    security?: any,
    performance?: any,
    patterns?: any
  ): AnalysisSummary {
    const issuesByCategory = {
      complexity: complexity?.issues?.length || 0,
      security: security?.issues?.length || 0,
      performance: performance?.issues?.length || 0,
      patterns: patterns?.issues?.length || 0
    };

    const allIssues = [
      ...(security?.issues || []),
      ...(performance?.issues || []),
      ...(patterns?.issues || [])
    ];

    const issuesBySeverity = {
      critical: allIssues.filter(issue => issue.severity === 'critical').length,
      high: allIssues.filter(issue => issue.severity === 'high').length,
      medium: allIssues.filter(issue => issue.severity === 'medium').length,
      low: allIssues.filter(issue => issue.severity === 'low').length
    };

    const totalIssues = Object.values(issuesByCategory).reduce((sum, count) => sum + count, 0);

    // Calculate weighted overall score
    const scores = {
      complexity: complexity?.overallScore || complexity?.fileComplexity?.maintainabilityIndex || 100,
      security: security?.summary?.overallScore || 100,
      performance: performance?.summary?.overallScore || 100,
      patterns: patterns?.summary?.codeQualityScore || 100
    };

    // Weighted average (performance and security are more important)
    const overallScore = Math.round(
      (scores.complexity * 0.2 +
       scores.security * 0.3 +
       scores.performance * 0.3 +
       scores.patterns * 0.2)
    );

    // Generate comprehensive recommendations
    const recommendations = this.generateCombinedRecommendations(complexity, security, performance, patterns);

    return {
      totalIssues,
      issuesByCategory,
      issuesBySeverity,
      overallScore,
      recommendations
    };
  }

  private generateCombinedRecommendations(complexity?: any, security?: any, performance?: any, patterns?: any): string[] {
    const recommendations = new Set<string>();

    // Add recommendations from each analyzer
    if (complexity?.recommendations) {
      complexity.recommendations.forEach((rec: string) => recommendations.add(rec));
    }
    if (security?.recommendations) {
      security.recommendations.forEach((rec: string) => recommendations.add(rec));
    }
    if (performance?.recommendations) {
      performance.recommendations.forEach((rec: string) => recommendations.add(rec));
    }
    if (patterns?.goodPatterns) {
      recommendations.add(`Found ${patterns.goodPatterns.length} good patterns - keep up the good practices!`);
    }

    // Add priority recommendations based on issue severity
    const criticalIssues = [
      ...(security?.issues?.filter((i: any) => i.severity === 'critical') || []),
      ...(performance?.issues?.filter((i: any) => i.severity === 'critical') || [])
    ];

    if (criticalIssues.length > 0) {
      recommendations.add(`🚨 URGENT: Address ${criticalIssues.length} critical issues immediately`);
    }

    // Performance-specific recommendations
    if (performance?.issues?.length > 0) {
      const perfTypes = new Set(performance.issues.map((i: any) => i.type));
      if (perfTypes.size > 3) {
        recommendations.add('🎯 Focus on performance optimization - multiple patterns detected');
      }
    }

    return Array.from(recommendations).slice(0, 8); // Top 8 recommendations
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Factory function for creating configured analyzer
export function createCodeAnalyzer(config?: Partial<AnalyzerConfig>): CodeAnalyzer {
  return new CodeAnalyzer(config);
}

// Export singleton for backward compatibility
export const codeAnalyzer = new CodeAnalyzer();

// Performance-focused analyzer preset
export function createPerformanceAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer({
    enableComplexity: false,
    enableSecurity: false,
    enablePerformance: true,
    enablePatterns: false,
    performanceThresholds: {
      loopOptimization: true,
      asyncPatterns: true,
      memoryLeaks: true,
      regexSafety: true,
      databaseOptimization: true,
      recursionMemoization: true
    }
  });
}

// Security-focused analyzer preset
export function createSecurityAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer({
    enableComplexity: false,
    enableSecurity: true,
    enablePerformance: true, // Performance issues can be security issues
    enablePatterns: false,
    performanceThresholds: {
      loopOptimization: false,
      asyncPatterns: false,
      memoryLeaks: true, // Memory leaks are security relevant
      regexSafety: true,  // ReDoS attacks
      databaseOptimization: false,
      recursionMemoization: false
    }
  });
}

// Full-featured analyzer preset
export function createFullAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer({
    enableComplexity: true,
    enableSecurity: true,
    enablePerformance: true,
    enablePatterns: true,
    maxIssuesPerCategory: 100,
    confidenceThreshold: 0.5,
    performanceThresholds: {
      loopOptimization: true,
      asyncPatterns: true,
      memoryLeaks: true,
      regexSafety: true,
      databaseOptimization: true,
      recursionMemoization: true
    }
  });
}