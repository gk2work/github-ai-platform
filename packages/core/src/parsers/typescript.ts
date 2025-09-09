// packages/core/src/parsers/typescript.ts

export interface TypeScriptParseResult {
  imports: ImportStatement[];
  exports: ExportStatement[];
  functions: FunctionDeclaration[];
  classes: ClassDeclaration[];
  interfaces: InterfaceDeclaration[];
  types: TypeDeclaration[];
}

export interface ImportStatement {
  module: string;
  imports: string[];
  type: 'default' | 'named' | 'namespace';
  line: number;
}

export interface ExportStatement {
  name: string;
  type: 'default' | 'named';
  line: number;
}

export interface FunctionDeclaration {
  name: string;
  line: number;
  endLine: number;
  parameters: Parameter[];
  returnType?: string;
  isExported: boolean;
  isAsync: boolean;
}

export interface ClassDeclaration {
  name: string;
  line: number;
  endLine: number;
  methods: FunctionDeclaration[];
  properties: PropertyDeclaration[];
  isExported: boolean;
}

export interface InterfaceDeclaration {
  name: string;
  line: number;
  endLine: number;
  properties: PropertyDeclaration[];
}

export interface TypeDeclaration {
  name: string;
  line: number;
  definition: string;
}

export interface PropertyDeclaration {
  name: string;
  type?: string;
  line: number;
  isOptional: boolean;
}

export interface Parameter {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
}

export class TypeScriptParser {
  /**
   * Parse TypeScript content and extract structural information
   * This is a basic implementation - will be enhanced with Tree-sitter in Phase A2
   */
  parse(content: string): TypeScriptParseResult {
    const lines = content.split('\n');
    const result: TypeScriptParseResult = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Parse imports
      if (line.startsWith('import')) {
        const importInfo = this.parseImport(line, lineNumber);
        if (importInfo) {
          result.imports.push(importInfo);
        }
      }

      // Parse exports
      if (line.startsWith('export')) {
        const exportInfo = this.parseExport(line, lineNumber);
        if (exportInfo) {
          result.exports.push(exportInfo);
        }
      }

      // Parse functions
      if (this.isFunctionDeclaration(line)) {
        const funcInfo = this.parseFunction(lines, i);
        if (funcInfo) {
          result.functions.push(funcInfo);
        }
      }

      // Parse classes
      if (this.isClassDeclaration(line)) {
        const classInfo = this.parseClass(lines, i);
        if (classInfo) {
          result.classes.push(classInfo);
        }
      }

      // Parse interfaces
      if (this.isInterfaceDeclaration(line)) {
        const interfaceInfo = this.parseInterface(lines, i);
        if (interfaceInfo) {
          result.interfaces.push(interfaceInfo);
        }
      }

      // Parse type declarations
      if (this.isTypeDeclaration(line)) {
        const typeInfo = this.parseType(line, lineNumber);
        if (typeInfo) {
          result.types.push(typeInfo);
        }
      }
    }

