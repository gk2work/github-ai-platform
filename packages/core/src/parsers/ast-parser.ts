// packages/core/src/parsers/ast-parser.ts

import { Language } from '@github-ai/shared';

// Tree-sitter types (we'll install these packages separately)
interface TreeSitterNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: TreeSitterNode[];
  parent: TreeSitterNode | null;
  namedChildren: TreeSitterNode[];
  childCount: number;
  namedChildCount: number;
  firstChild: TreeSitterNode | null;
  lastChild: TreeSitterNode | null;
  nextSibling: TreeSitterNode | null;
  previousSibling: TreeSitterNode | null;
  hasError(): boolean;
  walk(): TreeSitterTreeCursor;
}

interface TreeSitterTree {
  rootNode: TreeSitterNode;
  language: any;
  edit(edit: any): void;
}

interface TreeSitterTreeCursor {
  nodeType: string;
  nodeText: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  gotoFirstChild(): boolean;
  gotoNextSibling(): boolean;
  gotoParent(): boolean;
  currentNode(): TreeSitterNode;
}

interface TreeSitterParser {
  setLanguage(language: any): void;
  parse(input: string | Buffer, oldTree?: TreeSitterTree): TreeSitterTree;
}

export interface ASTNode {
  type: string;
  text: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  children: ASTNode[];
  parent?: ASTNode;
}

export interface ParseResult {
  success: boolean;
  ast?: ASTNode;
  errors: ParseError[];
  parseTime: number;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  type: 'syntax' | 'parser' | 'language';
}

export class ASTParser {
  private parsers: Map<Language, TreeSitterParser> = new Map();
  private languageModules: Map<Language, any> = new Map();
  
  constructor() {
    this.initializeParsers();
  }

  /**
   * Initialize Tree-sitter parsers for supported languages
   */
  private async initializeParsers(): Promise<void> {
    try {
      // Dynamic imports for Tree-sitter languages
      // These will be installed as separate packages
      const Parser = require('tree-sitter');
      
      // Language modules - we'll install these gradually
      const languageConfigs = [
        { lang: 'typescript' as Language, module: 'tree-sitter-typescript', subParser: 'typescript' },
        { lang: 'javascript' as Language, module: 'tree-sitter-javascript', subParser: null },
        { lang: 'python' as Language, module: 'tree-sitter-python', subParser: null },
        { lang: 'go' as Language, module: 'tree-sitter-go', subParser: null },
        { lang: 'java' as Language, module: 'tree-sitter-java', subParser: null }
      ];

      for (const config of languageConfigs) {
        try {
          const parser = new Parser();
          let languageModule;
          
          if (config.module === 'tree-sitter-typescript') {
            // TypeScript has both TypeScript and TSX parsers
            const tsModule = require(config.module);
            languageModule = config.subParser ? tsModule[config.subParser] : tsModule;
          } else {
            languageModule = require(config.module);
          }
          
          parser.setLanguage(languageModule);
          this.parsers.set(config.lang, parser);
          this.languageModules.set(config.lang, languageModule);
          
        } catch (error) {
          console.warn(`Failed to load parser for ${config.lang}:`, error instanceof Error ? error.message : 'Unknown error');
          // Continue with other languages - don't fail completely
        }
      }
      
    } catch (error) {
      console.error('Failed to initialize Tree-sitter parsers:', error);
      // Graceful fallback - we'll use basic parsing for now
    }
  }

  /**
   * Parse source code and return AST
   */
  async parseCode(code: string, language: Language): Promise<ParseResult> {
    const startTime = Date.now();
    
    try {
      const parser = this.parsers.get(language);
      
      if (!parser) {
        return {
          success: false,
          errors: [{
            message: `Parser not available for language: ${language}`,
            line: 1,
            column: 1,
            type: 'language'
          }],
          parseTime: Date.now() - startTime
        };
      }

      // Parse the code
      const tree = parser.parse(code);
      
      if (!tree || !tree.rootNode) {
        return {
          success: false,
          errors: [{
            message: 'Failed to generate syntax tree',
            line: 1,
            column: 1,
            type: 'parser'
          }],
          parseTime: Date.now() - startTime
        };
      }

      // Convert Tree-sitter AST to our format
      const ast = this.convertTreeSitterNode(tree.rootNode);
      
      // Check for syntax errors
      const errors = this.findSyntaxErrors(tree.rootNode);
      
      return {
        success: errors.length === 0,
        ast,
        errors,
        parseTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [{
          message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          line: 1,
          column: 1,
          type: 'parser'
        }],
        parseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Convert Tree-sitter node to our AST format
   */
  private convertTreeSitterNode(node: TreeSitterNode, parent?: ASTNode): ASTNode {
    const astNode: ASTNode = {
      type: node.type,
      text: node.text,
      startLine: node.startPosition.row + 1, // Convert to 1-based
      endLine: node.endPosition.row + 1,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column,
      children: [],
      parent
    };

    // Convert children
    for (const child of node.namedChildren) {
      const childAst = this.convertTreeSitterNode(child, astNode);
      astNode.children.push(childAst);
    }

    return astNode;
  }

  /**
   * Find syntax errors in the parsed tree
   */
  private findSyntaxErrors(node: TreeSitterNode): ParseError[] {
    const errors: ParseError[] = [];
    
    if (node.hasError()) {
      errors.push({
        message: `Syntax error in ${node.type}`,
        line: node.startPosition.row + 1,
        column: node.startPosition.column,
        type: 'syntax'
      });
    }

    // Recursively check children
    for (const child of node.children) {
      errors.push(...this.findSyntaxErrors(child));
    }

    return errors;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: Language): boolean {
    return this.parsers.has(language);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Get parser statistics
   */
  getParserStats(): Record<Language, { available: boolean; version?: string }> {
    const stats: Record<string, { available: boolean; version?: string }> = {};
    
    const allLanguages: Language[] = ['typescript', 'javascript', 'python', 'go', 'java'];
    
    for (const lang of allLanguages) {
      stats[lang] = {
        available: this.parsers.has(lang),
        version: this.languageModules.get(lang)?.version || 'unknown'
      };
    }
    
    return stats;
  }

  /**
   * Validate AST node structure
   */
  validateAST(ast: ASTNode): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check basic structure
    if (!ast.type) {
      issues.push('Missing node type');
    }
    
    if (ast.startLine > ast.endLine) {
      issues.push(`Invalid line range: ${ast.startLine} > ${ast.endLine}`);
    }
    
    if (ast.startLine === ast.endLine && ast.startColumn > ast.endColumn) {
      issues.push(`Invalid column range: ${ast.startColumn} > ${ast.endColumn}`);
    }
    
    // Recursively validate children
    for (let i = 0; i < ast.children.length; i++) {
      const child = ast.children[i];
      const childValidation = this.validateAST(child);
      
      if (!childValidation.valid) {
        issues.push(`Child ${i}: ${childValidation.issues.join(', ')}`);
      }
      
      // Check parent relationship
      if (child.parent !== ast) {
        issues.push(`Child ${i} has incorrect parent reference`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const astParser = new ASTParser();