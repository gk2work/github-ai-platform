// packages/core/src/analyzers/pattern-detector.ts

import { Language, Severity } from '@github-ai/shared';
import { ASTNode, astParser } from '../parsers/ast-parser';

export interface PatternIssue {
  type: CodeSmellType;
  severity: Severity;
  title: string;
  description: string;
  line: number;
  column: number;
  endLine: number;
  evidence: string;
  suggestion: string;
  confidence: number;
  impact: 'readability' | 'maintainability' | 'performance' | 'reliability';
  effort: 'low' | 'medium' | 'high';
}

export interface PatternAnalysisResult {
  issues: PatternIssue[];
  summary: PatternSummary;
  goodPatterns: GoodPattern[];
  analysisTime: number;
}

export interface PatternSummary {
  totalIssues: number;
  issuesByType: Record<CodeSmellType, number>;
  issuesBySeverity: Record<Severity, number>;
  codeQualityScore: number;
  maintainabilityRating: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface GoodPattern {
  type: string;
  description: string;
  line: number;
  evidence: string;
}

export type CodeSmellType =
  | 'long_method'
  | 'long_parameter_list'
  | 'large_class'
  | 'duplicate_code'
  | 'dead_code'
  | 'magic_numbers'
  | 'god_object'
  | 'feature_envy'
  | 'data_clumps'
  | 'primitive_obsession'
  | 'switch_statements'
  | 'lazy_class'
  | 'speculative_generality'
  | 'temporary_field'
  | 'message_chains'
  | 'middle_man'
  | 'inappropriate_intimacy'
  | 'alternative_classes'
  | 'refused_bequest'
  | 'comments'
  | 'divergent_change'
  | 'shotgun_surgery';

interface PatternRule {
  id: string;
  type: CodeSmellType;
  severity: Severity;
  title: string;
  description: string;
  detector: PatternDetector;
  languages: Language[];
  thresholds: Record<string, number>;
}

type PatternDetector = (node: ASTNode, context: AnalysisContext) => PatternMatch[];

interface PatternMatch {
  confidence: number;
  evidence: string;
  suggestion: string;
  impact: 'readability' | 'maintainability' | 'performance' | 'reliability';
  effort: 'low' | 'medium' | 'high';
}

interface AnalysisContext {
  code: string;
  lines: string[];
  language: Language;
  filePath: string;
  fileSize: number;
}

export class PatternDetectorAnalyzer {
  private patternRules: Map<Language, PatternRule[]>;

  constructor() {
    this.patternRules = this.initializePatternRules();
  }

  /**
   * Analyze code for patterns and anti-patterns
   */
  async analyzePatterns(
    code: string,
    language: Language,
    filePath: string = ''
  ): Promise<PatternAnalysisResult> {
    const startTime = Date.now();
    const issues: PatternIssue[] = [];
    const goodPatterns: GoodPattern[] = [];

    const context: AnalysisContext = {
      code,
      lines: code.split('\n'),
      language,
      filePath,
      fileSize: code.length,
    };

    // Get language-specific rules
    const rules = this.patternRules.get(language) || [];

    try {
      // Parse code into AST
      const parseResult = await astParser.parseCode(code, language);

      if (parseResult.success && parseResult.ast) {
        // AST-based pattern detection - ADD AWAIT HERE
        const astIssues = await this.analyzeWithAST(parseResult.ast, rules, context);
        issues.push(...astIssues);

        goodPatterns.push(...this.detectGoodPatterns(parseResult.ast, context));
      } else {
        // Fallback to text-based analysis - REMOVE AWAIT HERE
        issues.push(...this.analyzeWithText(code, rules, context));
      }

      // Additional text-based checks that don't require AST
      issues.push(...this.analyzeTextPatterns(code, context));
    } catch (error) {
      console.warn('Pattern analysis failed, using text fallback:', error);
      issues.push(...this.analyzeWithText(code, rules, context));
    }

    const summary = this.generateSummary(issues);
    const analysisTime = Date.now() - startTime;

    return {
      issues,
      summary,
      goodPatterns,
      analysisTime,
    };
  }

