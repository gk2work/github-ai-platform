// packages/core/src/analyzers/security.ts
// Step 1A: Complete SecurityAnalyzer Implementation

import { Language, AnalysisResult, AnalysisCategory, Severity, FileLocation } from '@github-ai/shared';
import { createAnalysisResult } from '../utils/analysis-utils';

export interface SecurityIssue {
  type: SecurityIssueType;
  title: string;
  description: string;
  severity: Severity;
  location: FileLocation;
  evidence: string;
  cweId?: string; // Common Weakness Enumeration ID
  suggestion: string;
  confidence: number;
}

export enum SecurityIssueType {
  SQL_INJECTION = 'sql_injection',
  XSS_VULNERABILITY = 'xss_vulnerability',
  HARDCODED_SECRET = 'hardcoded_secret',
  INSECURE_CRYPTO = 'insecure_crypto',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  UNSAFE_EVAL = 'unsafe_eval',
  WEAK_AUTHENTICATION = 'weak_authentication',
  INSECURE_DESERIALIZATION = 'insecure_deserialization',
  MISSING_AUTHORIZATION = 'missing_authorization',
  INSECURE_RANDOM = 'insecure_random',
  REGEX_DOS = 'regex_dos',
  UNSAFE_REDIRECT = 'unsafe_redirect'
}

export interface SecurityAnalysisResult {
  issues: SecurityIssue[];
  summary: SecuritySummary;
  executionTime: number;
  scannedPatterns: number;
}

export interface SecuritySummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issuesByType: Record<SecurityIssueType, number>;
  overallRiskScore: number; // 0-100
  recommendations: string[];
}

export class SecurityAnalyzer {
  private securityPatterns: SecurityPattern[] = [];

  constructor() {
    this.initializeSecurityPatterns();
  }

  /**
   * Analyze code for security vulnerabilities
   */
  async analyzeSecurity(
    content: string,
    language: Language,
    filePath?: string
  ): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const issues: SecurityIssue[] = [];
    
    // Run all security checks
    const patterns = this.getLanguageSpecificPatterns(language);
    let scannedPatterns = 0;

    for (const pattern of patterns) {
      try {
        const patternIssues = await this.scanPattern(content, pattern, filePath);
        issues.push(...patternIssues);
        scannedPatterns++;
      } catch (error) {
        console.warn(`Security pattern scan failed: ${pattern.name}`, error);
      }
    }

    const summary = this.generateSecuritySummary(issues);
    
