// packages/core/src/analyzers/security.ts

import { Language, Severity } from '@github-ai/shared';
import { ASTNode, astParser } from '../parsers/ast-parser';

export interface SecurityIssue {
  type: SecurityVulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  line: number;
  column: number;
  evidence: string;
  suggestion: string;
  cweId?: string; // Common Weakness Enumeration ID
  confidence: number; // 0-1
}

export interface SecurityAnalysisResult {
  issues: SecurityIssue[];
  summary: SecuritySummary;
  analysisTime: number;
}

export interface SecuritySummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  categories: Record<SecurityVulnerabilityType, number>;
  securityScore: number; // 0-100
}

export type SecurityVulnerabilityType = 
  | 'sql_injection'
  | 'xss'
  | 'path_traversal'
  | 'command_injection'
  | 'hardcoded_secrets'
  | 'weak_crypto'
  | 'insecure_random'
  | 'unsafe_deserialization'
  | 'prototype_pollution'
  | 'regex_dos'
  | 'open_redirect'
  | 'csrf'
  | 'information_disclosure'
  | 'insecure_transport'
  | 'weak_authentication';

interface SecurityRule {
  id: string;
  type: SecurityVulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  cweId?: string;
  patterns: SecurityPattern[];
  languages: Language[];
  confidence: number;
}

interface SecurityPattern {
  type: 'regex' | 'ast_node' | 'function_call';
  pattern: string | RegExp;
  context?: string[];
  excludePatterns?: (string | RegExp)[];
}

export class SecurityAnalyzer {
  analyzeSecurity(content: string, language: string, filePath: string | undefined): any {
    throw new Error('Method not implemented.');
  }
  private securityRules: Map<Language, SecurityRule[]>;

  constructor() {
    this.securityRules = this.initializeSecurityRules();
  }

  /**
   * Analyze code for security vulnerabilities
   */
  async analyzeCode(code: string, language: Language, filePath: string = ''): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const issues: SecurityIssue[] = [];
    
    // Get language-specific rules
    const rules = this.securityRules.get(language) || [];
    
    try {
      // Try AST-based analysis first
      const parseResult = await astParser.parseCode(code, language);
      
      if (parseResult.success && parseResult.ast) {
        // AST-based analysis
        for (const rule of rules) {
          const ruleIssues = await this.analyzeWithAST(code, parseResult.ast, rule, filePath);
          issues.push(...ruleIssues);
        }
      } else {
        // Fallback to regex-based analysis
        for (const rule of rules) {
          const ruleIssues = this.analyzeWithRegex(code, rule, filePath);
          issues.push(...ruleIssues);
        }
      }
      
    } catch (error) {
      console.warn('Security analysis failed, using regex fallback:', error);
      
      // Fallback to regex-based analysis
      for (const rule of rules) {
        const ruleIssues = this.analyzeWithRegex(code, rule, filePath);
        issues.push(...ruleIssues);
      }
    }

    const summary = this.generateSummary(issues);
    const analysisTime = Date.now() - startTime;

