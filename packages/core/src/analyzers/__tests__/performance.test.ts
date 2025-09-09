// packages/core/src/analyzers/__tests__/performance.test.ts

import { PerformanceAnalyzer, PerformanceIssueType } from '../performance';
import { Language } from '@github-ai/shared';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('Loop Performance Analysis', () => {
    it('should detect inefficient array length access in loops', async () => {
      const code = `
        function processItems(items) {
          for (let i = 0; i < items.length; i++) {
            console.log(items[i]);
          }
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const lengthIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.INEFFICIENT_LOOP &&
        issue.message.includes('length')
      );

      expect(lengthIssues).toHaveLength(1);
      expect(lengthIssues[0].severity).toBe('medium');
      expect(lengthIssues[0].suggestion).toContain('Cache array length');
    });

    it('should detect nested array operations in loops', async () => {
      const code = `
        function findUsers(users, criteria) {
          for (let user of users) {
            const posts = allPosts.filter(post => post.userId === user.id);
            const comments = allComments.find(comment => comment.userId === user.id);
          }
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const nestedIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.INEFFICIENT_LOOP &&
        issue.message.includes('nested')
      );

      expect(nestedIssues).toHaveLength(1);
      expect(nestedIssues[0].severity).toBe('high');
      expect(nestedIssues[0].impact.timeComplexity).toContain('O(n²)');
    });

    it('should detect Python range(len()) anti-pattern', async () => {
      const code = `
        def process_items(items):
            for i in range(len(items)):
                print(items[i])
      `;

      const result = await analyzer.analyzePerformance(code, 'python', 'test.py');
      
      const rangeIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.INEFFICIENT_LOOP
      );

      expect(rangeIssues).toHaveLength(1);
      expect(rangeIssues[0].suggestion).toContain('enumerate');
    });
  });

  describe('Async/Await Performance Analysis', () => {
    it('should detect forEach with async callbacks', async () => {
      const code = `
        async function processUsers(users) {
          users.forEach(async (user) => {
            await updateUser(user);
          });
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const forEachIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT &&
        issue.message.includes('forEach')
      );

      expect(forEachIssues).toHaveLength(1);
      expect(forEachIssues[0].severity).toBe('high');
      expect(forEachIssues[0].suggestion).toContain('Promise.all');
    });

    it('should detect sequential awaits in loops', async () => {
      const code = `
        async function fetchUserData(userIds) {
          const results = [];
          for (const id of userIds) {
            const userData = await fetchUser(id);
            results.push(userData);
          }
          return results;
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const sequentialIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT &&
        issue.message.includes('Sequential')
      );

      expect(sequentialIssues).toHaveLength(1);
      expect(sequentialIssues[0].severity).toBe('high');
      expect(sequentialIssues[0].impact.estimatedSlowdown).toContain('times slower');
    });
  });

  describe('Memory Pattern Analysis', () => {
    it('should detect large object creation', async () => {
      const code = `
        function createLargeConfig() {
          return {
            prop1: 'value1', prop2: 'value2', prop3: 'value3',
            prop4: 'value4', prop5: 'value5', prop6: 'value6',
            prop7: 'value7', prop8: 'value8', prop9: 'value9',
            prop10: 'value10', prop11: 'value11', prop12: 'value12',
            prop13: 'value13', prop14: 'value14', prop15: 'value15'
          };
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const memoryIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.LARGE_OBJECT_CREATION
      );

      expect(memoryIssues).toHaveLength(1);
      expect(memoryIssues[0].impact.memoryUsage).toBe('high');
    });

    it('should detect event listeners without removal', async () => {
      const code = `
        function setupEventHandlers() {
          document.addEventListener('click', handleClick);
          window.addEventListener('resize', handleResize);
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const memoryLeakIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.MEMORY_LEAK_RISK
      );

      expect(memoryLeakIssues).toHaveLength(2);
      expect(memoryLeakIssues[0].suggestion).toContain('removeEventListener');
    });
  });

  describe('Complexity Pattern Analysis', () => {
    it('should detect recursive functions without memoization', async () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const recursiveIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION
      );

      expect(recursiveIssues).toHaveLength(1);
      expect(recursiveIssues[0].severity).toBe('high');
      expect(recursiveIssues[0].impact.timeComplexity).toContain('exponential');
    });

    it('should detect inefficient sorting algorithms', async () => {
      const code = `
        function bubbleSort(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
              if (arr[j] > arr[j + 1]) {
                // swap elements
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
              }
            }
          }
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const sortIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.INEFFICIENT_SORTING
      );

      expect(sortIssues).toHaveLength(1);
      expect(sortIssues[0].impact.timeComplexity).toContain('O(n²)');
    });
  });

  describe('Regex Performance Analysis', () => {
    it('should detect catastrophic backtracking patterns', async () => {
      const code = `
        const dangerousRegex = /(.*)+/;
        const anotherDangerous = /(.+)*/;
        const alsoDangerous = /(\\w*)+/;
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const regexIssues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.INEFFICIENT_REGEX
      );

      expect(regexIssues.length).toBeGreaterThan(0);
      regexIssues.forEach(issue => {
        expect(issue.severity).toBe('critical');
        expect(issue.description).toContain('backtracking');
      });
    });
  });

  describe('Database Pattern Analysis', () => {
    it('should detect N+1 query patterns', async () => {
      const code = `
        async function getUsersWithPosts(users) {
          for (const user of users) {
            const posts = await db.query('SELECT * FROM posts WHERE user_id = ?', user.id);
            user.posts = posts;
          }
        }
      `;

      const result = await analyzer.analyzePerformance(code, 'typescript', 'test.ts');
      
      const n1Issues = result.issues.filter(
        issue => issue.type === PerformanceIssueType.N_PLUS_ONE_QUERY
      );

      expect(n1Issues).toHaveLength(1);
      expect(n1Issues[0].severity).toBe('critical');
      expect(n1Issues[0].suggestion).toContain('bulk');
    });
  });

  describe('Analysis Summary', () => {
    it('should calculate overall performance score correctly', async () => {
      const goodCode = `
        function efficientProcess(items) {
          const len = items.length;
          const results = new Array(len);
          for (let i = 0; i < len; i++) {
            results[i] = processItem(items[i]);
          }
          return results;
        }
      `;

      const result = await analyzer.analyzePerformance(goodCode, 'typescript', 'test.ts');
      
      expect(result.summary.overallScore).toBeGreaterThan(80);
      expect(result.summary.totalIssues).toBe(0);
    });

    it('should provide relevant recommendations', async () => {
      const problematicCode = `
        async function badExample(users) {
          users.forEach(async (user) => {
            for (let i = 0; i < user.posts.length; i++) {
              await updatePost(user.posts[i]);
            }
          });
        }
      `;

      const result = await analyzer.analyzePerformance(problematicCode, 'typescript', 'test.ts');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('Promise.all'))).toBe(true);
    });
  });

  describe('Issue Type Details', () => {
    it('should provide detailed information for issue types', async () => {
      // Explicitly type details as any or the correct interface if available
      const details: any = await analyzer.getIssueTypeDetails(PerformanceIssueType.N_PLUS_ONE_QUERY);

      // Ensure details is not void/null before accessing properties
      expect(details).toBeDefined();
      if (details) {
        expect(details.description).toContain('database');
        expect(details.commonCauses && details.commonCauses.length).toBeGreaterThan(0);
        expect(details.solutions && details.solutions.length).toBeGreaterThan(0);
        expect(details.examples && details.examples.length).toBeGreaterThan(0);
        expect(details.examples && details.examples[0]).toHaveProperty('bad');
        expect(details.examples && details.examples[0]).toHaveProperty('good');
      }
    });
  });
});