  /**
   * AST-based pattern analysis
   */
  private async analyzeWithAST(
    ast: ASTNode,
    rules: PatternRule[],
    context: AnalysisContext
  ): Promise<PatternIssue[]> {
    const issues: PatternIssue[] = [];

    const traverse = (node: ASTNode) => {
      for (const rule of rules) {
        const matches = rule.detector(node, context);

        for (const match of matches) {
          const issue: PatternIssue = {
            type: rule.type,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            line: node.startLine,
            column: node.startColumn,
            endLine: node.endLine,
            evidence: match.evidence,
            suggestion: match.suggestion,
            confidence: match.confidence,
            impact: match.impact,
            effort: match.effort,
          };
          issues.push(issue);
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
   * Text-based pattern analysis (fallback)
   */
  private analyzeWithText(
    code: string,
    rules: PatternRule[],
    context: AnalysisContext
  ): PatternIssue[] {
    const issues: PatternIssue[] = [];

    // Simple text-based detection for basic patterns
    const lines = code.split('\n');

    // Check for long lines (code smell indicator)
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          type: 'long_method',
          severity: 'low',
          title: 'Long Line',
          description: 'Line exceeds recommended length',
          line: index + 1,
          column: 0,
          endLine: index + 1,
          evidence: line.substring(0, 100) + '...',
          suggestion: 'Consider breaking this line into multiple lines',
          confidence: 0.7,
          impact: 'readability',
          effort: 'low',
        });
      }
    });

    return issues; // Return PatternIssue[] directly, not Promise
  }

  /**
   * Additional text-based pattern checks
   */
  private analyzeTextPatterns(code: string, context: AnalysisContext): PatternIssue[] {
    const issues: PatternIssue[] = [];
    const lines = context.lines;

    // Magic numbers detection
    this.detectMagicNumbers(lines, issues);

    // Duplicate code detection (simple)
    this.detectDuplicateLines(lines, issues);

    // Dead code detection
    this.detectDeadCode(lines, issues, context.language);

    // Comment smells
    this.detectCommentSmells(lines, issues);

    return issues;
  }

  /**
   * Detect magic numbers in code
   */
  private detectMagicNumbers(lines: string[], issues: PatternIssue[]): void {
    const magicNumberPattern = /(?<![a-zA-Z_])(\d{2,})(?![a-zA-Z_])/g;
    const excludePatterns = [
      /console\.log/,
      /test/i,
      /spec/i,
      /\b(0|1|2|10|100|1000)\b/,
      /version/i,
      /port/i,
      /timeout/i,
    ];

    lines.forEach((line, index) => {
      if (excludePatterns.some(pattern => pattern.test(line))) return;

      const matches = line.match(magicNumberPattern);
      if (matches) {
        matches.forEach(match => {
          const number = parseInt(match);
          if (number > 1 && number !== 10 && number !== 100 && number !== 1000) {
            issues.push({
              type: 'magic_numbers',
              severity: 'medium',
              title: 'Magic Number',
              description: `Magic number ${match} should be replaced with a named constant`,
              line: index + 1,
              column: line.indexOf(match),
              endLine: index + 1,
              evidence: line.trim(),
              suggestion: `Replace ${match} with a named constant`,
              confidence: 0.8,
              impact: 'maintainability',
              effort: 'low',
            });
          }
        });
      }
    });
  }

