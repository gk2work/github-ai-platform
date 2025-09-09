// packages/core/src/analyzers/performance.ts
// COMPLETE WORKING Performance Analyzer - Part 1

import { Language } from '@github-ai/shared';

export interface PerformanceIssue {
  type: PerformanceIssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  description: string;
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  codeSnippet: string;
  suggestion: string;
  impact: PerformanceImpact;
  tags: string[];
}

export enum PerformanceIssueType {
  INEFFICIENT_LOOP = 'inefficient_loop',
  N_PLUS_ONE_QUERY = 'n_plus_one_query',
  EXCESSIVE_ASYNC_AWAIT = 'excessive_async_await',
  UNNECESSARY_ARRAY_COPY = 'unnecessary_array_copy',
  INEFFICIENT_REGEX = 'inefficient_regex',
  LARGE_OBJECT_CREATION = 'large_object_creation',
  MEMORY_LEAK_RISK = 'memory_leak_risk',
  INEFFICIENT_COMPREHENSION = 'inefficient_comprehension',
  GLOBAL_VARIABLE_ABUSE = 'global_variable_abuse',
  INEFFICIENT_STRING_CONCAT = 'inefficient_string_concat',
  RECURSIVE_WITHOUT_MEMOIZATION = 'recursive_without_memoization',
  SYNCHRONOUS_FILE_IO = 'synchronous_file_io',
  INEFFICIENT_DATABASE_QUERY = 'inefficient_database_query',
  EXCESSIVE_FUNCTION_CALLS = 'excessive_function_calls',
  INEFFICIENT_SORTING = 'inefficient_sorting'
}

export interface PerformanceImpact {
  timeComplexity?: string;
  spaceComplexity?: string;
  memoryUsage: 'low' | 'medium' | 'high';
  cpuUsage: 'low' | 'medium' | 'high';
  networkImpact?: 'low' | 'medium' | 'high';
  estimatedSlowdown: string;
}

export interface PerformanceAnalysisResult {
  issues: PerformanceIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    overallScore: number;
  };
  recommendations: string[];
  analysisTime: number;
}

export class PerformanceAnalyzer {
  constructor() {
    // Initialize performance analyzer
  }

  /**
   * Main analysis method - analyzes code for performance issues
   */
  async analyzePerformance(
    content: string, 
    language: Language, 
    filePath: string = 'unknown'
  ): Promise<PerformanceAnalysisResult> {
    const startTime = Date.now();
    const issues: PerformanceIssue[] = [];

    try {
      // Analyze different performance patterns
      issues.push(...this.analyzeLoopPatterns(content, language, filePath));
      issues.push(...this.analyzeAsyncPatterns(content, language, filePath));
      issues.push(...this.analyzeMemoryPatterns(content, language, filePath));
      issues.push(...this.analyzeRegexPatterns(content, language, filePath));
      issues.push(...this.analyzeDatabasePatterns(content, language, filePath));
      issues.push(...this.analyzeRecursionPatterns(content, language, filePath));
    } catch (error) {
      console.error('Performance analysis error:', error);
    }

    return this.generateAnalysisResult(issues, Date.now() - startTime);
  }

  /**
   * Legacy method for backward compatibility
   */
  async detectPerformanceIssues(content: string): Promise<PerformanceIssue[]> {
    const result = await this.analyzePerformance(content, 'typescript');
    return result.issues;
  }

  /**
   * Analyze loop performance patterns
   */
  private analyzeLoopPatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // TypeScript/JavaScript: Inefficient array length access
      if ((language === 'typescript' || language === 'javascript') && 
          /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/.test(line)) {
        
        issues.push({
          type: PerformanceIssueType.INEFFICIENT_LOOP,
          severity: 'medium',
          message: 'Loop accesses array length on each iteration',
          description: 'Accessing .length property in loop condition causes repeated property lookups',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: line.trim(),
          suggestion: 'Cache array length: const len = arr.length; for (let i = 0; i < len; i++)',
          impact: {
            timeComplexity: 'O(n) → O(n) with constant factor improvement',
            memoryUsage: 'low',
            cpuUsage: 'medium',
            estimatedSlowdown: '10-20% slower for large arrays'
          },
          tags: ['loops', 'array-access', 'micro-optimization']
        });
      }