// Integration test with real TypeScript code
describe('PerformanceAnalyzer Integration', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  it('should analyze a complex TypeScript file', async () => {
    const complexCode = `
      import { User, Post } from './types';

      class UserService {
        private cache = new Map<string, User>();

        async getUsers(): Promise<User[]> {
          const users = await this.fetchUsers();
          
          // Inefficient: forEach with async
          users.forEach(async (user) => {
            user.posts = await this.getPosts(user.id);
          });

          return users;
        }

        async getPostsInefficient(users: User[]): Promise<void> {
          // N+1 query pattern
          for (const user of users) {
            const posts = await this.database.query('SELECT * FROM posts WHERE user_id = ?', user.id);
            user.posts = posts;
          }
        }

        processData(items: any[]): any[] {
          const results = [];
          // Inefficient loop
          for (let i = 0; i < items.length; i++) {
            // Nested array operation
            const related = this.allData.filter(data => data.itemId === items[i].id);
            results.push({ ...items[i], related });
          }
          return results;
        }

        fibonacci(n: number): number {
          // Recursive without memoization
          if (n <= 1) return n;
          return this.fibonacci(n - 1) + this.fibonacci(n - 2);
        }

        validateInput(input: string): boolean {
          // Dangerous regex
          const pattern = /(.*)+/;
          return pattern.test(input);
        }

        setupEventListeners(): void {
          // Memory leak risk
          document.addEventListener('click', this.handleClick);
          window.addEventListener('resize', this.handleResize);
        }

        private handleClick = () => { /* ... */ };
        private handleResize = () => { /* ... */ };
        private fetchUsers = async (): Promise<User[]> => { /* ... */ return []; };
        private getPosts = async (userId: string): Promise<Post[]> => { /* ... */ return []; };
        private database = { query: async (sql: string, ...params: any[]) => { /* ... */ return []; } };
        private allData: any[] = [];
      }
    `;

    const result = await analyzer.analyzePerformance(complexCode, 'typescript', 'user-service.ts');

    expect(result.issues.length).toBeGreaterThan(5);
    expect(result.summary.overallScore).toBeLessThan(50);
    expect(result.recommendations.length).toBeGreaterThan(0);

    // Check that we found the major issues
    const issueTypes = result.issues.map(issue => issue.type);
    expect(issueTypes).toContain(PerformanceIssueType.EXCESSIVE_ASYNC_AWAIT);
    expect(issueTypes).toContain(PerformanceIssueType.N_PLUS_ONE_QUERY);
    expect(issueTypes).toContain(PerformanceIssueType.INEFFICIENT_LOOP);
    expect(issueTypes).toContain(PerformanceIssueType.RECURSIVE_WITHOUT_MEMOIZATION);
    expect(issueTypes).toContain(PerformanceIssueType.INEFFICIENT_REGEX);
    expect(issueTypes).toContain(PerformanceIssueType.MEMORY_LEAK_RISK);
  });
});