    return {
      issues,
      summary,
      executionTime: Date.now() - startTime,
      scannedPatterns
    };
  }

  /**
   * Quick security scan for specific vulnerability types
   */
  async quickSecurityScan(
    content: string,
    language: Language,
    issueTypes: SecurityIssueType[]
  ): Promise<SecurityIssue[]> {
    const patterns = this.securityPatterns.filter(p => 
      issueTypes.includes(p.issueType) && p.languages.includes(language)
    );

    const issues: SecurityIssue[] = [];
    
    for (const pattern of patterns) {
      const patternIssues = await this.scanPattern(content, pattern);
      issues.push(...patternIssues);
    }

    return issues;
  }

  /**
   * Initialize security patterns for different vulnerability types
   */
  private initializeSecurityPatterns(): void {
    this.securityPatterns = [
      // SQL Injection patterns
      {
        name: 'SQL Injection - String Concatenation',
        issueType: SecurityIssueType.SQL_INJECTION,
        languages: ['typescript', 'javascript', 'python', 'java'],
        pattern: /(['"`])\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*\+.*\1/gi,
        severity: 'critical',
        cweId: 'CWE-89',
        description: 'SQL query constructed with string concatenation',
        suggestion: 'Use parameterized queries or prepared statements'
      },
      
      // XSS Vulnerabilities
      {
        name: 'XSS - innerHTML Usage',
        issueType: SecurityIssueType.XSS_VULNERABILITY,
        languages: ['typescript', 'javascript'],
        pattern: /\.innerHTML\s*=\s*.*\+/g,
        severity: 'high',
        cweId: 'CWE-79',
        description: 'Direct innerHTML assignment with concatenated content',
        suggestion: 'Use textContent or proper sanitization libraries'
      },

      // Hardcoded Secrets
      {
        name: 'Hardcoded API Key',
        issueType: SecurityIssueType.HARDCODED_SECRET,
        languages: ['typescript', 'javascript', 'python', 'java', 'go'],
        pattern: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9]{16,}['\"]/gi,
        severity: 'critical',
        cweId: 'CWE-798',
        description: 'Hardcoded API key or secret detected',
        suggestion: 'Store secrets in environment variables or secure key management'
      },

      // Insecure Crypto
      {
        name: 'Weak Cryptographic Hash',
        issueType: SecurityIssueType.INSECURE_CRYPTO,
        languages: ['typescript', 'javascript', 'python', 'java'],
        pattern: /\b(md5|sha1)\b/gi,
        severity: 'medium',
        cweId: 'CWE-328',
        description: 'Use of weak cryptographic hash function',
        suggestion: 'Use SHA-256 or stronger hash functions'
      },

      // Command Injection
      {
        name: 'Command Injection - exec/eval',
        issueType: SecurityIssueType.COMMAND_INJECTION,
        languages: ['typescript', 'javascript', 'python'],
        pattern: /\b(exec|system|eval|execSync)\s*\(\s*.*\+/g,
        severity: 'critical',
        cweId: 'CWE-78',
        description: 'Command execution with concatenated user input',
        suggestion: 'Use parameterized commands or input validation'
      },

      // Path Traversal
      {
        name: 'Path Traversal - File Access',
        issueType: SecurityIssueType.PATH_TRAVERSAL,
        languages: ['typescript', 'javascript', 'python', 'java'],
        pattern: /\.\.\//g,
        severity: 'high',
        cweId: 'CWE-22',
        description: 'Potential path traversal vulnerability',
        suggestion: 'Validate and sanitize file paths'
      },

      // Unsafe eval
      {
        name: 'Unsafe eval Usage',
        issueType: SecurityIssueType.UNSAFE_EVAL,
        languages: ['typescript', 'javascript'],
        pattern: /\beval\s*\(/g,
        severity: 'high',
        cweId: 'CWE-95',
        description: 'Use of eval() function',
        suggestion: 'Avoid eval() or use safer alternatives like JSON.parse()'
      },

      // Regex DoS
      {
        name: 'ReDoS - Catastrophic Backtracking',
        issueType: SecurityIssueType.REGEX_DOS,
        languages: ['typescript', 'javascript', 'python', 'java'],
        pattern: /\/.*\(\.\*\+.*\)\+.*\/|\/.*\(\.\+\*.*\)\*.*\//g,
        severity: 'medium',
        cweId: 'CWE-1333',
        description: 'Regular expression vulnerable to ReDoS attacks',
        suggestion: 'Review regex pattern for catastrophic backtracking'
      },

      // Insecure Random
      {
        name: 'Insecure Random Number Generation',
        issueType: SecurityIssueType.INSECURE_RANDOM,
        languages: ['typescript', 'javascript', 'java'],
        pattern: /Math\.random\(\)|Random\(\)|new Random\(\)/g,
        severity: 'medium',
        cweId: 'CWE-338',
        description: 'Use of insecure random number generator',
        suggestion: 'Use cryptographically secure random generators'
      }
    ];
  }

  /**
   * Scan content for a specific security pattern
   */
  private async scanPattern(
    content: string,
    pattern: SecurityPattern,
    filePath?: string
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');
    
    let match;
    while ((match = pattern.pattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const location: FileLocation = {
        file: filePath || 'unknown',
        line: lineNumber,
        column: columnNumber,
        endLine: lineNumber,
        endColumn: columnNumber + match[0].length
      };

      const issue: SecurityIssue = {
        type: pattern.issueType,
        title: pattern.name,
        description: pattern.description,
        severity: pattern.severity,
        location,
        evidence: match[0],
        cweId: pattern.cweId,
        suggestion: pattern.suggestion,
        confidence: this.calculateConfidence(pattern, match[0])
      };

      issues.push(issue);
    }

    return issues;
  }

  /**
   * Get language-specific security patterns
   */
  private getLanguageSpecificPatterns(language: Language): SecurityPattern[] {
    return this.securityPatterns.filter(pattern => 
      pattern.languages.includes(language)
    );
  }

  /**
   * Generate security analysis summary
   */
  private generateSecuritySummary(issues: SecurityIssue[]): SecuritySummary {
    const issuesByType: Record<SecurityIssueType, number> = {} as Record<SecurityIssueType, number>;
    
    // Initialize counts
    Object.values(SecurityIssueType).forEach(type => {
      issuesByType[type] = 0;
    });

    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    issues.forEach(issue => {
      issuesByType[issue.type]++;
      
      switch (issue.severity) {
        case 'critical': criticalIssues++; break;
        case 'high': highIssues++; break;
        case 'medium': mediumIssues++; break;
        case 'low': lowIssues++; break;
      }
    });

    const overallRiskScore = this.calculateRiskScore(
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues
    );

    const recommendations = this.generateSecurityRecommendations(issues);

    return {
      totalIssues: issues.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issuesByType,
      overallRiskScore,
      recommendations
    };
  }

  /**
   * Calculate overall security risk score (0-100)
   */
  private calculateRiskScore(
    critical: number,
    high: number,
    medium: number,
    low: number
  ): number {
    const maxScore = 100;
    const weights = { critical: 25, high: 10, medium: 3, low: 1 };
    
    const totalScore = (critical * weights.critical) +
                      (high * weights.high) +
                      (medium * weights.medium) +
                      (low * weights.low);
    
    return Math.min(totalScore, maxScore);
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === SecurityIssueType.SQL_INJECTION)) {
      recommendations.push('Implement parameterized queries to prevent SQL injection');
    }
    
    if (issues.some(i => i.type === SecurityIssueType.XSS_VULNERABILITY)) {
      recommendations.push('Sanitize user input and use secure DOM manipulation methods');
    }
    
    if (issues.some(i => i.type === SecurityIssueType.HARDCODED_SECRET)) {
      recommendations.push('Move secrets to environment variables or secure key management');
    }
    
    if (issues.some(i => i.type === SecurityIssueType.INSECURE_CRYPTO)) {
      recommendations.push('Upgrade to secure cryptographic algorithms');
    }

    if (issues.length > 10) {
      recommendations.push('Consider implementing automated security testing in CI/CD pipeline');
    }

    return recommendations;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(pattern: SecurityPattern, evidence: string): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence for exact dangerous patterns
    if (evidence.includes('eval(') || evidence.includes('innerHTML =')) {
      confidence += 0.2;
    }
    
    // Decrease confidence for common false positives
    if (evidence.includes('test') || evidence.includes('example')) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get column number from character index
   */
  private getColumnNumber(content: string, index: number): number {
    const lastNewlineIndex = content.lastIndexOf('\n', index);
    return index - lastNewlineIndex;
  }
}

// Security pattern interface
interface SecurityPattern {
  name: string;
  issueType: SecurityIssueType;
  languages: Language[];
  pattern: RegExp;
  severity: Severity;
  cweId?: string;
  description: string;
  suggestion: string;
}

// Export for backward compatibility and integration
export const securityAnalyzer = new SecurityAnalyzer();