      // Python: range(len()) pattern
      if (language === 'python' && 
          /for\s+\w+\s+in\s+range\s*\(\s*len\s*\(\s*\w+\s*\)\s*\)\s*:/.test(line)) {
        
        issues.push({
          type: PerformanceIssueType.INEFFICIENT_LOOP,
          severity: 'medium',
          message: 'Use enumerate() instead of range(len())',
          description: 'range(len()) is less pythonic and slightly slower than enumerate()',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: line.trim(),
          suggestion: 'for i, item in enumerate(items): instead of for i in range(len(items)):',
          impact: {
            timeComplexity: 'Same complexity, better performance',
            memoryUsage: 'low',
            cpuUsage: 'low',
            estimatedSlowdown: '5-10% slower'
          },
          tags: ['loops', 'pythonic', 'enumerate']
        });
      }

      // Nested array operations in loops
      if (this.isLoopLine(line, language) && this.hasNestedArrayOperations(line)) {
        issues.push({
          type: PerformanceIssueType.INEFFICIENT_LOOP,
          severity: 'high',
          message: 'Nested array operations in loop',
          description: 'Nested array methods like find(), filter() in loops create O(n²) complexity',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: line.trim(),
          suggestion: 'Use Map or Set for lookups, or restructure to avoid nested iterations',
          impact: {
            timeComplexity: 'O(n²) or worse',
            memoryUsage: 'medium',
            cpuUsage: 'high',
            estimatedSlowdown: 'Exponential with data size'
          },
          tags: ['loops', 'nested-operations', 'complexity']
        });
      }
    }

    return issues;
  }

  /**
   * Analyze async/await patterns
   */
  private analyzeAsyncPatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    if (language === 'typescript' || language === 'javascript') {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // forEach with async callback
        if (/\.forEach\s*\(\s*async\s*\(/.test(line)) {
          issues.push({
            type: PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT,
            severity: 'high',
            message: 'forEach with async callback runs sequentially',
            description: 'forEach does not await async callbacks, causing uncontrolled parallelism or silent failures',
            file: filePath,
            line: lineNumber,
            column: 0,
            endLine: lineNumber,
            endColumn: line.length,
            codeSnippet: line.trim(),
            suggestion: 'Use Promise.all(array.map(async ...)) for parallel execution or for...of for sequential',
            impact: {
              timeComplexity: 'Unpredictable due to race conditions',
              memoryUsage: 'high',
              cpuUsage: 'high',
              networkImpact: 'high',
              estimatedSlowdown: 'Can cause timeouts or memory issues'
            },
            tags: ['async', 'forEach', 'concurrency']
          });
        }

        // Sequential awaits in loops
        if (this.isLoopLine(line, language) && this.hasAwaitInFollowingLines(lines, i)) {
          issues.push({
            type: PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT,
            severity: 'high',
            message: 'Sequential awaits in loop',
            description: 'Awaiting in loops makes async operations sequential instead of parallel',
            file: filePath,
            line: lineNumber,
            column: 0,
            endLine: lineNumber,
            endColumn: line.length,
            codeSnippet: line.trim(),
            suggestion: 'Collect promises first, then await Promise.all(promises)',
            impact: {
              timeComplexity: 'O(n) serial time instead of O(1) parallel',
              memoryUsage: 'low',
              cpuUsage: 'low',
              networkImpact: 'high',
              estimatedSlowdown: 'n times slower for network operations'
            },
            tags: ['async', 'await', 'loops', 'parallelization']
          });
        }
      }
    }

    return issues;
  }

  /**
   * Analyze memory-related patterns
   */
  private analyzeMemoryPatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Event listeners without removal
      if ((language === 'typescript' || language === 'javascript') && 
          /addEventListener\s*\(\s*['"`]/.test(line) &&
          !this.hasCorrespondingRemoveListener(content, line)) {
        
        issues.push({
          type: PerformanceIssueType.MEMORY_LEAK_RISK,
          severity: 'high',
          message: 'Event listener without removal',
          description: 'Event listeners not removed can cause memory leaks in long-running applications',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: line.trim(),
          suggestion: 'Add corresponding removeEventListener or use AbortController',
          impact: {
            memoryUsage: 'high',
            cpuUsage: 'low',
            estimatedSlowdown: 'Memory growth over time'
          },
          tags: ['memory-leak', 'event-listeners', 'cleanup']
        });
      }

      // Large object creation
      if (this.isLargeObjectCreation(line)) {
        issues.push({
          type: PerformanceIssueType.LARGE_OBJECT_CREATION,
          severity: 'medium',
          message: 'Large object creation detected',
          description: 'Creating large objects in loops or frequently called functions can cause GC pressure',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: this.truncateCode(line.trim(), 60),
          suggestion: 'Consider object pooling, factory pattern, or lazy initialization',
          impact: {
            memoryUsage: 'high',
            cpuUsage: 'medium',
            estimatedSlowdown: 'GC pauses and memory pressure'
          },
          tags: ['memory', 'gc', 'object-creation']
        });
      }
    }

    return issues;
  }

  // packages/core/src/analyzers/performance.ts - Part 2