// Mock test data for testing edge cases
const testCases = {
  emptyCode: '',
  invalidSyntax: 'function broken( { invalid syntax here',
  noIssues: `
    function optimizedFunction(items: string[]): string[] {
      const length = items.length;
      const results = new Array(length);
      
      for (let i = 0; i < length; i++) {
        results[i] = items[i].toUpperCase();
      }
      
      return results;
    }
  `,
  multipleLanguages: {
    typescript: `
      const inefficientLoop = (arr: number[]) => {
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      };
    `,
    python: `
      def inefficient_loop(items):
          for i in range(len(items)):
              print(items[i])
    `,
    javascript: `
      function inefficientLoop(arr) {
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      }
    `
  }
};

describe('PerformanceAnalyzer Edge Cases', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  it('should handle empty code gracefully', async () => {
    const result = await analyzer.analyzePerformance(testCases.emptyCode, 'typescript');
    expect(result.issues).toHaveLength(0);
    expect(result.summary.overallScore).toBe(100);
  });

  it('should handle invalid syntax gracefully', async () => {
    const result = await analyzer.analyzePerformance(testCases.invalidSyntax, 'typescript');
    // Should not crash, may have limited analysis
    expect(result).toBeDefined();
    expect(result.analysisTime).toBeGreaterThan(0);
  });

  it('should handle code with no performance issues', async () => {
    const result = await analyzer.analyzePerformance(testCases.noIssues, 'typescript');
    expect(result.summary.overallScore).toBeGreaterThan(90);
    expect(result.summary.totalIssues).toBe(0);
  });
});