// Create this as: packages/core/src/analyzers/__tests__/security-debug.test.ts

import { SecurityAnalyzer, SecurityIssueType } from '../security-debug';

describe('SecurityAnalyzer Debug', () => {
  let analyzer: SecurityAnalyzer;

  beforeEach(() => {
    analyzer = new SecurityAnalyzer();
  });

  test('should detect SQL injection', async () => {
    const code = `
      function getUserData(userId) {
        const query = "SELECT * FROM users WHERE id = " + userId;
        return database.execute(query);
      }
    `;

    const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
    
    console.log("SQL Test Result:", {
      totalIssues: result.issues.length,
      sqlIssues: result.issues.filter(i => i.type === SecurityIssueType.SQL_INJECTION).length
    });

    const sqlIssues = result.issues.filter(i => i.type === SecurityIssueType.SQL_INJECTION);
    expect(sqlIssues.length).toBeGreaterThan(0);
  });

  test('should detect hardcoded secrets', async () => {
    const code = `
      const config = {
        api_key: "sk-1234567890abcdef1234567890abcdef",
        secret_key: "secret_abcdef123456789012345678"
      };
    `;

    const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
    
    console.log("Secret Test Result:", {
      totalIssues: result.issues.length,
      secretIssues: result.issues.filter(i => i.type === SecurityIssueType.HARDCODED_SECRET).length
    });

    const secretIssues = result.issues.filter(i => i.type === SecurityIssueType.HARDCODED_SECRET);
    expect(secretIssues.length).toBeGreaterThan(0);
  });

  test('should detect command injection', async () => {
    const code = `
      function processFile(filename) {
        const command = 'cat ' + filename;
        exec(command, callback);
      }
    `;

    const result = await analyzer.analyzeSecurity(code, 'typescript', 'test.ts');
    
    console.log("Command Test Result:", {
      totalIssues: result.issues.length,
      cmdIssues: result.issues.filter(i => i.type === SecurityIssueType.COMMAND_INJECTION).length
    });

    const cmdIssues = result.issues.filter(i => i.type === SecurityIssueType.COMMAND_INJECTION);
    expect(cmdIssues.length).toBeGreaterThan(0);
  });
});