  /**
   * Detect duplicate lines (simple implementation)
   */
  private detectDuplicateLines(lines: string[], issues: PatternIssue[]): void {
    const lineMap = new Map<string, number[]>();

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        if (!lineMap.has(trimmed)) {
          lineMap.set(trimmed, []);
        }
        lineMap.get(trimmed)!.push(index + 1);
      }
    });

    lineMap.forEach((lineNumbers, content) => {
      if (lineNumbers.length > 1) {
        issues.push({
          type: 'duplicate_code',
          severity: 'medium',
          title: 'Duplicate Code',
          description: `Line appears ${lineNumbers.length} times`,
          line: lineNumbers[0],
          column: 0,
          endLine: lineNumbers[0],
          evidence: content,
          suggestion: 'Consider extracting duplicated logic into a function',
          confidence: 0.7,
          impact: 'maintainability',
          effort: 'medium',
        });
      }
    });
  }

  /**
   * Detect potentially dead code
   */
  private detectDeadCode(lines: string[], issues: PatternIssue[], language: Language): void {
    const deadCodePatterns =
      language === 'javascript' || language === 'typescript'
        ? [/^\/\/.*/, /^\/\*.*\*\/$/, /if\s*\(\s*false\s*\)/, /if\s*\(\s*0\s*\)/]
        : [/^#.*/, /if\s+False:/, /if\s+0:/];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (deadCodePatterns.some(pattern => pattern.test(trimmed))) {
        if (
          trimmed.includes('if') &&
          (trimmed.includes('false') || trimmed.includes('False') || trimmed.includes('0'))
        ) {
          issues.push({
            type: 'dead_code',
            severity: 'low',
            title: 'Dead Code',
            description: 'Code that will never execute',
            line: index + 1,
            column: 0,
            endLine: index + 1,
            evidence: trimmed,
            suggestion: 'Remove dead code or fix the condition',
            confidence: 0.9,
            impact: 'maintainability',
            effort: 'low',
          });
        }
      }
    });
  }

  /**
   * Detect comment smells
   */
  private detectCommentSmells(lines: string[], issues: PatternIssue[]): void {
    const todoPattern = /(TODO|FIXME|HACK|XXX|BUG)/i;

    lines.forEach((line, index) => {
      if (todoPattern.test(line)) {
        issues.push({
          type: 'comments',
          severity: 'low',
          title: 'TODO Comment',
          description: 'TODO/FIXME comment indicates incomplete work',
          line: index + 1,
          column: 0,
          endLine: index + 1,
          evidence: line.trim(),
          suggestion: 'Address the TODO item or create a proper issue/ticket',
          confidence: 1.0,
          impact: 'maintainability',
          effort: 'medium',
        });
      }
    });
  }

  /**
   * Detect good patterns (positive feedback)
   */
  private detectGoodPatterns(ast: ASTNode, context: AnalysisContext): GoodPattern[] {
    const goodPatterns: GoodPattern[] = [];

    const traverse = (node: ASTNode) => {
      // Detect good naming conventions
      if (this.hasGoodNaming(node)) {
        goodPatterns.push({
          type: 'good_naming',
          description: 'Uses clear, descriptive naming',
          line: node.startLine,
          evidence: node.text.substring(0, 50),
        });
      }

      // Detect proper error handling
      if (this.hasProperErrorHandling(node)) {
        goodPatterns.push({
          type: 'error_handling',
          description: 'Implements proper error handling',
          line: node.startLine,
          evidence: 'try-catch block with meaningful error handling',
        });
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(ast);
    return goodPatterns;
  }

  /**
   * Check if node demonstrates good naming practices
   */
  private hasGoodNaming(node: ASTNode): boolean {
    if (node.type === 'identifier' && node.text.length > 3) {
      // Check for meaningful names (not just short abbreviations)
      return !/^[a-z]{1,3}$|^temp|^tmp|^test/.test(node.text);
    }
    return false;
  }

  /**
   * Check if node demonstrates proper error handling
   */
  private hasProperErrorHandling(node: ASTNode): boolean {
    return (
      node.type === 'try_statement' && node.children.some(child => child.type === 'catch_clause')
    );
  }

  /**
   * Generate pattern analysis summary
   */
  private generateSummary(issues: PatternIssue[]): PatternSummary {
    const summary: PatternSummary = {
      totalIssues: issues.length,
      issuesByType: {} as Record<CodeSmellType, number>,
      issuesBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      codeQualityScore: 100,
      maintainabilityRating: 'excellent',
    };

    // Count issues by type and severity
    for (const issue of issues) {
      summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
      summary.issuesBySeverity[issue.severity]++;
    }

    // Calculate quality score
    const weights = { low: 1, medium: 3, high: 7, critical: 15 };
    const penalty = Object.entries(summary.issuesBySeverity).reduce(
      (sum, [severity, count]) => sum + weights[severity as Severity] * count,
      0
    );

    summary.codeQualityScore = Math.max(0, 100 - penalty);

    // Determine maintainability rating
    if (summary.codeQualityScore >= 90) summary.maintainabilityRating = 'excellent';
    else if (summary.codeQualityScore >= 70) summary.maintainabilityRating = 'good';
    else if (summary.codeQualityScore >= 50) summary.maintainabilityRating = 'fair';
    else summary.maintainabilityRating = 'poor';

    return summary;
  }

  /**
   * Initialize pattern detection rules
   */
  private initializePatternRules(): Map<Language, PatternRule[]> {
    const rules = new Map<Language, PatternRule[]>();

    // Common rules for all languages
    const commonRules: PatternRule[] = [
      {
        id: 'long_method',
        type: 'long_method',
        severity: 'medium',
        title: 'Long Method',
        description: 'Method/function is too long and should be broken down',
        detector: this.detectLongMethod.bind(this),
        languages: ['typescript', 'javascript', 'python'],
        thresholds: { lines: 30, statements: 20 },
      },
      {
        id: 'long_parameter_list',
        type: 'long_parameter_list',
        severity: 'medium',
        title: 'Long Parameter List',
        description: 'Function has too many parameters',
        detector: this.detectLongParameterList.bind(this),
        languages: ['typescript', 'javascript', 'python'],
        thresholds: { parameters: 5 },
      },
      {
        id: 'large_class',
        type: 'large_class',
        severity: 'medium',
        title: 'Large Class',
        description: 'Class is too large and has too many responsibilities',
        detector: this.detectLargeClass.bind(this),
        languages: ['typescript', 'javascript', 'python'],
        thresholds: { lines: 200, methods: 20 },
      },
    ];

    rules.set('typescript', commonRules);
    rules.set('javascript', commonRules);
    rules.set('python', commonRules);

    return rules;
  }

  /**
   * Pattern detector implementations
   */
  private detectLongMethod(node: ASTNode, context: AnalysisContext): PatternMatch[] {
    const functionTypes = ['function_declaration', 'method_definition', 'function_definition'];

    if (!functionTypes.includes(node.type)) return [];

    const lineCount = node.endLine - node.startLine + 1;
    const threshold = 30;

    if (lineCount > threshold) {
      return [
        {
          confidence: 0.8,
          evidence: `Function spans ${lineCount} lines (threshold: ${threshold})`,
          suggestion: 'Break this function into smaller, more focused functions',
          impact: 'maintainability',
          effort: 'medium',
        },
      ];
    }

    return [];
  }

  private detectLongParameterList(node: ASTNode, context: AnalysisContext): PatternMatch[] {
    const functionTypes = ['function_declaration', 'method_definition', 'function_definition'];

    if (!functionTypes.includes(node.type)) return [];

    // Count parameters
    let parameterCount = 0;
    for (const child of node.children) {
      if (child.type === 'parameters' || child.type === 'parameter_list') {
        parameterCount = child.children.filter(c => c.type === 'parameter').length;
        break;
      }
    }

    const threshold = 5;
    if (parameterCount > threshold) {
      return [
        {
          confidence: 0.9,
          evidence: `Function has ${parameterCount} parameters (threshold: ${threshold})`,
          suggestion: 'Consider using an object parameter or breaking the function down',
          impact: 'readability',
          effort: 'medium',
        },
      ];
    }

    return [];
  }

  private detectLargeClass(node: ASTNode, context: AnalysisContext): PatternMatch[] {
    if (node.type !== 'class_declaration' && node.type !== 'class_definition') return [];

    const lineCount = node.endLine - node.startLine + 1;
    const methodCount = node.children.filter(
      child => child.type === 'method_definition' || child.type === 'function_definition'
    ).length;

    const lineThreshold = 200;
    const methodThreshold = 20;

    if (lineCount > lineThreshold || methodCount > methodThreshold) {
      return [
        {
          confidence: 0.8,
          evidence: `Class has ${lineCount} lines and ${methodCount} methods`,
          suggestion: 'Consider splitting this class into smaller, more focused classes',
          impact: 'maintainability',
          effort: 'high',
        },
      ];
    }

    return [];
  }
}

// Export singleton instance
export const patternDetector = new PatternDetectorAnalyzer();
