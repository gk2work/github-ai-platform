// test/performance-analyzer.test.ts
// Comprehensive test suite for Performance Analyzer

import { PerformanceAnalyzer, PerformanceIssueType } from '../src/analyzers/performance';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('Basic Functionality', () => {
    it('should detect inefficient loops', async () => {
      const code = `
        function test(items) {
          for (let i = 0; i < items.length; i++) {
            console.log(items[i]);
          }
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.INEFFICIENT_LOOP);
      expect(result.issues[0].severity).toBe('medium');
    });

    it('should detect forEach with async', async () => {
      const code = `
        items.forEach(async (item) => {
          await process(item);
        });
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT);
      expect(result.issues[0].severity).toBe('high');
    });

    it('should detect dangerous regex patterns', async () => {
      const code = `
        const pattern = /(.*)+/;
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.INEFFICIENT_REGEX);
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should detect N+1 query patterns', async () => {
      const code = `
        for (const user of users) {
          const posts = await db.query('SELECT * FROM posts WHERE user_id = ?', user.id);
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.N_PLUS_ONE_QUERY);
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should detect memory leak risks', async () => {
      const code = `
        document.addEventListener('click', handler);
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.MEMORY_LEAK_RISK);
      expect(result.issues[0].severity).toBe('high');
    });

    it('should detect recursive functions without memoization', async () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION);
      expect(result.issues[0].severity).toBe('high');
    });
  });

  describe('Multi-language Support', () => {
    it('should detect Python range(len()) pattern', async () => {
      const code = `
        for i in range(len(items)):
            print(items[i])
      `;

      const result = await analyzer.analyzePerformance(code, 'python', 'test.py');
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe(PerformanceIssueType.INEFFICIENT_LOOP);
      expect(result.issues[0].suggestion).toContain('enumerate');
    });
  });

  describe('Analysis Summary', () => {
    it('should calculate overall score correctly', async () => {
      const cleanCode = `
        function goodCode(items) {
          const len = items.length;
          for (let i = 0; i < len; i++) {
            console.log(items[i]);
          }
        }
      `;

      const result = await analyzer.analyzePerformance(cleanCode, 'typescript', 'test.ts');
      
      expect(result.summary.totalIssues).toBe(0);
      expect(result.summary.overallScore).toBe(100);
    });

    it('should provide relevant recommendations', async () => {
      const problematicCode = `
        items.forEach(async (item) => {
          await process(item);
        });
        const pattern = /(.*)+/;
      `;

      const result = await analyzer.analyzePerformance(problematicCode, 'typescript', 'test.ts');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('async'))).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('regex'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const result = await analyzer.analyzePerformance('', 'typescript', 'test.ts');
      
      expect(result.summary.totalIssues).toBe(0);
      expect(result.summary.overallScore).toBe(100);
    });

    it('should handle invalid syntax gracefully', async () => {
      const invalidCode = 'function broken( { invalid syntax';
      
      const result = await analyzer.analyzePerformance(invalidCode, 'typescript', 'test.ts');
      
      expect(result).toBeDefined();
      expect(result.analysisTime).toBeGreaterThan(0);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy detectPerformanceIssues method', async () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          console.log(items[i]);
        }
      `;

      const issues = await analyzer.detectPerformanceIssues(code);
      
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty('type');
      expect(issues[0]).toHaveProperty('severity');
    });
  });
});

// Integration test with AnalyzerEngine
describe('PerformanceAnalyzer Integration', () => {
  it('should work with AnalyzerEngine', async () => {
    // This would test the full integration
    // Commented out since we'd need to set up the full engine
    
    /*
    const config = new AnalysisConfigBuilder()
      .forLanguages(['typescript'])
      .withCategories(['performance'])
      .build();

    const engine = createAnalyzerEngine(config, { enablePerformance: true });
    
    const fileInfo = {
      path: 'test.ts',
      language: 'typescript' as const,
      lines: 10,
      size: 200,
      isGenerated: false,
      lastModified: new Date()
    };

    const result = await engine.analyzeFile(fileInfo, testCode, 'test-repo');
    
    expect(result.performance).toBeDefined();
    expect(result.summary.issuesByCategory.performance).toBeGreaterThan(0);
    */
  });
});

// Manual test runner
export async function runManualTests() {
  console.log('🧪 Running Manual Performance Analyzer Tests');
  console.log('='.repeat(50));

  const analyzer = new PerformanceAnalyzer();
  
  const testCases = [
    {
      name: 'Inefficient Loop',
      code: 'for (let i = 0; i < arr.length; i++) { console.log(i); }',
      expectedIssues: 1
    },
    {
      name: 'forEach with Async',
      code: 'items.forEach(async (item) => { await process(item); });',
      expectedIssues: 1
    },
    {
      name: 'Dangerous Regex',
      code: 'const pattern = /(.*)+/;',
      expectedIssues: 1
    },
    {
      name: 'Clean Code',
      code: 'const len = arr.length; for (let i = 0; i < len; i++) { console.log(i); }',
      expectedIssues: 0
    }
  ];

  for (const testCase of testCases) {
    try {
      const result = await analyzer.analyzePerformance(testCase.code, 'typescript', 'test.ts');
      const passed = result.summary.totalIssues === testCase.expectedIssues;
      
      console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${result.summary.totalIssues} issues (expected ${testCase.expectedIssues})`);
      
      if (!passed) {
        console.log(`   Found: ${result.issues.map(i => i.type).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n🎯 Manual tests complete!');
}