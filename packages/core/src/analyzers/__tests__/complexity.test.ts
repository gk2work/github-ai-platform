// packages/core/src/analyzers/__tests__/complexity.test.ts
// FIXED VERSION - Replace your existing test file

import { ComplexityAnalyzer } from '../complexity';
import { Language } from '@github-ai/shared';

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
  });

  describe('Function Complexity Analysis', () => {
    it('should calculate cyclomatic complexity for simple function', async () => {
      const code = `
        function simpleFunction(x) {
          return x + 1;
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      expect(result.functionComplexity[0].name).toBe('simpleFunction');
      expect(result.functionComplexity[0].cyclomaticComplexity).toBe(1);
      expect(result.functionComplexity[0].parameters).toBe(1);
    });

    it('should calculate complexity for function with conditionals', async () => {
      const code = `
        function complexFunction(x, y) {
          if (x > 0) {
            if (y > 0) {
              return x + y;
            } else {
              return x - y;
            }
          } else {
            return 0;
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.name).toBe('complexFunction');
      expect(func.cyclomaticComplexity).toBeGreaterThan(1);
      expect(func.cognitiveComplexity).toBeGreaterThan(1);
      expect(func.nestingDepth).toBeGreaterThan(1);
      expect(func.parameters).toBe(2);
    });

    it('should handle async functions', async () => {
      const code = `
        async function asyncFunction(data) {
          try {
            const result = await processData(data);
            return result;
          } catch (error) {
            throw new Error('Processing failed');
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.name).toBe('asyncFunction');
      expect(func.isAsync).toBe(true);
      expect(func.cyclomaticComplexity).toBeGreaterThan(1); // try/catch adds complexity
    });

    it('should handle arrow functions', async () => {
      const code = `
        const arrowFunction = (x, y) => {
          if (x && y) {
            return x * y;
          }
          return 0;
        };
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.name).toBe('arrowFunction');
      expect(func.parameters).toBe(2);
      expect(func.cyclomaticComplexity).toBeGreaterThan(1);
    });

    it('should detect exported functions', async () => {
      const code = `
        export function exportedFunction(param) {
          return param * 2;
        }

        function localFunction() {
          return 42;
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(2);
      
      const exported = result.functionComplexity.find(f => f.name === 'exportedFunction');
      const local = result.functionComplexity.find(f => f.name === 'localFunction');
      
      expect(exported?.isExported).toBe(true);
      expect(local?.isExported).toBe(false);
    });
  });

  describe('Class Complexity Analysis', () => {
    it('should analyze simple class', async () => {
      const code = `
        class SimpleClass {
          constructor(value) {
            this.value = value;
          }

          getValue() {
            return this.value;
          }

          setValue(newValue) {
            this.value = newValue;
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.classComplexity).toHaveLength(1);
      const cls = result.classComplexity[0];
      expect(cls.name).toBe('SimpleClass');
      expect(cls.methods.length).toBeGreaterThan(0);
      expect(cls.properties).toBeGreaterThan(0);
    });

    it('should analyze exported class', async () => {
      const code = `
        export class ExportedClass {
          private data: string;

          constructor(data: string) {
            this.data = data;
          }

          public processData() {
            if (this.data) {
              return this.data.toUpperCase();
            }
            return '';
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.classComplexity).toHaveLength(1);
      const cls = result.classComplexity[0];
      expect(cls.name).toBe('ExportedClass');
      expect(cls.isExported).toBe(true);
    });
  });

  describe('Loop Complexity', () => {
    it('should handle different loop types', async () => {
      const code = `
        function loopFunction(items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i] > 0) {
              console.log(items[i]);
            }
          }

          for (const item of items) {
            if (item < 0) {
              continue;
            }
          }

          let count = 0;
          while (count < 10) {
            count++;
            if (count === 5) {
              break;
            }
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.cyclomaticComplexity).toBeGreaterThan(5); // Multiple loops and conditions
    });
  });

  describe('Logical Operators Complexity', () => {
    it('should count logical operators correctly', async () => {
      const code = `
        function logicalFunction(a, b, c) {
          if (a && b || c) {
            return true;
          }
          
          if (a && (c || false)) {
            return false;
          }
          
          return a && b && c;
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.cyclomaticComplexity).toBeGreaterThan(3); // Multiple logical operators
    });
  });

  describe('Exception Handling Complexity', () => {
    it('should handle try-catch complexity', async () => {
      const code = `
        function errorHandlingFunction(data) {
          try {
            if (!data) {
              throw new Error('No data');
            }
            
            try {
              return processData(data);
            } catch (innerError) {
              return defaultValue;
            }
          } catch (error) {
            if (error.type === 'critical') {
              throw error;
            }
            return null;
          } finally {
            cleanup();
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.cyclomaticComplexity).toBeGreaterThan(4); // Multiple try-catch blocks and conditions
      expect(func.nestingDepth).toBeGreaterThan(2); // Nested try-catch
    });
  });

  describe('Switch Statement Complexity', () => {
    it('should handle switch statements', async () => {
      const code = `
        function switchFunction(type) {
          switch (type) {
            case 'A':
              return handleA();
            case 'B':
              if (condition) {
                return handleB1();
              }
              return handleB2();
            case 'C':
            case 'D':
              return handleCD();
            default:
              throw new Error('Unknown type');
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      const func = result.functionComplexity[0];
      expect(func.cyclomaticComplexity).toBeGreaterThan(3); // Switch cases add complexity
    });
  });

  describe('File-Level Complexity', () => {
    it('should calculate file-level metrics', async () => {
      const code = `
        export class Calculator {
          add(a, b) {
            return a + b;
          }

          subtract(a, b) {
            return a - b;
          }

          complex(x, y, z) {
            if (x > 0) {
              for (let i = 0; i < y; i++) {
                if (i % 2 === 0) {
                  z += i;
                }
              }
            } else {
              while (z > 0) {
                z--;
                if (z === 10) {
                  break;
                }
              }
            }
            return z;
          }
        }

        function utilityFunction(data) {
          try {
            return data.map(item => item * 2);
          } catch (error) {
            return [];
          }
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.fileComplexity).toBeDefined();
      expect(result.fileComplexity.totalCyclomaticComplexity).toBeGreaterThan(0);
      expect(result.fileComplexity.totalCognitiveComplexity).toBeGreaterThan(0);
      expect(result.fileComplexity.averageFunctionComplexity).toBeGreaterThan(0);
      expect(result.fileComplexity.maxFunctionComplexity).toBeGreaterThan(0);
      expect(result.fileComplexity.maintainabilityIndex).toBeGreaterThanOrEqual(0);
      expect(result.fileComplexity.maintainabilityIndex).toBeLessThanOrEqual(100);
    });
  });

  describe('Language Support', () => {
    it('should work with Python code', async () => {
      const code = `
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

class Calculator:
    def __init__(self, initial_value=0):
        self.value = initial_value
    
    def add(self, x):
        if x > 0:
            self.value += x
        return self.value
      `;

      const result = await analyzer.analyzeComplexity(code, 'python', 'test.py', 'python');
      
      expect(result.functionComplexity.length).toBeGreaterThan(0);
      expect(result.classComplexity.length).toBeGreaterThan(0);
    });

    it('should work with Java code', async () => {
      const code = `
public class Example {
    public static int factorial(int n) {
        if (n <= 1) {
            return 1;
        } else {
            return n * factorial(n - 1);
        }
    }

    public void processArray(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] > 0) {
                System.out.println(arr[i]);
            }
        }
    }
}
      `;

      const result = await analyzer.analyzeComplexity(code, 'java', 'test.java', 'java');
      
      expect(result.functionComplexity.length).toBeGreaterThan(0);
      expect(result.classComplexity.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const result = await analyzer.analyzeComplexity('', 'typescript', 'empty.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(0);
      expect(result.classComplexity).toHaveLength(0);
      expect(result.cyclomaticComplexity).toBe(0);
      expect(result.cognitiveComplexity).toBe(0);
    });

    it('should handle code with only comments', async () => {
      const code = `
        // This is a comment
        /* This is a 
           multi-line comment */
        // Another comment
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'comments.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(0);
      expect(result.classComplexity).toHaveLength(0);
    });

    it('should handle malformed code gracefully', async () => {
      const code = `
        function incomplete( {
          if (something
        class BrokenClass {
          method() {
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'broken.ts', 'typescript');
      
      // Should not throw, might find some partial matches
      expect(result).toBeDefined();
    });

    it('should handle functions with no parameters', async () => {
      const code = `
        function noParams() {
          return 42;
        }
      `;

      const result = await analyzer.analyzeComplexity(code, 'typescript', 'test.ts', 'typescript');
      
      expect(result.functionComplexity).toHaveLength(1);
      expect(result.functionComplexity[0].parameters).toBe(0);
    });
  });

  describe('Maintainability Index', () => {
    it('should calculate reasonable maintainability scores', async () => {
      const simpleCode = `
        function simple(x) {
          return x * 2;
        }
      `;

      const complexCode = `
        function complex(a, b, c, d, e, f, g, h) {
          if (a && b || c) {
            for (let i = 0; i < 100; i++) {
              if (i % 2 === 0) {
                try {
                  if (d && e && f) {
                    while (g) {
                      if (h) {
                        switch (i) {
                          case 0: return 0;
                          case 1: return 1;
                          case 2: return 2;
                          default: return -1;
                        }
                      }
                    }
                  }
                } catch (error) {
                  throw error;
                }
              }
            }
          }
          return null;
        }
      `;

      const simpleResult = await analyzer.analyzeComplexity(simpleCode, 'typescript', 'simple.ts', 'typescript');
      const complexResult = await analyzer.analyzeComplexity(complexCode, 'typescript', 'complex.ts', 'typescript');

      expect(simpleResult.fileComplexity.maintainabilityIndex)
        .toBeGreaterThan(complexResult.fileComplexity.maintainabilityIndex);
      
      expect(simpleResult.fileComplexity.maintainabilityIndex).toBeGreaterThan(70);
      expect(complexResult.fileComplexity.maintainabilityIndex).toBeLessThan(50);
    });
  });
});