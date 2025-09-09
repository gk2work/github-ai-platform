import { Repository, AnalysisReport, AnalysisResult, AnalysisSummary } from '@github-ai/shared';
import { CoreAnalysisConfig } from './models/analysis';
import { FileDiscovery, FileDiscoveryOptions } from './utils/file-utils';
import { LanguageDetector } from './utils/language-detection';
import { FileProcessor, EnhancedFileInfo } from './models/file';

export class AnalysisEngine {
  private fileDiscovery: FileDiscovery;
  private languageDetector: LanguageDetector;

  constructor(private config: CoreAnalysisConfig) {
    const discoveryOptions: FileDiscoveryOptions = {
      includePatterns: config.includePatterns,
      excludePatterns: config.excludePatterns,
      maxFileSize: config.maxFileSize,
      supportedLanguages: config.languages
    };

    this.fileDiscovery = new FileDiscovery(discoveryOptions);
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Analyze a repository and generate a comprehensive report
   */
  async analyzeRepository(repository: Repository): Promise<AnalysisReport> {
    const startTime = Date.now();
    console.log(`Ì¥ç Starting analysis of ${repository.owner}/${repository.name}`);

    try {
      // Phase 1: File Discovery
      console.log(`Ì≥Å Phase 1: Discovering files...`);
      const { files, stats } = await this.fileDiscovery.discoverFiles(repository.url);
      
      console.log(`Ì≥ä Discovery Results:`);
      console.log(`  ‚Ä¢ Total files: ${stats.totalFiles}`);
      console.log(`  ‚Ä¢ Total size: ${this.formatBytes(stats.totalSize)}`);
      console.log(`  ‚Ä¢ Language distribution:`, stats.languageDistribution);
      console.log(`  ‚Ä¢ Skipped: ${stats.skippedFiles.length}`);
      console.log(`  ‚Ä¢ Errors: ${stats.errors.length}`);

      // Phase 2: File Processing
      console.log(`Ì¥ß Phase 2: Processing files...`);
      const enhancedFiles: EnhancedFileInfo[] = [];
      const analysisResults: AnalysisResult[] = [];

      for (const file of files) {
        try {
          // Get file content
          const content = await this.fileDiscovery.getFileContent(file.path);
          
          // Enhance file metadata
          const enhancedFile = FileProcessor.enhance(file, content);
          enhancedFiles.push(enhancedFile);

          // Basic analysis (complexity analysis will come in Phase A3)
          const fileResults = await this.analyzeFile(enhancedFile, content);
          analysisResults.push(...fileResults);

        } catch (error) {
          console.error(`‚ùå Error processing file ${file.path}:`, error);
          // Add error to analysis results
          analysisResults.push(this.createErrorResult(file.path, error));
        }
      }

      // Phase 3: Generate Summary
      console.log(`Ì≥ä Phase 3: Generating summary...`);
      const summary = this.generateSummary(analysisResults);

      const executionTime = Date.now() - startTime;
      
      const report: AnalysisReport = {
        repositoryId: repository._id || '',
        results: analysisResults,
        summary,
        executionTime,
        analyzedFiles: enhancedFiles.length,
        skippedFiles: stats.skippedFiles.length,
        errors: stats.errors.map(e => ({
          file: e.file,
          error: e.error,
          type: 'analysis_error' as const
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`‚úÖ Analysis completed in ${executionTime}ms`);
      console.log(`Ì≥ã Summary: ${summary.totalIssues} issues found, score: ${summary.overallScore}/100`);

      return report;

    } catch (error) {
      console.error(`‚ùå Analysis failed:`, error);
      throw new Error(`Repository analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze a single file (basic analysis for now)
   */
  private async analyzeFile(file: EnhancedFileInfo, content: string): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    // Basic file-level checks
    if (file.isEmpty) {
      results.push({
        repositoryId: '',
        type: 'code_smell',
        category: 'maintainability',
        severity: 'low',
        title: 'Empty File',
        description: 'This file is empty and may not be needed',
        suggestion: 'Consider removing this file if it serves no purpose',
        location: { file: file.path, line: 1 },
        confidence: 0.9,
        impact: 'low',
        effort: 'trivial',
        tags: ['empty-file'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Large file check
    if (file.size > 50000) { // 50KB
      results.push({
        repositoryId: '',
        type: 'code_smell',
        category: 'maintainability',
        severity: 'medium',
        title: 'Large File',
        description: `File is ${this.formatBytes(file.size)}, which may indicate it should be split`,
        suggestion: 'Consider breaking this file into smaller, more focused modules',
        location: { file: file.path, line: 1 },
        confidence: 0.7,
        impact: 'medium',
        effort: 'medium',
        tags: ['large-file'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Too many lines check
    if (file.lines > 500) {
      results.push({
        repositoryId: '',
        type: 'code_smell',
        category: 'complexity',
        severity: 'medium',
        title: 'File Too Long',
        description: `File has ${file.lines} lines, which may be difficult to maintain`,
        suggestion: 'Consider splitting this file into smaller, more focused files',
        location: { file: file.path, line: 1 },
        confidence: 0.8,
        impact: 'medium',
        effort: 'medium',
        tags: ['long-file'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return results;
  }

  /**
   * Create an error result for a failed file analysis
   */
  private createErrorResult(filePath: string, error: unknown): AnalysisResult {
    return {
      repositoryId: '',
      type: 'analysis_error' as any,
      category: 'maintainability',
      severity: 'low',
      title: 'Analysis Error',
      description: `Failed to analyze this file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestion: 'Check if the file is corrupted or has encoding issues',
      location: { file: filePath, line: 1 },
      confidence: 1.0,
      impact: 'low',
      effort: 'easy',
      tags: ['analysis-error'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate analysis summary from results
   */
  private generateSummary(results: AnalysisResult[]): AnalysisSummary {
    const summary: AnalysisSummary = {
      totalIssues: results.length,
      issuesByCategory: {
        security: 0,
        performance: 0,
        complexity: 0,
        duplication: 0,
        testing: 0,
        documentation: 0,
        maintainability: 0
      },
      issuesBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      overallScore: 100,
      recommendations: []
    };

    // Count issues by category and severity
    for (const result of results) {
      summary.issuesByCategory[result.category]++;
      summary.issuesBySeverity[result.severity]++;
    }

    // Calculate overall score (0-100)
    const weights = { low: 1, medium: 3, high: 7, critical: 15 };
    const totalPenalty = Object.entries(summary.issuesBySeverity)
      .reduce((sum, [severity, count]) => 
        sum + (weights[severity as keyof typeof weights] * count), 0);
    
    summary.overallScore = Math.max(0, 100 - totalPenalty);

    // Generate recommendations
    summary.recommendations = this.generateRecommendations(summary);

    return summary;
  }

  /**
   * Generate actionable recommendations based on analysis
   */
  private generateRecommendations(summary: AnalysisSummary): string[] {
    const recommendations: string[] = [];

    if (summary.issuesBySeverity.critical > 0) {
      recommendations.push(`Address ${summary.issuesBySeverity.critical} critical issues immediately`);
    }

    if (summary.issuesBySeverity.high > 0) {
      recommendations.push(`Review ${summary.issuesBySeverity.high} high-priority issues`);
    }

    if (summary.issuesByCategory.complexity > 5) {
      recommendations.push('Consider refactoring complex code for better maintainability');
    }

    if (summary.issuesByCategory.maintainability > 10) {
      recommendations.push('Focus on improving code organization and structure');
    }

    if (summary.overallScore < 70) {
      recommendations.push('Overall code quality needs improvement - consider a systematic refactoring approach');
    } else if (summary.overallScore > 90) {
      recommendations.push('Excellent code quality! Focus on maintaining current standards');
    }

    if (recommendations.length === 0) {
      recommendations.push('Good job! Continue following best practices');
    }

    return recommendations;
  }

  /**
   * Utility function to format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