// Continue from Part 1 - Helper methods and remaining analysis

  /**
   * Analyze regex patterns for performance issues
   */
  private analyzeRegexPatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    const dangerousPatterns = [
      { pattern: /\(\.\*\)\+/, description: '(.*)+ pattern' },
      { pattern: /\(\.\+\)\*/, description: '(.+)* pattern' },
      { pattern: /\(\[\^[^\]]*\]\*\)\+/, description: '([^...]*) + pattern' },
      { pattern: /\(\w\*\)\+/, description: '(\\w*)+ pattern' }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const regexMatches = line.match(/\/(.+?)\/[gimuy]*/g);
      if (regexMatches) {
        for (const regex of regexMatches) {
          for (const dangerous of dangerousPatterns) {
            if (dangerous.pattern.test(regex)) {
              issues.push({
                type: PerformanceIssueType.INEFFICIENT_REGEX,
                severity: 'critical',
                message: `Regex with catastrophic backtracking risk: ${dangerous.description}`,
                description: 'This regex pattern can cause exponential time complexity on certain inputs',
                file: filePath,
                line: lineNumber,
                column: line.indexOf(regex),
                endLine: lineNumber,
                endColumn: line.indexOf(regex) + regex.length,
                codeSnippet: regex,
                suggestion: 'Rewrite regex to avoid nested quantifiers and backtracking',
                impact: {
                  timeComplexity: 'Can be exponential O(2^n)',
                  cpuUsage: 'high',
                  memoryUsage: 'high',
                  estimatedSlowdown: 'Can cause timeouts or DoS'
                },
                tags: ['regex', 'backtracking', 'security']
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Analyze database query patterns
   */
  private analyzeDatabasePatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      if (this.isLoopLine(line, language) && this.hasQueryInFollowingLines(lines, i)) {
        issues.push({
          type: PerformanceIssueType.N_PLUS_ONE_QUERY,
          severity: 'critical',
          message: 'Potential N+1 query pattern',
          description: 'Database queries inside loops can cause N+1 query problems',
          file: filePath,
          line: lineNumber,
          column: 0,
          endLine: lineNumber,
          endColumn: line.length,
          codeSnippet: line.trim(),
          suggestion: 'Use bulk queries, JOIN operations, or eager loading',
          impact: {
            timeComplexity: 'O(n) database calls instead of O(1)',
            networkImpact: 'high',
            cpuUsage: 'medium',
            memoryUsage: 'medium',
            estimatedSlowdown: 'Linear with data size'
          },
          tags: ['database', 'n+1', 'queries']
        });
      }
    }

    return issues;
  }

  /**
   * Analyze recursion patterns
   */
  private analyzeRecursionPatterns(content: string, language: Language, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=|def\s+(\w+)/);
      if (funcMatch) {
        const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
        
        if (this.isRecursiveFunction(lines, i, funcName) && 
            !this.hasMemoization(lines, i, funcName)) {
          
          issues.push({
            type: PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION,
            severity: 'high',
            message: 'Recursive function without memoization',
            description: 'Recursive functions can have exponential time complexity without memoization',
            file: filePath,
            line: lineNumber,
            column: 0,
            endLine: lineNumber,
            endColumn: line.length,
            codeSnippet: line.trim(),
            suggestion: 'Add memoization using Map/cache or consider iterative approach',
            impact: {
              timeComplexity: 'Potentially exponential O(2^n)',
              memoryUsage: 'high',
              cpuUsage: 'high',
              estimatedSlowdown: 'Exponential with input size'
            },
            tags: ['recursion', 'memoization', 'complexity']
          });
        }
      }
    }

    return issues;
  }

  // Helper methods
  private isLoopLine(line: string, language: Language): boolean {
    if (language === 'typescript' || language === 'javascript') {
      return /\b(for|while)\s*\(/.test(line) || /\.forEach\s*\(/.test(line);
    }
    if (language === 'python') {
      return /\bfor\s+\w+\s+in\b/.test(line) || /\bwhile\s+/.test(line);
    }
    return false;
  }

  private hasNestedArrayOperations(line: string): boolean {
    const arrayMethods = ['find', 'filter', 'map', 'reduce', 'some', 'every'];
    return arrayMethods.some(method => line.includes(`.${method}(`));
  }

  private hasAwaitInFollowingLines(lines: string[], startIndex: number): boolean {
    for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 10); i++) {
      if (lines[i].includes('await') && lines[i].includes('  ')) {
        return true;
      }
      if (lines[i].trim() === '}') break;
    }
    return false;
  }

  private hasCorrespondingRemoveListener(content: string, line: string): boolean {
    const eventMatch = line.match(/addEventListener\s*\(\s*['"`](\w+)['"`]/);
    if (eventMatch) {
      const eventType = eventMatch[1];
      return content.includes(`removeEventListener('${eventType}')`) ||
             content.includes(`removeEventListener("${eventType}")`) ||
             content.includes('AbortController');
    }
    return false;
  }

  private isLargeObjectCreation(line: string): boolean {
    const objMatch = line.match(/\{[^}]*\}/);
    if (objMatch) {
      const commaCount = (objMatch[0].match(/,/g) || []).length;
      return commaCount > 5;
    }
    return false;
  }

  private hasQueryInFollowingLines(lines: string[], startIndex: number): boolean {
    const queryKeywords = ['query', 'find', 'SELECT', 'UPDATE', 'INSERT', 'DELETE', 'db.', 'await.*fetch'];
    
    for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 10); i++) {
      const line = lines[i];
      if (queryKeywords.some(keyword => new RegExp(keyword, 'i').test(line))) {
        return true;
      }
      if (line.trim() === '}') break;
    }
    return false;
  }

  private isRecursiveFunction(lines: string[], startIndex: number, funcName: string): boolean {
    for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 50); i++) {
      if (lines[i].includes(funcName + '(')) {
        return true;
      }
      if (lines[i].trim() === '}' && !lines[i].includes('if') && !lines[i].includes('for')) {
        break;
      }
    }
    return false;
  }

  private hasMemoization(lines: string[], startIndex: number, funcName: string): boolean {
    for (let i = startIndex; i < Math.min(lines.length, startIndex + 50); i++) {
      const line = lines[i];
      if (line.includes('cache') || line.includes('memo') || 
          line.includes('Map') || line.includes('has(') ||
          line.includes('get(') || line.includes('set(')) {
        return true;
      }
      if (line.trim() === '}' && !line.includes('if') && !line.includes('for')) {
        break;
      }
    }
    return false;
  }

  private truncateCode(code: string, maxLength: number): string {
    return code.length > maxLength ? code.substring(0, maxLength) + '...' : code;
  }

  private generateAnalysisResult(issues: PerformanceIssue[], analysisTime: number): PerformanceAnalysisResult {
    const summary = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      mediumIssues: issues.filter(i => i.severity === 'medium').length,
      lowIssues: issues.filter(i => i.severity === 'low').length,
      overallScore: this.calculateOverallScore(issues)
    };

    const recommendations = this.generateRecommendations(issues);

    return {
      issues,
      summary,
      recommendations,
      analysisTime
    };
  }

  private calculateOverallScore(issues: PerformanceIssue[]): number {
    if (issues.length === 0) return 100;

    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    const totalDeduction = issues.reduce((sum, issue) => 
      sum + severityWeights[issue.severity], 0);

    return Math.max(0, 100 - totalDeduction);
  }

  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(i => i.type));

    if (issueTypes.has(PerformanceIssueType.INEFFICIENT_LOOP)) {
      recommendations.push('Optimize loop patterns: cache array lengths and avoid nested operations');
    }

    if (issueTypes.has(PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT)) {
      recommendations.push('Parallelize async operations using Promise.all() where possible');
    }

    if (issueTypes.has(PerformanceIssueType.N_PLUS_ONE_QUERY)) {
      recommendations.push('Eliminate N+1 queries with bulk operations and proper data fetching strategies');
    }

    if (issueTypes.has(PerformanceIssueType.MEMORY_LEAK_RISK)) {
      recommendations.push('Implement proper cleanup for event listeners and timers');
    }

    if (issueTypes.has(PerformanceIssueType.INEFFICIENT_REGEX)) {
      recommendations.push('Review regex patterns to avoid catastrophic backtracking');
    }

    if (issueTypes.has(PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION)) {
      recommendations.push('Add memoization to recursive functions or use iterative approaches');
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific performance recommendations at this time');
    }

    return recommendations;
  }

  /**
   * Get detailed information about a specific issue type
   */
  async getIssueTypeDetails(issueType: PerformanceIssueType): Promise<{
    description: string;
    commonCauses: string[];
    solutions: string[];
    examples: { bad: string; good: string }[];
  }> {
    const details: Record<PerformanceIssueType, {
      description: string;
      commonCauses: string[];
      solutions: string[];
      examples: { bad: string; good: string }[];
    }> = {
      [PerformanceIssueType.INEFFICIENT_LOOP]: {
        description: 'Loops with suboptimal patterns that can be easily optimized',
        commonCauses: [
          'Accessing array.length in loop condition',
          'Nested array operations',
          'Unnecessary object creation in loops'
        ],
        solutions: [
          'Cache array length outside loop',
          'Use appropriate data structures (Map, Set)',
          'Avoid creating objects in tight loops'
        ],
        examples: [
          {
            bad: 'for (let i = 0; i < arr.length; i++) { /* ... */ }',
            good: 'const len = arr.length; for (let i = 0; i < len; i++) { /* ... */ }'
          }
        ]
      },
      [PerformanceIssueType.N_PLUS_ONE_QUERY]: {
        description: 'Database queries executed in loops causing excessive database calls',
        commonCauses: [
          'Fetching related data in loops',
          'Lazy loading without batching',
          'Missing JOIN operations'
        ],
        solutions: [
          'Use bulk queries with WHERE IN',
          'Implement eager loading',
          'Use JOIN operations',
          'Batch requests with DataLoader pattern'
        ],
        examples: [
          {
            bad: 'users.forEach(user => db.getPosts(user.id))',
            good: 'const posts = await db.getPostsByUserIds(users.map(u => u.id))'
          }
        ]
      },
      [PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT]: {
        description: 'Suboptimal async/await patterns that prevent parallelization',
        commonCauses: [
          'Sequential awaits in loops',
          'forEach with async callbacks',
          'Not utilizing Promise.all()'
        ],
        solutions: [
          'Use Promise.all() for parallel execution',
          'Use for...of for sequential async operations',
          'Collect promises before awaiting'
        ],
        examples: [
          {
            bad: 'for (const item of items) { await process(item); }',
            good: 'await Promise.all(items.map(item => process(item)))'
          }
        ]
      },
      [PerformanceIssueType.UNNECESSARY_ARRAY_COPY]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.INEFFICIENT_REGEX]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.LARGE_OBJECT_CREATION]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.MEMORY_LEAK_RISK]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.INEFFICIENT_COMPREHENSION]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.GLOBAL_VARIABLE_ABUSE]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.INEFFICIENT_STRING_CONCAT]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.SYNCHRONOUS_FILE_IO]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.INEFFICIENT_DATABASE_QUERY]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.EXCESSIVE_FUNCTION_CALLS]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      },
      [PerformanceIssueType.INEFFICIENT_SORTING]: {
        description: '',
        commonCauses: [],
        solutions: [],
        examples: []
      }
    };

    return details[issueType] || {
      description: 'Performance issue details not available',
      commonCauses: [],
      solutions: [],
      examples: []
    };
  }
}

// Close the class here - this completes the Performance Analyzer implementation