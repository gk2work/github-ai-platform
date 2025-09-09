// packages/core/src/analyzers/security-debug.ts
// Simplified version to debug the issue

import { Language, AnalysisResult, AnalysisCategory, Severity, FileLocation } from '@github-ai/shared';

export interface SecurityIssue {
  type: SecurityIssueType;
  title: string;
  description: string;
  severity: Severity;
  location: FileLocation;
  evidence: string;
  cweId?: string;
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
  overallRiskScore: number;
  recommendations: string[];
}

export class SecurityAnalyzer {
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
    
    console.log("=== DEBUG: Starting security analysis ===");
    console.log("Content length:", content.length);
    console.log("Language:", language);
    
    // Test each pattern individually
    try {
      // 1. SQL Injection
      const sqlIssues = this.detectSQLInjection(content, filePath);
      console.log("SQL issues found:", sqlIssues.length);
      issues.push(...sqlIssues);
      
      // 2. Hardcoded Secrets
      const secretIssues = this.detectHardcodedSecrets(content, filePath);
      console.log("Secret issues found:", secretIssues.length);
      issues.push(...secretIssues);
      
      // 3. XSS
      const xssIssues = this.detectXSS(content, filePath);
      console.log("XSS issues found:", xssIssues.length);
      issues.push(...xssIssues);
      
      // 4. Command Injection
      const cmdIssues = this.detectCommandInjection(content, filePath);
      console.log("Command injection issues found:", cmdIssues.length);
      issues.push(...cmdIssues);
      
      // 5. Unsafe eval
      const evalIssues = this.detectUnsafeEval(content, filePath);
      console.log("Eval issues found:", evalIssues.length);
      issues.push(...evalIssues);
      
      // 6. Insecure crypto
      const cryptoIssues = this.detectInsecureCrypto(content, filePath);
      console.log("Crypto issues found:", cryptoIssues.length);
      issues.push(...cryptoIssues);
      
    } catch (error) {
      console.error("Error during security analysis:", error);
    }

    console.log("Total issues found:", issues.length);
    
    const summary = this.generateSecuritySummary(issues);
    