    return {
      issues,
      summary,
      analysisTime
    };
  }

  /**
   * AST-based security analysis
   */
  private async analyzeWithAST(code: string, ast: ASTNode, rule: SecurityRule, filePath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    const traverse = (node: ASTNode) => {
      for (const pattern of rule.patterns) {
        if (pattern.type === 'ast_node') {
          if (this.matchesASTPattern(node, pattern)) {
            // Check if it's a real vulnerability (not a false positive)
            if (!this.isExcluded(node.text, pattern.excludePatterns)) {
              const issue: SecurityIssue = {
                type: rule.type,
                severity: rule.severity,
                title: rule.title,
                description: rule.description,
                line: node.startLine,
                column: node.startColumn,
                evidence: this.extractEvidence(node.text, lines, node.startLine),
                suggestion: this.generateSuggestion(rule.type, node.text),
                cweId: rule.cweId,
                confidence: rule.confidence
              };
              issues.push(issue);
            }
          }
        } else if (pattern.type === 'function_call') {
          if (this.matchesFunctionCall(node, pattern)) {
            if (!this.isExcluded(node.text, pattern.excludePatterns)) {
              const issue: SecurityIssue = {
                type: rule.type,
                severity: rule.severity,
                title: rule.title,
                description: rule.description,
                line: node.startLine,
                column: node.startColumn,
                evidence: this.extractEvidence(node.text, lines, node.startLine),
                suggestion: this.generateSuggestion(rule.type, node.text),
                cweId: rule.cweId,
                confidence: rule.confidence
              };
              issues.push(issue);
            }
          }
        }
      }

      // Recursively analyze children
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(ast);
    return issues;
  }

  /**
   * Regex-based security analysis (fallback)
   */
  private analyzeWithRegex(code: string, rule: SecurityRule, filePath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    for (const pattern of rule.patterns) {
      if (pattern.type === 'regex' && pattern.pattern instanceof RegExp) {
        const regex = pattern.pattern;
        
        lines.forEach((line, index) => {
          const matches = line.match(regex);
          if (matches && !this.isExcluded(line, pattern.excludePatterns)) {
            const issue: SecurityIssue = {
              type: rule.type,
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              line: index + 1,
              column: line.indexOf(matches[0]),
              evidence: this.extractEvidence(line, lines, index + 1),
              suggestion: this.generateSuggestion(rule.type, line),
              cweId: rule.cweId,
              confidence: rule.confidence
            };
            issues.push(issue);
          }
        });
      }
    }

    return issues;
  }

  /**
   * Check if AST node matches security pattern
   */
  private matchesASTPattern(node: ASTNode, pattern: SecurityPattern): boolean {
    if (pattern.type !== 'ast_node') return false;
    
    const patternStr = pattern.pattern as string;
    
    // Check node type
    if (node.type === patternStr) return true;
    
    // Check node content
    if (node.text.includes(patternStr)) return true;
    
    return false;
  }

  /**
   * Check if AST node represents a dangerous function call
   */
  private matchesFunctionCall(node: ASTNode, pattern: SecurityPattern): boolean {
    if (pattern.type !== 'function_call') return false;
    
    const functionName = pattern.pattern as string;
    
    // Check if this is a call expression with the dangerous function
    if (node.type === 'call_expression' || node.type === 'function_call') {
      return node.text.includes(functionName);
    }
    
    return false;
  }

  /**
   * Check if match should be excluded (reduce false positives)
   */
  private isExcluded(text: string, excludePatterns?: (string | RegExp)[]): boolean {
    if (!excludePatterns) return false;
    
    return excludePatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(text);
      } else {
        return text.includes(pattern);
      }
    });
  }

  /**
   * Extract evidence around the vulnerability
   */
  private extractEvidence(matchText: string, lines: string[], lineNumber: number): string {
    const contextLines = 2;
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    const context = lines.slice(start, end).map((line, index) => {
      const actualLineNumber = start + index + 1;
      const marker = actualLineNumber === lineNumber ? '> ' : '  ';
      return `${marker}${actualLineNumber}: ${line}`;
    }).join('\n');
    
    return context;
  }

  /**
   * Generate security suggestion based on vulnerability type
   */
  private generateSuggestion(type: SecurityVulnerabilityType, evidence: string): string {
    const suggestions: Record<SecurityVulnerabilityType, string> = {
      sql_injection: 'Use parameterized queries or prepared statements instead of string concatenation',
      xss: 'Sanitize user input and use proper output encoding',
      path_traversal: 'Validate and sanitize file paths, use allowlists for allowed paths',
      command_injection: 'Avoid executing user input as commands, use allowlists for allowed commands',
      hardcoded_secrets: 'Move secrets to environment variables or secure credential stores',
      weak_crypto: 'Use strong encryption algorithms (AES-256, RSA-2048+) and proper implementations',
      insecure_random: 'Use cryptographically secure random number generators',
      unsafe_deserialization: 'Validate serialized data and use safe deserialization methods',
      prototype_pollution: 'Validate object properties and use Map instead of plain objects',
      regex_dos: 'Review regex patterns for potential ReDoS vulnerabilities',
      open_redirect: 'Validate redirect URLs against an allowlist',
      csrf: 'Implement CSRF tokens and verify origin headers',
      information_disclosure: 'Remove sensitive information from error messages and logs',
      insecure_transport: 'Use HTTPS/TLS for all sensitive communications',
      weak_authentication: 'Implement strong authentication mechanisms and session management'
    };
    
    return suggestions[type] || 'Review this code for potential security implications';
  }

  /**
   * Generate security analysis summary
   */
  private generateSummary(issues: SecurityIssue[]): SecuritySummary {
    const summary: SecuritySummary = {
      totalIssues: issues.length,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      categories: {} as Record<SecurityVulnerabilityType, number>,
      securityScore: 100
    };

    // Count by severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          summary.criticalIssues++;
          break;
        case 'high':
          summary.highIssues++;
          break;
        case 'medium':
          summary.mediumIssues++;
          break;
        case 'low':
          summary.lowIssues++;
          break;
      }

      // Count by category
      summary.categories[issue.type] = (summary.categories[issue.type] || 0) + 1;
    }

    // Calculate security score
    const severityWeights = { critical: 25, high: 10, medium: 5, low: 1 };
    const totalPenalty = 
      summary.criticalIssues * severityWeights.critical +
      summary.highIssues * severityWeights.high +
      summary.mediumIssues * severityWeights.medium +
      summary.lowIssues * severityWeights.low;

    summary.securityScore = Math.max(0, 100 - totalPenalty);

    return summary;
  }

  /**
   * Initialize security rules for different languages
   */
  private initializeSecurityRules(): Map<Language, SecurityRule[]> {
    const rules = new Map<Language, SecurityRule[]>();

    // TypeScript/JavaScript security rules
    const jsRules: SecurityRule[] = [
      {
        id: 'js_sql_injection',
        type: 'sql_injection',
        severity: 'high',
        title: 'Potential SQL Injection',
        description: 'Dynamic SQL query construction detected',
        cweId: 'CWE-89',
        patterns: [
          {
            type: 'regex',
            pattern: /query\s*=\s*["`'].*\+.*["`']/i,
            excludePatterns: [/\/\*.*\*\//, /\/\/.*$/]
          },
          {
            type: 'function_call',
            pattern: 'query',
            context: ['string concatenation']
          }
        ],
        languages: ['typescript', 'javascript'],
        confidence: 0.8
      },
      {
        id: 'js_xss',
        type: 'xss',
        severity: 'high',
        title: 'Potential XSS Vulnerability',
        description: 'Unsafe HTML content insertion detected',
        cweId: 'CWE-79',
        patterns: [
          {
            type: 'regex',
            pattern: /\.innerHTML\s*=\s*.*\+/i
          },
          {
            type: 'function_call',
            pattern: 'dangerouslySetInnerHTML'
          }
        ],
        languages: ['typescript', 'javascript'],
        confidence: 0.7
      },
      {
        id: 'js_hardcoded_secrets',
        type: 'hardcoded_secrets',
        severity: 'critical',
        title: 'Hardcoded Secret Detected',
        description: 'Potential API key or password found in code',
        cweId: 'CWE-798',
        patterns: [
          {
            type: 'regex',
            pattern: /(api[_-]?key|password|secret|token)\s*[:=]\s*['"]\w{8,}['"]/i,
            excludePatterns: [/test/i, /example/i, /placeholder/i]
          }
        ],
        languages: ['typescript', 'javascript'],
        confidence: 0.9
      },
      {
        id: 'js_command_injection',
        type: 'command_injection',
        severity: 'high',
        title: 'Potential Command Injection',
        description: 'Dynamic command execution detected',
        cweId: 'CWE-78',
        patterns: [
          {
            type: 'function_call',
            pattern: 'exec',
            excludePatterns: [/^['"]\w+['"]$/] // Exclude static commands
          },
          {
            type: 'function_call',
            pattern: 'spawn'
          }
        ],
        languages: ['typescript', 'javascript'],
        confidence: 0.8
      }
    ];

    // Python security rules
    const pythonRules: SecurityRule[] = [
      {
        id: 'py_sql_injection',
        type: 'sql_injection',
        severity: 'high',
        title: 'Potential SQL Injection',
        description: 'Dynamic SQL query construction detected',
        cweId: 'CWE-89',
        patterns: [
          {
            type: 'regex',
            pattern: /execute\s*\(\s*f?["`'].*%.*["`']/i
          },
          {
            type: 'regex',
            pattern: /query\s*=\s*f?["`'].*\{.*\}.*["`']/i
          }
        ],
        languages: ['python'],
        confidence: 0.8
      },
      {
        id: 'py_hardcoded_secrets',
        type: 'hardcoded_secrets',
        severity: 'critical',
        title: 'Hardcoded Secret Detected',
        description: 'Potential API key or password found in code',
        cweId: 'CWE-798',
        patterns: [
          {
            type: 'regex',
            pattern: /(api[_-]?key|password|secret|token)\s*=\s*['"]\w{8,}['"]/i,
            excludePatterns: [/test/i, /example/i, /placeholder/i]
          }
        ],
        languages: ['python'],
        confidence: 0.9
      },
      {
        id: 'py_command_injection',
        type: 'command_injection',
        severity: 'high',
        title: 'Potential Command Injection',
        description: 'Dynamic command execution detected',
        cweId: 'CWE-78',
        patterns: [
          {
            type: 'function_call',
            pattern: 'os.system'
          },
          {
            type: 'function_call',
            pattern: 'subprocess.call'
          }
        ],
        languages: ['python'],
        confidence: 0.8
      }
    ];

    rules.set('typescript', jsRules);
    rules.set('javascript', jsRules);
    rules.set('python', pythonRules);

    return rules;
  }
}

// Export singleton instance
export const securityAnalyzer = new SecurityAnalyzer();