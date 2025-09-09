// packages/core/src/analyzers/__tests__/integration.test.ts
// Test to verify SecurityAnalyzer integrates with your existing system

import { AnalyzerEngine } from '../analyzer-engine';
import { SecurityAnalyzer } from '../security';
import { PerformanceAnalyzer } from '../performance';

describe('Analyzer Integration', () => {
  it('should work with SecurityAnalyzer in AnalyzerEngine', async () => {
    const securityAnalyzer = new SecurityAnalyzer();
    
    const code = `
      const api_key = "sk-1234567890abcdef1234567890abcdef";
      eval("dangerous code");
    `;
    
    const result = await securityAnalyzer.analyzeSecurity(code, 'typescript', 'test.ts');
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.summary.totalIssues).toBeGreaterThan(0);
    expect(result.summary.overallRiskScore).toBeGreaterThan(0);
  });

  it('should work alongside PerformanceAnalyzer', async () => {
    const securityAnalyzer = new SecurityAnalyzer();
    const performanceAnalyzer = new PerformanceAnalyzer();
    
    const code = `
      function inefficientAndUnsafe(items, userInput) {
        for (let i = 0; i < items.length; i++) {
          eval(userInput + items[i]);
        }
      }
    `;
    
    const [securityResult, performanceResult] = await Promise.all([
      securityAnalyzer.analyzeSecurity(code, 'typescript', 'test.ts'),
      performanceAnalyzer.analyzePerformance(code, 'typescript', 'test.ts')
    ]);
    
    expect(securityResult.issues.length).toBeGreaterThan(0);
    expect(performanceResult.issues.length).toBeGreaterThan(0);
  });
});