// packages/core/src/parsers/python.ts

export interface PythonParseResult {
  imports: PythonImportStatement[];
  functions: PythonFunctionDeclaration[];
  classes: PythonClassDeclaration[];
  variables: PythonVariableDeclaration[];
}

export interface PythonImportStatement {
  module: string;
  imports: string[];
  type: 'import' | 'from_import';
  line: number;
  alias?: string;
}

export interface PythonFunctionDeclaration {
  name: string;
  line: number;
  endLine: number;
  parameters: PythonParameter[];
  returnType?: string;
  isMethod: boolean;
  isAsync: boolean;
  decorators: string[];
}

export interface PythonClassDeclaration {
  name: string;
  line: number;
  endLine: number;
  methods: PythonFunctionDeclaration[];
  baseClasses: string[];
  decorators: string[];
}

export interface PythonVariableDeclaration {
  name: string;
  line: number;
  type?: string;
  value?: string;
}

export interface PythonParameter {
  name: string;
  type?: string;
  defaultValue?: string;
  isKeywordOnly: boolean;
  isVarArgs: boolean;
  isKwArgs: boolean;
}

export class PythonParser {
  /**
   * Parse Python content and extract structural information
   * This is a basic implementation - will be enhanced with Tree-sitter in Phase A2
   */
  parse(content: string): PythonParseResult {
    const lines = content.split('\n');
    const result: PythonParseResult = {
      imports: [],
      functions: [],
      classes: [],
      variables: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const strippedLine = line.trim();
      const lineNumber = i + 1;

      // Skip comments and empty lines
      if (strippedLine.startsWith('#') || strippedLine === '') {
        continue;
      }

      // Parse imports
      if (strippedLine.startsWith('import ') || strippedLine.startsWith('from ')) {
        const importInfo = this.parseImport(strippedLine, lineNumber);
        if (importInfo) {
          result.imports.push(importInfo);
        }
      }

      // Parse function definitions
      if (this.isFunctionDefinition(strippedLine)) {
        const funcInfo = this.parseFunction(lines, i);
        if (funcInfo) {
          result.functions.push(funcInfo);
        }
      }

      // Parse class definitions
      if (this.isClassDefinition(strippedLine)) {
        const classInfo = this.parseClass(lines, i);
        if (classInfo) {
          result.classes.push(classInfo);
        }
      }

      // Parse variable assignments
      if (this.isVariableAssignment(strippedLine)) {
        const varInfo = this.parseVariable(strippedLine, lineNumber);
        if (varInfo) {
          result.variables.push(varInfo);
        }
      }
    }

    return result;
  }

  private parseImport(line: string, lineNumber: number): PythonImportStatement | null {
    // Handle "import module" statements
    if (line.startsWith('import ')) {
      const importMatch = line.match(/import\s+([^\s]+)(?:\s+as\s+(\w+))?/);
      if (!importMatch) return null;

      const module = importMatch[1];
      const alias = importMatch[2];

      return {
        module,
        imports: [alias || module],
        type: 'import',
        line: lineNumber,
        alias
      };
    }

    // Handle "from module import ..." statements
    if (line.startsWith('from ')) {
      const fromMatch = line.match(/from\s+([^\s]+)\s+import\s+(.+)/);
      if (!fromMatch) return null;

      const module = fromMatch[1];
      const importClause = fromMatch[2];

      let imports: string[] = [];
      
      if (importClause.trim() === '*') {
        imports = ['*'];
      } else {
        // Parse individual imports, handling aliases
        imports = importClause
          .split(',')
          .map(item => {
            const trimmed = item.trim();
            const aliasMatch = trimmed.match(/(\w+)(?:\s+as\s+(\w+))?/);
            return aliasMatch ? (aliasMatch[2] || aliasMatch[1]) : trimmed;
          });
      }

      return {
        module,
        imports,
        type: 'from_import',
        line: lineNumber
      };
    }

    return null;
  }

  private isFunctionDefinition(line: string): boolean {
    return /^\s*(?:async\s+)?def\s+\w+\s*\(/.test(line);
  }

  private isClassDefinition(line: string): boolean {
    return /^\s*class\s+\w+/.test(line);
  }

  private isVariableAssignment(line: string): boolean {
    return /^\s*\w+\s*[:=]/.test(line) && !line.includes('def ') && !line.includes('class ');
  }

  private parseFunction(lines: string[], startIndex: number): PythonFunctionDeclaration | null {
    const line = lines[startIndex];
    const lineNumber = startIndex + 1;

    // Extract function definition
    const funcMatch = line.match(/^\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);
    if (!funcMatch) return null;

    const name = funcMatch[1];
    const paramString = funcMatch[2];
    const returnType = funcMatch[3]?.trim();
    const isAsync = line.includes('async ');

    // Parse parameters
    const parameters = this.parseParameters(paramString);

    // Find end of function by looking for next function/class at same or lower indentation
    const currentIndent = this.getIndentation(line);
    let endLine = lineNumber;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];
      
      // Skip empty lines and comments
      if (currentLine.trim() === '' || currentLine.trim().startsWith('#')) {
        continue;
      }

      const lineIndent = this.getIndentation(currentLine);
      
      // If we find a line with same or less indentation that's not part of this function
      if (lineIndent <= currentIndent && 
          (currentLine.includes('def ') || currentLine.includes('class ') || 
           (!currentLine.startsWith(' ') && currentLine.trim() !== ''))) {
        endLine = i;
        break;
      }
      
      endLine = i + 1;
    }

