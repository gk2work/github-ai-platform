// packages/core/src/analyzers/complexity.ts
// COMPLETE IMPLEMENTATION - Replace your existing complexity.ts

import { Language } from '@github-ai/shared';

export interface ComplexityResult {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  functionComplexity: FunctionComplexity[];
  classComplexity: ClassComplexity[];
  fileComplexity: FileComplexity;
}

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  parameters: number;
  linesOfCode: number;
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassComplexity {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionComplexity[];
  properties: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  isExported: boolean;
}

export interface FileComplexity {
  totalCyclomaticComplexity: number;
  totalCognitiveComplexity: number;
  averageFunctionComplexity: number;
  maxFunctionComplexity: number;
  maxNestingDepth: number;
  maintainabilityIndex: number;
}

interface ComplexityKeywords {
  functionKeywords: string[];
  classKeywords: string[];
  controlFlowKeywords: string[];
  decisionKeywords: string[];
  loopKeywords: string[];
  exceptionKeywords: string[];
  logicalOperators: string[];
}

export class ComplexityAnalyzer {
  private languageKeywords: Map<Language, ComplexityKeywords>;

  constructor() {
    this.languageKeywords = this.initializeLanguageKeywords();
  }

  /**
   * Analyze complexity of source code
   */
  async analyzeComplexity(
    code: string, 
    languageId: string, 
    filePath: string | undefined, 
    language: Language
  ): Promise<ComplexityResult> {
    const keywords = this.languageKeywords.get(language);
    if (!keywords) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const lines = code.split('\n');
    
    // Analyze functions
    const functions = this.extractFunctions(code, keywords, lines);
    
    // Analyze classes
    const classes = this.extractClasses(code, keywords, lines, functions);
    
    // Calculate file-level metrics
    const fileComplexity = this.calculateFileComplexity(functions, classes, lines.length);
    
    // Calculate overall metrics
    const totalCyclomatic = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0);
    const totalCognitive = functions.reduce((sum, f) => sum + f.cognitiveComplexity, 0);
    const maxNesting = Math.max(...functions.map(f => f.nestingDepth), 0);