    return {
      issues,
      summary,
      executionTime: Date.now() - startTime,
      scannedPatterns: 6
    };
  }

  private detectSQLInjection(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /["'`][^"'`]*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)[^"'`]*["'`]\s*\+/gi;
    
    console.log("Testing SQL injection pattern...");
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      console.log("SQL match found:", match[0]);
      
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.SQL_INJECTION,
        title: 'SQL Injection - String Concatenation',
        description: 'SQL query constructed with string concatenation',
        severity: 'critical',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + match[0].length
        },
        evidence: match[0],
        cweId: 'CWE-89',
        suggestion: 'Use parameterized queries or prepared statements',
        confidence: 0.9
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

  private detectHardcodedSecrets(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['""][a-zA-Z0-9-_]{16,}['"]/gi;
    
    console.log("Testing hardcoded secrets pattern...");
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      console.log("Secret match found:", match[0]);
      
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.HARDCODED_SECRET,
        title: 'Hardcoded API Key',
        description: 'Hardcoded API key or secret detected',
        severity: 'critical',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + match[0].length
        },
        evidence: match[0],
        cweId: 'CWE-798',
        suggestion: 'Store secrets in environment variables or secure key management',
        confidence: 0.9
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

  private detectXSS(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /\.innerHTML\s*=\s*.*\+/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.XSS_VULNERABILITY,
        title: 'XSS - innerHTML Usage',
        description: 'Direct innerHTML assignment with concatenated content',
        severity: 'high',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + match[0].length
        },
        evidence: match[0],
        cweId: 'CWE-79',
        suggestion: 'Use textContent or proper sanitization libraries',
        confidence: 0.8
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

  private detectCommandInjection(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    // Look for string concatenation + exec patterns
    const concatPattern = /['"`][^'"`]*['"`]\s*\+/g;
    const execPattern = /\b(exec|execSync|system)\s*\(/g;
    
    let concatMatch;
    while ((concatMatch = concatPattern.exec(content)) !== null) {
      const concatLine = this.getLineNumber(content, concatMatch.index);
      
      // Look for exec calls within 5 lines
      let execMatch;
      execPattern.lastIndex = 0;
      while ((execMatch = execPattern.exec(content)) !== null) {
        const execLine = this.getLineNumber(content, execMatch.index);
        
        if (Math.abs(execLine - concatLine) <= 5) {
          const issue: SecurityIssue = {
            type: SecurityIssueType.COMMAND_INJECTION,
            title: 'Command Injection - String Concatenation',
            description: 'Command execution with concatenated strings detected',
            severity: 'critical',
            location: {
              file: filePath || 'unknown',
              line: concatLine,
              column: this.getColumnNumber(content, concatMatch.index),
              endLine: execLine,
              endColumn: this.getColumnNumber(content, execMatch.index) + execMatch[0].length
            },
            evidence: `${concatMatch[0]} ... ${execMatch[0]}`,
            cweId: 'CWE-78',
            suggestion: 'Use parameterized commands or input validation',
            confidence: 0.8
          };
          
          issues.push(issue);
          break;
        }
      }
      execPattern.lastIndex = 0;
    }
    
    // Also check for direct exec with concatenation
    const directPattern = /\b(exec|execSync|system)\s*\(\s*['"`]?[^,)]*\+/g;
    let directMatch;
    while ((directMatch = directPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, directMatch.index);
      const columnNumber = this.getColumnNumber(content, directMatch.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.COMMAND_INJECTION,
        title: 'Command Injection - Direct Concatenation',
        description: 'Direct command execution with string concatenation',
        severity: 'critical',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + directMatch[0].length
        },
        evidence: directMatch[0],
        cweId: 'CWE-78',
        suggestion: 'Use parameterized commands or input validation',
        confidence: 0.9
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

  private detectUnsafeEval(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /\beval\s*\(/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.UNSAFE_EVAL,
        title: 'Unsafe eval Usage',
        description: 'Use of eval() function',
        severity: 'high',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + match[0].length
        },
        evidence: match[0],
        cweId: 'CWE-95',
        suggestion: 'Avoid eval() or use safer alternatives like JSON.parse()',
        confidence: 0.95
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

  private detectInsecureCrypto(content: string, filePath?: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /\b(md5|sha1)\b/gi;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);
      const columnNumber = this.getColumnNumber(content, match.index);
      
      const issue: SecurityIssue = {
        type: SecurityIssueType.INSECURE_CRYPTO,
        title: 'Weak Cryptographic Hash',
        description: 'Use of weak cryptographic hash function',
        severity: 'medium',
        location: {
          file: filePath || 'unknown',
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + match[0].length
        },
        evidence: match[0],
        cweId: 'CWE-328',
        suggestion: 'Use SHA-256 or stronger hash functions',
        confidence: 0.8
      };
      
      issues.push(issue);
    }
    
    return issues;
  }

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

  private calculateRiskScore(critical: number, high: number, medium: number, low: number): number {
    const weights = { critical: 25, high: 10, medium: 3, low: 1 };
    const totalScore = (critical * weights.critical) +
                      (high * weights.high) +
                      (medium * weights.medium) +
                      (low * weights.low);
    return Math.min(totalScore, 100);
  }

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

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private getColumnNumber(content: string, index: number): number {
    const lastNewlineIndex = content.lastIndexOf('\n', index);
    return index - lastNewlineIndex;
  }

  /**
   * Quick security scan for specific vulnerability types
   */
  async quickSecurityScan(
    content: string,
    language: Language,
    issueTypes: SecurityIssueType[]
  ): Promise<SecurityIssue[]> {
    const allResults = await this.analyzeSecurity(content, language);
    return allResults.issues.filter(issue => issueTypes.includes(issue.type));
  }
}