    // Extract decorators (look backwards from function definition)
    const decorators: string[] = [];
    for (let i = startIndex - 1; i >= 0; i--) {
      const prevLine = lines[i].trim();
      if (prevLine.startsWith('@')) {
        decorators.unshift(prevLine);
      } else if (prevLine !== '') {
        break;
      }
    }

    return {
      name,
      line: lineNumber,
      endLine,
      parameters,
      returnType,
      isMethod: false, // Will be determined by context in class parsing
      isAsync,
      decorators
    };
  }

  private parseClass(lines: string[], startIndex: number): PythonClassDeclaration | null {
    const line = lines[startIndex];
    const lineNumber = startIndex + 1;

    // Extract class definition
    const classMatch = line.match(/^\s*class\s+(\w+)(?:\(([^)]*)\))?:/);
    if (!classMatch) return null;

    const name = classMatch[1];
    const baseClassString = classMatch[2] || '';
    const baseClasses = baseClassString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Find end of class
    const currentIndent = this.getIndentation(line);
    let endLine = lineNumber;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];
      
      if (currentLine.trim() === '' || currentLine.trim().startsWith('#')) {
        continue;
      }

      const lineIndent = this.getIndentation(currentLine);
      
      if (lineIndent <= currentIndent && 
          (currentLine.includes('def ') || currentLine.includes('class ') || 
           (!currentLine.startsWith(' ') && currentLine.trim() !== ''))) {
        endLine = i;
        break;
      }
      
      endLine = i + 1;
    }

    // Extract decorators
    const decorators: string[] = [];
    for (let i = startIndex - 1; i >= 0; i--) {
      const prevLine = lines[i].trim();
      if (prevLine.startsWith('@')) {
        decorators.unshift(prevLine);
      } else if (prevLine !== '') {
        break;
      }
    }

    // Find methods within the class
    const methods: PythonFunctionDeclaration[] = [];
    for (let i = startIndex + 1; i < endLine; i++) {
      const currentLine = lines[i];
      if (this.isFunctionDefinition(currentLine.trim())) {
        const method = this.parseFunction(lines, i);
        if (method) {
          method.isMethod = true;
          methods.push(method);
        }
      }
    }

    return {
      name,
      line: lineNumber,
      endLine,
      methods,
      baseClasses,
      decorators
    };
  }

  private parseVariable(line: string, lineNumber: number): PythonVariableDeclaration | null {
    // Handle type annotations: name: type = value
    const typeAnnotationMatch = line.match(/^\s*(\w+)\s*:\s*([^=]+)(?:\s*=\s*(.+))?/);
    if (typeAnnotationMatch) {
      return {
        name: typeAnnotationMatch[1],
        line: lineNumber,
        type: typeAnnotationMatch[2].trim(),
        value: typeAnnotationMatch[3]?.trim()
      };
    }

    // Handle simple assignment: name = value
    const assignmentMatch = line.match(/^\s*(\w+)\s*=\s*(.+)/);
    if (assignmentMatch) {
      return {
        name: assignmentMatch[1],
        line: lineNumber,
        value: assignmentMatch[2].trim()
      };
    }

    return null;
  }

  private parseParameters(paramString: string): PythonParameter[] {
    if (!paramString.trim()) return [];

    const parameters: PythonParameter[] = [];
    const params = paramString.split(',');

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      // Handle different parameter types
      let name = '';
      let type: string | undefined;
      let defaultValue: string | undefined;
      let isKeywordOnly = false;
      let isVarArgs = false;
      let isKwArgs = false;

      if (trimmed.startsWith('**')) {
        // **kwargs
        isKwArgs = true;
        name = trimmed.substring(2);
      } else if (trimmed.startsWith('*')) {
        // *args
        isVarArgs = true;
        name = trimmed.substring(1);
      } else {
        // Regular parameter with possible type annotation and default value
        const match = trimmed.match(/^(\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?$/);
        if (match) {
          name = match[1];
          type = match[2]?.trim();
          defaultValue = match[3]?.trim();
        }
      }

      if (name) {
        parameters.push({
          name,
          type,
          defaultValue,
          isKeywordOnly,
          isVarArgs,
          isKwArgs
        });
      }
    }

    return parameters;
  }

  private getIndentation(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
}

// Export default instance
export const pythonParser = new PythonParser();