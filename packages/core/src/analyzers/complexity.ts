// packages/core/src/analyzers/complexity.ts

import { Language } from '@github-ai/shared';
import { ASTNode, ASTParser } from '../parsers/ast-parser';

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

export class ComplexityAnalyzer {
  private languageKeywords: Map<Language, ComplexityKeywords>;
  private astParser: ASTParser; 

  constructor() {
    this.languageKeywords = this.initializeLanguageKeywords();
    this.astParser = new ASTParser();
  }

  /**
   * Analyze complexity of source code
   */
  async analyzeComplexity(code: string, language: Language): Promise<ComplexityResult> {
    // Parse the code into AST
    const parseResult = await this.astParser.parseCode(code, language);

    if (!parseResult.success || !parseResult.ast) {
      // Fallback to basic text-based analysis
      return this.fallbackTextAnalysis(code, language);
    }

    const ast = parseResult.ast;
    const keywords = this.languageKeywords.get(language);
    
    if (!keywords) {
      throw new Error(`Language ${language} not supported for complexity analysis`);
    }

    // Analyze functions and classes
    const functions = this.extractFunctions(ast, keywords);
    const classes = this.extractClasses(ast, keywords);
    
    // Calculate function complexities
    const functionComplexities = functions.map(func => 
      this.analyzeFunctionComplexity(func, keywords)
    );
    
    // Calculate class complexities
    const classComplexities = classes.map(cls => 
      this.analyzeClassComplexity(cls, keywords)
    );
    
    // Calculate overall file complexity
    const fileComplexity = this.calculateFileComplexity(ast, functionComplexities);
    
    // Calculate overall metrics
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(ast, keywords);
    const cognitiveComplexity = this.calculateCognitiveComplexity(ast, keywords);
    const nestingDepth = this.calculateMaxNestingDepth(ast);

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth,
      functionComplexity: functionComplexities,
      classComplexity: classComplexities,
      fileComplexity
    };
  }

  /**
   * Extract function nodes from AST
   */
  private extractFunctions(ast: ASTNode, keywords: ComplexityKeywords): ASTNode[] {
    const functions: ASTNode[] = [];
    
    const traverse = (node: ASTNode) => {
      // Check if this node represents a function
      if (keywords.functionTypes.includes(node.type)) {
        functions.push(node);
      }
      
      // Recursively check children
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(ast);
    return functions;
  }

  /**
   * Extract class nodes from AST
   */
  private extractClasses(ast: ASTNode, keywords: ComplexityKeywords): ASTNode[] {
    const classes: ASTNode[] = [];
    
    const traverse = (node: ASTNode) => {
      if (keywords.classTypes.includes(node.type)) {
        classes.push(node);
      }
      
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(ast);
    return classes;
  }

  /**
   * Analyze complexity of a single function
   */
  private analyzeFunctionComplexity(funcNode: ASTNode, keywords: ComplexityKeywords): FunctionComplexity {
    const name = this.extractFunctionName(funcNode);
    const parameters = this.countParameters(funcNode);
    const linesOfCode = funcNode.endLine - funcNode.startLine + 1;
    const isAsync = this.isAsyncFunction(funcNode);
    const isExported = this.isExported(funcNode);
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(funcNode, keywords);
    const cognitiveComplexity = this.calculateCognitiveComplexity(funcNode, keywords);
    const nestingDepth = this.calculateMaxNestingDepth(funcNode);

    return {
      name,
      startLine: funcNode.startLine,
      endLine: funcNode.endLine,
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth,
      parameters,
      linesOfCode,
      isAsync,
      isExported
    };
  }

  /**
   * Analyze complexity of a class
   */
  private analyzeClassComplexity(classNode: ASTNode, keywords: ComplexityKeywords): ClassComplexity {
    const name = this.extractClassName(classNode);
    const methods = this.extractMethods(classNode, keywords);
    const properties = this.countProperties(classNode, keywords);
    const linesOfCode = classNode.endLine - classNode.startLine + 1;
    const isExported = this.isExported(classNode);
    
    const methodComplexities = methods.map(method => 
      this.analyzeFunctionComplexity(method, keywords)
    );
    
    const cyclomaticComplexity = methodComplexities.reduce(
      (sum, method) => sum + method.cyclomaticComplexity, 1
    );

    return {
      name,
      startLine: classNode.startLine,
      endLine: classNode.endLine,
      methods: methodComplexities,
      properties,
      cyclomaticComplexity,
      linesOfCode,
      isExported
    };
  }

  /**
   * Calculate cyclomatic complexity (McCabe)
   */
  private calculateCyclomaticComplexity(node: ASTNode, keywords: ComplexityKeywords): number {
    let complexity = 1; // Base complexity
    
    const traverse = (current: ASTNode) => {
      // Decision points that increase complexity
      if (keywords.decisionNodes.includes(current.type)) {
        complexity++;
      }
      
      // Logical operators
      if (keywords.logicalOperators.some(op => current.text.includes(op))) {
        const matches = keywords.logicalOperators.filter(op => 
          current.text.includes(op)
        ).length;
        complexity += matches;
      }
      
      // Exception handling
      if (keywords.exceptionNodes.includes(current.type)) {
        complexity++;
      }
      
      for (const child of current.children) {
        traverse(child);
      }
    };
    
    traverse(node);
    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(node: ASTNode, keywords: ComplexityKeywords, nestingLevel: number = 0): number {
    let complexity = 0;
    
    for (const child of node.children) {
      let increment = 0;
      
      // Control flow structures
      if (keywords.controlFlowNodes.includes(child.type)) {
        increment = Math.max(1, nestingLevel);
      }
      
      // Logical operators (no nesting increment)
      if (keywords.logicalOperators.some(op => child.text.includes(op))) {
        increment = 1;
      }
      
      // Recursion detection
      if (this.isRecursiveCall(child, node)) {
        increment = 1;
      }
      
      complexity += increment;
      
      // Increase nesting level for certain structures
      const newNestingLevel = keywords.nestingNodes.includes(child.type) 
        ? nestingLevel + 1 
        : nestingLevel;
      
      // Recursively analyze children
      complexity += this.calculateCognitiveComplexity(child, keywords, newNestingLevel);
    }
    
    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateMaxNestingDepth(node: ASTNode, currentDepth: number = 0): number {
    let maxDepth = currentDepth;
    
    for (const child of node.children) {
      const isNestingNode = this.isNestingNode(child);
      const childDepth = isNestingNode ? currentDepth + 1 : currentDepth;
      
      const deepestChild = this.calculateMaxNestingDepth(child, childDepth);
      maxDepth = Math.max(maxDepth, deepestChild);
    }
    
    return maxDepth;
  }

  /**
   * Calculate file-level complexity metrics
   */
  private calculateFileComplexity(ast: ASTNode, functions: FunctionComplexity[]): FileComplexity {
    const totalCyclomaticComplexity = functions.reduce(
      (sum, func) => sum + func.cyclomaticComplexity, 0
    );
    
    const totalCognitiveComplexity = functions.reduce(
      (sum, func) => sum + func.cognitiveComplexity, 0
    );
    
    const averageFunctionComplexity = functions.length > 0 
      ? totalCyclomaticComplexity / functions.length 
      : 0;
    
    const maxFunctionComplexity = functions.length > 0
      ? Math.max(...functions.map(f => f.cyclomaticComplexity))
      : 0;
    
    const maxNestingDepth = functions.length > 0
      ? Math.max(...functions.map(f => f.nestingDepth))
      : 0;
    
    // Simplified maintainability index
    const linesOfCode = ast.endLine - ast.startLine + 1;
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      linesOfCode, 
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
   * Helper methods for extracting information from AST nodes
   */
  private extractFunctionName(node: ASTNode): string {
    // Look for identifier nodes that represent the function name
    for (const child of node.children) {
      if (child.type === 'identifier' || child.type === 'function_name') {
        return child.text;
      }
    }
    return 'anonymous';
  }

  private extractClassName(node: ASTNode): string {
    for (const child of node.children) {
      if (child.type === 'identifier' || child.type === 'class_name') {
        return child.text;
      }
    }
    return 'anonymous';
  }

  private extractMethods(classNode: ASTNode, keywords: ComplexityKeywords): ASTNode[] {
    const methods: ASTNode[] = [];
    
    const traverse = (node: ASTNode) => {
      if (keywords.methodTypes.includes(node.type)) {
        methods.push(node);
      }
      
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(classNode);
    return methods;
  }

  private countParameters(funcNode: ASTNode): number {
    // Look for parameter list
    for (const child of funcNode.children) {
      if (child.type === 'parameters' || child.type === 'parameter_list') {
        return child.children.filter(c => c.type === 'parameter').length;
      }
    }
    return 0;
  }

  private countProperties(classNode: ASTNode, keywords: ComplexityKeywords): number {
    let count = 0;
    
    const traverse = (node: ASTNode) => {
      if (keywords.propertyTypes.includes(node.type)) {
        count++;
      }
      
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(classNode);
    return count;
  }

  private isAsyncFunction(node: ASTNode): boolean {
    return node.text.includes('async');
  }

  private isExported(node: ASTNode): boolean {
    return node.text.includes('export');
  }

  private isRecursiveCall(node: ASTNode, functionNode: ASTNode): boolean {
    const functionName = this.extractFunctionName(functionNode);
    return node.type === 'call_expression' && node.text.includes(functionName);
  }

  private isNestingNode(node: ASTNode): boolean {
    const nestingTypes = [
      'if_statement', 'while_statement', 'for_statement', 'try_statement',
      'switch_statement', 'block', 'compound_statement'
    ];
    return nestingTypes.includes(node.type);
  }

  private calculateMaintainabilityIndex(linesOfCode: number, complexity: number): number {
    // Simplified MI calculation
    const baseScore = 100;
    const complexityPenalty = complexity * 2;
    const sizePenalty = Math.log(linesOfCode) * 5;
    
    return Math.max(0, Math.round(baseScore - complexityPenalty - sizePenalty));
  }

  /**
   * Fallback analysis when AST parsing fails
   */
  private fallbackTextAnalysis(code: string, language: Language): ComplexityResult {
    const lines = code.split('\n');
    const keywords = this.languageKeywords.get(language);
    
    let cyclomaticComplexity = 1;
    let nestingDepth = 0;
    let maxNesting = 0;
    
    if (keywords) {
      for (const line of lines) {
        // Count decision points
        for (const keyword of [...keywords.decisionNodes, ...keywords.controlFlowNodes]) {
          if (line.includes(keyword)) {
            cyclomaticComplexity++;
          }
        }
        
        // Track nesting (simplified)
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        nestingDepth += openBraces - closeBraces;
        maxNesting = Math.max(maxNesting, nestingDepth);
      }
    }

    return {
      cyclomaticComplexity,
      cognitiveComplexity: cyclomaticComplexity,
      nestingDepth: maxNesting,
      functionComplexity: [],
      classComplexity: [],
      fileComplexity: {
        totalCyclomaticComplexity: cyclomaticComplexity,
        totalCognitiveComplexity: cyclomaticComplexity,
        averageFunctionComplexity: cyclomaticComplexity,
        maxFunctionComplexity: cyclomaticComplexity,
        maxNestingDepth: maxNesting,
        maintainabilityIndex: this.calculateMaintainabilityIndex(lines.length, cyclomaticComplexity)
      }
    };
  }

  /**
   * Initialize language-specific keywords and node types
   */
  private initializeLanguageKeywords(): Map<Language, ComplexityKeywords> {
    const keywords = new Map<Language, ComplexityKeywords>();
    
    // TypeScript/JavaScript
    keywords.set('typescript', {
      functionTypes: ['function_declaration', 'method_definition', 'arrow_function'],
      classTypes: ['class_declaration'],
      methodTypes: ['method_definition'],
      propertyTypes: ['property_definition', 'field_definition'],
      decisionNodes: ['if_statement', 'switch_statement', 'conditional_expression'],
      controlFlowNodes: ['for_statement', 'while_statement', 'for_in_statement', 'for_of_statement'],
      nestingNodes: ['if_statement', 'for_statement', 'while_statement', 'try_statement', 'switch_statement'],
      logicalOperators: ['&&', '||', '??'],
      exceptionNodes: ['catch_clause', 'throw_statement']
    });
    
    keywords.set('javascript', keywords.get('typescript')!);
    
    // Python
    keywords.set('python', {
      functionTypes: ['function_definition'],
      classTypes: ['class_definition'],
      methodTypes: ['function_definition'],
      propertyTypes: ['assignment'],
      decisionNodes: ['if_statement', 'conditional_expression'],
      controlFlowNodes: ['for_statement', 'while_statement'],
      nestingNodes: ['if_statement', 'for_statement', 'while_statement', 'try_statement'],
      logicalOperators: ['and', 'or'],
      exceptionNodes: ['except_clause', 'raise_statement']
    });
    
    return keywords;
  }
}

interface ComplexityKeywords {
  functionTypes: string[];
  classTypes: string[];
  methodTypes: string[];
  propertyTypes: string[];
  decisionNodes: string[];
  controlFlowNodes: string[];
  nestingNodes: string[];
  logicalOperators: string[];
  exceptionNodes: string[];
}

// Export singleton instance
export const complexityAnalyzer = new ComplexityAnalyzer();