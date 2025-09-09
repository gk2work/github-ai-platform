// packages/core/src/analyzers/__tests__/security.test.ts

import { SecurityAnalyzer, SecurityIssueType } from '../security';
import { Language } from '@github-ai/shared';

describe('SecurityAnalyzer', () => {
  let analyzer: SecurityAnalyzer;

  beforeEach(() => {
    analyzer = new SecurityAnalyzer();
  });

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection via string concatenation', async () => {
      const code = `
        function getUserData(userId) {
          const query = "SELECT * FROM users WHERE id = " + userId;
          return database.execute(query);
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const sqlIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.SQL_INJECTION
      );

      expect(sqlIssues).toHaveLength(1);
      expect(sqlIssues[0].severity).toBe('critical');
      expect(sqlIssues[0].suggestion).toContain('parameterized queries');
    });

    it('should not flag safe parameterized queries', async () => {
      const code = `
        function getUserData(userId) {
          const query = "SELECT * FROM users WHERE id = ?";
          return database.execute(query, [userId]);
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const sqlIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.SQL_INJECTION
      );

      expect(sqlIssues).toHaveLength(0);
    });
  });

  describe('XSS Vulnerability Detection', () => {
    it('should detect dangerous innerHTML usage', async () => {
      const code = `
        function updateContent(userInput) {
          document.getElementById('content').innerHTML = '<div>' + userInput + '</div>';
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const xssIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.XSS_VULNERABILITY
      );

      expect(xssIssues).toHaveLength(1);
      expect(xssIssues[0].severity).toBe('high');
      expect(xssIssues[0].suggestion).toContain('textContent');
    });
  });

  describe('Hardcoded Secrets Detection', () => {
    it('should detect hardcoded API keys', async () => {
      const code = `
        const config = {
          api_key: "sk-1234567890abcdef1234567890abcdef",
          secret_key: "secret_abcdef123456789012345678"
        };
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const secretIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.HARDCODED_SECRET
      );

      expect(secretIssues.length).toBeGreaterThan(0);
      expect(secretIssues[0].severity).toBe('critical');
      expect(secretIssues[0].suggestion).toContain('environment variables');
    });
  });

  describe('Insecure Crypto Detection', () => {
    it('should detect weak hash functions', async () => {
      const code = `
        import crypto from 'crypto';
        
        function hashPassword(password) {
          return crypto.createHash('md5').update(password).digest('hex');
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const cryptoIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.INSECURE_CRYPTO
      );

      expect(cryptoIssues).toHaveLength(1);
      expect(cryptoIssues[0].severity).toBe('medium');
      expect(cryptoIssues[0].suggestion).toContain('SHA-256');
    });
  });

  describe('Command Injection Detection', () => {
    it('should detect dangerous exec usage', async () => {
      const code = `
        function processFile(filename) {
          const command = 'cat ' + filename;
          exec(command, callback);
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const cmdIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.COMMAND_INJECTION
      );

      expect(cmdIssues).toHaveLength(1);
      expect(cmdIssues[0].severity).toBe('critical');
    });
  });

  describe('Unsafe eval Detection', () => {
    it('should detect eval usage', async () => {
      const code = `
        function dynamicFunction(userCode) {
          return eval(userCode);
        }
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      
      const evalIssues = result.issues.filter(
        issue => issue.type === SecurityIssueType.UNSAFE_EVAL
      );

      expect(evalIssues).toHaveLength(1);
      expect(evalIssues[0].severity).toBe('high');
      expect(evalIssues[0].suggestion).toContain('JSON.parse');
    });
  });

  describe('Quick Security Scan', () => {
    it('should scan for specific vulnerability types only', async () => {
      const code = `
        const api_key = "sk-1234567890abcdef1234567890abcdef";
        eval("some code");
        const query = "SELECT * FROM users WHERE id = " + userId;
      `;

      // Only scan for hardcoded secrets
      const issues = await analyzer.quickSecurityScan(
        code, 
        'typescript', 
        [SecurityIssueType.HARDCODED_SECRET]
      );

      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe(SecurityIssueType.HARDCODED_SECRET);
    });
  });

  describe('Security Summary', () => {
    it('should generate comprehensive security summary', async () => {
      const code = `
        const api_key = "sk-1234567890abcdef1234567890abcdef";
        eval("some code");
        const query = "SELECT * FROM users WHERE id = " + userId;
        document.innerHTML = userInput + "content";
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');

      expect(result.summary.totalIssues).toBeGreaterThan(0);
      expect(result.summary.overallRiskScore).toBeGreaterThan(0);
      expect(result.summary.recommendations.length).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should provide issue counts by type and severity', async () => {
      const code = `
        const api_key = "sk-1234567890abcdef1234567890abcdef";
        const query = "SELECT * FROM users WHERE id = " + userId;
      `;

      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');

      expect(result.summary.criticalIssues).toBeGreaterThan(0);
      expect(result.summary.issuesByType[SecurityIssueType.HARDCODED_SECRET]).toBeGreaterThan(0);
      expect(result.summary.issuesByType[SecurityIssueType.SQL_INJECTION]).toBeGreaterThan(0);
    });
  });

  describe('Language Support', () => {
    it('should work with JavaScript', async () => {
      const code = `eval("dangerous code");`;
      const result = await analyzer.analyzeSecurity(code, 'javascript', 'test.js');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should work with Python', async () => {
      const code = `exec("rm -rf " + user_input)`;
      const result = await analyzer.analyzeSecurity(code, 'python', 'test.py');
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty code gracefully', async () => {
      const result = await analyzer.analyzeSecurity('', 'typescript', 'test.ts');
      expect(result.issues).toHaveLength(0);
      expect(result.summary.totalIssues).toBe(0);
    });

    it('should handle malformed code gracefully', async () => {
      const code = `function incomplete( {`;
      const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
      // Should not throw, might have 0 or more issues
      expect(result).toBeDefined();
    });
  });
});