    return {
      cyclomaticComplexity: totalCyclomatic,
      cognitiveComplexity: totalCognitive,
      nestingDepth: maxNesting,
      functionComplexity: functions,
      classComplexity: classes,
      fileComplexity
    };
  }

  /**
   * Extract and analyze functions from code
   */
  private extractFunctions(code: string, keywords: ComplexityKeywords, lines: string[]): FunctionComplexity[] {
    const functions: FunctionComplexity[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line contains function declaration
      const functionMatch = this.findFunctionDeclaration(line, keywords);
      if (functionMatch) {
        const func = this.analyzeFunctionComplexity(
          code, 
          lines, 
          i, 
          functionMatch.name, 
          functionMatch.isAsync,
          functionMatch.isExported,
          keywords
        );
        if (func) {
          functions.push(func);
        }
      }
    }
    
    return functions;
  }

  /**
   * Extract and analyze classes from code
   */
  private extractClasses(
    code: string, 
    keywords: ComplexityKeywords, 
    lines: string[],
    allFunctions: FunctionComplexity[]
  ): ClassComplexity[] {
    const classes: ClassComplexity[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line contains class declaration
      const classMatch = this.findClassDeclaration(line, keywords);
      if (classMatch) {
        const classInfo = this.analyzeClassComplexity(
          code,
          lines,
          i,
          classMatch.name,
          classMatch.isExported,
          allFunctions
        );
        if (classInfo) {
          classes.push(classInfo);
        }
      }
    }
    
    return classes;
  }

  /**
   * Find function declaration in a line
   */
  private findFunctionDeclaration(line: string, keywords: ComplexityKeywords): {
    name: string;
    isAsync: boolean;
    isExported: boolean;
  } | null {
    // TypeScript/JavaScript patterns
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/,
      /(?:export\s+)?(\w+)\s*:\s*(?:async\s+)?\(/,
      /(?:export\s+)?(\w+)\s*\(\s*.*\)\s*=>/,
      // Python patterns
      /def\s+(\w+)/,
      // Go patterns
      /func\s+(\w+)/,
      // Java patterns
      /(?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)?(\w+)\s*\(/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          name: match[1],
          isAsync: /async/.test(line),
          isExported: /export/.test(line)
        };
      }
    }

    return null;
  }

  /**
   * Find class declaration in a line
   */
  private findClassDeclaration(line: string, keywords: ComplexityKeywords): {
    name: string;
    isExported: boolean;
  } | null {
    const patterns = [
      /(?:export\s+)?class\s+(\w+)/,
      // Python
      /class\s+(\w+)/,
      // Java
      /(?:public|private|protected)?\s*class\s+(\w+)/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          name: match[1],
          isExported: /export/.test(line)
        };
      }
    }

    return null;
  }

  /**
   * Analyze complexity of a single function
   */
  private analyzeFunctionComplexity(
    code: string,
    lines: string[],
    startLineIndex: number,
    name: string,
    isAsync: boolean,
    isExported: boolean,
    keywords: ComplexityKeywords
  ): FunctionComplexity | null {
    const endLineIndex = this.findFunctionEnd(lines, startLineIndex);
    if (endLineIndex === -1) return null;

    const functionLines = lines.slice(startLineIndex, endLineIndex + 1);
    const functionCode = functionLines.join('\n');

    // Calculate complexities
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(functionCode, keywords);
    const cognitiveComplexity = this.calculateCognitiveComplexity(functionCode, keywords);
    const nestingDepth = this.calculateNestingDepth(functionCode);
    const parameters = this.countParameters(lines[startLineIndex]);

    return {
      name,
      startLine: startLineIndex + 1,
      endLine: endLineIndex + 1,
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth,
      parameters,
      linesOfCode: functionLines.length,
      isAsync,
      isExported
    };
  }

  /**
   * Analyze complexity of a single class
   */
  private analyzeClassComplexity(
    code: string,
    lines: string[],
    startLineIndex: number,
    name: string,
    isExported: boolean,
    allFunctions: FunctionComplexity[]
  ): ClassComplexity | null {
    const endLineIndex = this.findClassEnd(lines, startLineIndex);
    if (endLineIndex === -1) return null;

    // Find methods within this class
    const classMethods = allFunctions.filter(func => 
      func.startLine >= startLineIndex + 1 && func.endLine <= endLineIndex + 1
    );

    // Count properties (simplified)
    const classLines = lines.slice(startLineIndex, endLineIndex + 1);
    const properties = this.countProperties(classLines);

    const totalComplexity = classMethods.reduce((sum, method) => sum + method.cyclomaticComplexity, 0);

    return {
      name,
      startLine: startLineIndex + 1,
      endLine: endLineIndex + 1,
      methods: classMethods,
      properties,
      cyclomaticComplexity: totalComplexity,
      linesOfCode: classLines.length,
      isExported
    };
  }

  /**
   * Calculate cyclomatic complexity (McCabe complexity)
   */
  private calculateCyclomaticComplexity(code: string, keywords: ComplexityKeywords): number {
    let complexity = 1; // Base complexity

    const allKeywords = [
      ...keywords.controlFlowKeywords,
      ...keywords.decisionKeywords,
      ...keywords.loopKeywords,
      ...keywords.exceptionKeywords
    ];

    for (const keyword of allKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    // Count logical operators
    for (const operator of keywords.logicalOperators) {
      const regex = new RegExp(`\\${operator}`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    // Count case statements (additional complexity)
    const caseMatches = code.match(/\bcase\b/g);
    if (caseMatches) {
      complexity += caseMatches.length;
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(code: string, keywords: ComplexityKeywords): number {
    let complexity = 0;
    let nestingLevel = 0;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Track nesting level
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      nestingLevel += openBraces - closeBraces;

      // Add complexity for control structures
      for (const keyword of keywords.controlFlowKeywords) {
        if (new RegExp(`\\b${keyword}\\b`).test(trimmed)) {
          complexity += Math.max(1, nestingLevel);
        }
      }

      // Add complexity for decision points
      for (const keyword of keywords.decisionKeywords) {
        if (new RegExp(`\\b${keyword}\\b`).test(trimmed)) {
          complexity += Math.max(1, nestingLevel);
        }
      }

      // Add complexity for logical operators (no nesting increment)
      for (const operator of keywords.logicalOperators) {
        const matches = trimmed.match(new RegExp(`\\${operator}`, 'g'));
        if (matches) {
          complexity += matches.length;
        }
      }
    }

    return Math.max(complexity, 0);
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      
      currentDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Count function parameters
   */
  private countParameters(line: string): number {
    const paramMatch = line.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1].trim()) return 0;
    
    const params = paramMatch[1].split(',').filter(p => p.trim());
    return params.length;
  }

  /**
   * Count class properties
   */
  private countProperties(classLines: string[]): number {
    let properties = 0;
    
    for (const line of classLines) {
      const trimmed = line.trim();
      
      // TypeScript/JavaScript property patterns
      if (/^\w+\s*[:=]/.test(trimmed) && !trimmed.includes('function') && !trimmed.includes('=>')) {
        properties++;
      }
      
      // Python property patterns
      if (/^self\.\w+\s*=/.test(trimmed)) {
        properties++;
      }
    }
    
    return properties;
  }

  /**
   * Find the end of a function
   */
  private findFunctionEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      if (openBraces > 0) inFunction = true;
      
      braceCount += openBraces - closeBraces;
      
      if (inFunction && braceCount === 0) {
        return i;
      }
    }
    
    // Fallback: if no braces, assume single line or find next function
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (this.findFunctionDeclaration(lines[i], this.languageKeywords.get('typescript')!)) {
        return i - 1;
      }
    }
    
    return lines.length - 1;
  }

  /**
   * Find the end of a class
   */
  private findClassEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let inClass = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      if (openBraces > 0) inClass = true;
      
      braceCount += openBraces - closeBraces;
      
      if (inClass && braceCount === 0) {
        return i;
      }
    }
    
    return lines.length - 1;
  }

  /**
   * Calculate file-level complexity metrics
   */
  private calculateFileComplexity(
    functions: FunctionComplexity[],
    classes: ClassComplexity[],
    totalLines: number
  ): FileComplexity {
    const totalCyclomaticComplexity = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0);
    const totalCognitiveComplexity = functions.reduce((sum, f) => sum + f.cognitiveComplexity, 0);
    
    const averageFunctionComplexity = functions.length > 0
      ? totalCyclomaticComplexity / functions.length
      : 0;
    
    const maxFunctionComplexity = functions.length > 0
      ? Math.max(...functions.map(f => f.cyclomaticComplexity))
      : 0;
    
    const maxNestingDepth = functions.length > 0
      ? Math.max(...functions.map(f => f.nestingDepth))
      : 0;
    
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      totalLines,
      averageFunctionComplexity
    );

    return {
      totalCyclomaticComplexity,
      totalCognitiveComplexity,
      averageFunctionComplexity,
      maxFunctionComplexity,
      maxNestingDepth,
      maintainabilityIndex
    };
  }

  /**
   * Calculate maintainability index
   */
  private calculateMaintainabilityIndex(linesOfCode: number, avgComplexity: number): number {
    if (linesOfCode === 0) return 100;
    
    // Simplified maintainability index formula
    const baseScore = 100;
    const complexityPenalty = avgComplexity * 3;
    const sizePenalty = Math.log(linesOfCode) * 5;
    
    const score = Math.max(0, baseScore - complexityPenalty - sizePenalty);
    return Math.round(score);
  }

  /**
   * Initialize language-specific keywords
   */
  private initializeLanguageKeywords(): Map<Language, ComplexityKeywords> {
    const keywords = new Map<Language, ComplexityKeywords>();

    // TypeScript/JavaScript
    const jsKeywords: ComplexityKeywords = {
      functionKeywords: ['function', 'async function'],
      classKeywords: ['class'],
      controlFlowKeywords: ['for', 'while', 'do'],
      decisionKeywords: ['if', 'else if', 'switch', 'case'],
      loopKeywords: ['for', 'while', 'do', 'forEach', 'map', 'filter'],
      exceptionKeywords: ['try', 'catch', 'finally', 'throw'],
      logicalOperators: ['&&', '||', '??']
    };

    keywords.set('typescript', jsKeywords);
    keywords.set('javascript', jsKeywords);

    // Python
    keywords.set('python', {
      functionKeywords: ['def'],
      classKeywords: ['class'],
      controlFlowKeywords: ['for', 'while'],
      decisionKeywords: ['if', 'elif', 'else'],
      loopKeywords: ['for', 'while'],
      exceptionKeywords: ['try', 'except', 'finally', 'raise'],
      logicalOperators: ['and', 'or', 'not']
    });

    // Go
    keywords.set('go', {
      functionKeywords: ['func'],
      classKeywords: ['type', 'struct'],
      controlFlowKeywords: ['for', 'range'],
      decisionKeywords: ['if', 'else', 'switch', 'case'],
      loopKeywords: ['for', 'range'],
      exceptionKeywords: ['defer', 'panic', 'recover'],
      logicalOperators: ['&&', '||', '!']
    });

    // Java
    keywords.set('java', {
      functionKeywords: ['public', 'private', 'protected', 'static'],
      classKeywords: ['class', 'interface'],
      controlFlowKeywords: ['for', 'while', 'do'],
      decisionKeywords: ['if', 'else', 'switch', 'case'],
      loopKeywords: ['for', 'while', 'do', 'foreach'],
      exceptionKeywords: ['try', 'catch', 'finally', 'throw', 'throws'],
      logicalOperators: ['&&', '||', '!']
    });

    return keywords;
  }
}

// Export singleton instance
export const complexityAnalyzer = new ComplexityAnalyzer();