    return result;
  }

  private parseImport(line: string, lineNumber: number): ImportStatement | null {
    // Basic import parsing - will be enhanced with proper AST parsing
    const importMatch = line.match(/import\s+(.+)\s+from\s+['"]([^'"]+)['"]/);
    if (!importMatch) return null;

    const importClause = importMatch[1].trim();
    const module = importMatch[2];

    // Determine import type and extract names
    let type: 'default' | 'named' | 'namespace' = 'named';
    let imports: string[] = [];

    if (importClause.startsWith('{') && importClause.endsWith('}')) {
      // Named imports: { foo, bar }
      type = 'named';
      imports = importClause
        .slice(1, -1)
        .split(',')
        .map(s => s.trim());
    } else if (importClause.includes('*')) {
      // Namespace import: * as foo
      type = 'namespace';
      const nsMatch = importClause.match(/\*\s+as\s+(\w+)/);
      imports = nsMatch ? [nsMatch[1]] : [];
    } else {
      // Default import: foo
      type = 'default';
      imports = [importClause];
    }

    return {
      module,
      imports,
      type,
      line: lineNumber
    };
  }

  private parseExport(line: string, lineNumber: number): ExportStatement | null {
    // Basic export parsing
    if (line.includes('export default')) {
      const match = line.match(/export\s+default\s+(\w+)/);
      return {
        name: match ? match[1] : 'default',
        type: 'default',
        line: lineNumber
      };
    }

    const namedMatch = line.match(/export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/);
    if (namedMatch) {
      return {
        name: namedMatch[1],
        type: 'named',
        line: lineNumber
      };
    }

    return null;
  }

  private isFunctionDeclaration(line: string): boolean {
    return /(?:function\s+\w+|const\s+\w+\s*=.*=>|async\s+function)/.test(line);
  }

  private isClassDeclaration(line: string): boolean {
    return /class\s+\w+/.test(line);
  }

  private isInterfaceDeclaration(line: string): boolean {
    return /interface\s+\w+/.test(line);
  }

  private isTypeDeclaration(line: string): boolean {
    return /type\s+\w+\s*=/.test(line);
  }

  private parseFunction(lines: string[], startIndex: number): FunctionDeclaration | null {
    const line = lines[startIndex].trim();
    const lineNumber = startIndex + 1;

    // Basic function parsing - will be enhanced with proper AST
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=)/);
    if (!funcMatch) return null;

    const name = funcMatch[1] || funcMatch[2];
    const isExported = line.includes('export');
    const isAsync = line.includes('async');

    // Find end of function (basic implementation)
    let endLine = lineNumber;
    let braceCount = 0;
    let inFunction = false;

    for (let i = startIndex; i < lines.length; i++) {
      const currentLine = lines[i];
      
      for (const char of currentLine) {
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }
      
      if (inFunction && braceCount === 0) break;
    }

    return {
      name,
      line: lineNumber,
      endLine,
      parameters: [], // Will be parsed properly with AST
      isExported,
      isAsync
    };
  }

  private parseClass(lines: string[], startIndex: number): ClassDeclaration | null {
    const line = lines[startIndex].trim();
    const lineNumber = startIndex + 1;

    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
    if (!classMatch) return null;

    const name = classMatch[1];
    const isExported = line.includes('export');

    // Find end of class
    let endLine = lineNumber;
    let braceCount = 0;
    let inClass = false;

    for (let i = startIndex; i < lines.length; i++) {
      const currentLine = lines[i];
      
      for (const char of currentLine) {
        if (char === '{') {
          braceCount++;
          inClass = true;
        } else if (char === '}') {
          braceCount--;
          if (inClass && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }
      
      if (inClass && braceCount === 0) break;
    }

    return {
      name,
      line: lineNumber,
      endLine,
      methods: [], // Will be parsed properly with AST
      properties: [], // Will be parsed properly with AST
      isExported
    };
  }

  private parseInterface(lines: string[], startIndex: number): InterfaceDeclaration | null {
    const line = lines[startIndex].trim();
    const lineNumber = startIndex + 1;

    const interfaceMatch = line.match(/interface\s+(\w+)/);
    if (!interfaceMatch) return null;

    const name = interfaceMatch[1];

    // Find end of interface
    let endLine = lineNumber;
    let braceCount = 0;
    let inInterface = false;

    for (let i = startIndex; i < lines.length; i++) {
      const currentLine = lines[i];
      
      for (const char of currentLine) {
        if (char === '{') {
          braceCount++;
          inInterface = true;
        } else if (char === '}') {
          braceCount--;
          if (inInterface && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }
      
      if (inInterface && braceCount === 0) break;
    }

    return {
      name,
      line: lineNumber,
      endLine,
      properties: [] // Will be parsed properly with AST
    };
  }

  private parseType(line: string, lineNumber: number): TypeDeclaration | null {
    const typeMatch = line.match(/type\s+(\w+)\s*=\s*(.+)/);
    if (!typeMatch) return null;

    return {
      name: typeMatch[1],
      line: lineNumber,
      definition: typeMatch[2].trim()
    };
  }
}

// Export default instance
export const typescriptParser = new TypeScriptParser();