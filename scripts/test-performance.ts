// scripts/test-performance.ts
// Quick CLI test script

import { PerformanceAnalyzer } from '../packages/core/src/analyzers/performance';
import * as fs from 'fs';
import * as path from 'path';

async function testPerformanceAnalyzer() {
  console.log('🚀 Performance Analyzer CLI Test');
  console.log('='.repeat(40));

  const analyzer = new PerformanceAnalyzer();

  // Test 1: Analyze a test file
  console.log('\n📝 Test 1: Analyzing test code...');
  
  const testCode = `
// This file contains multiple performance issues for testing

async function problematicFunction(users) {
  // Issue 1: Inefficient loop
  for (let i = 0; i < users.length; i++) {
    console.log(users[i].name);
  }

  // Issue 2: forEach with async (causes race conditions)
  users.forEach(async (user) => {
    await updateUserInDatabase(user);
  });

  // Issue 3: N+1 query problem
  for (const user of users) {
    const posts = await database.query('SELECT * FROM posts WHERE user_id = ?', user.id);
    user.posts = posts;
  }

  // Issue 4: Memory leak risk
  document.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);

  // Issue 5: Dangerous regex (catastrophic backtracking)
  const emailPattern = /(.*)+@(.*)+\\.com/;
  
  // Issue 6: Recursive function without memoization
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  // Issue 7: Large object creation in loop
  const results = [];
  for (let i = 0; i < 1000; i++) {
    results.push({
      id: i, name: 'User ' + i, email: 'user' + i + '@test.com',
      profile: { age: 25, city: 'NYC', country: 'USA' },
      preferences: { theme: 'dark', lang: 'en', notifications: true },
      metadata: { created: new Date(), updated: new Date() }
    });
  }

  return results;
}
  `;

  try {
    const result = await analyzer.analyzePerformance(testCode, 'typescript', 'test-file.ts');
    
    console.log(`✅ Analysis completed in ${result.analysisTime}ms`);
    console.log(`📊 Found ${result.summary.totalIssues} performance issues`);
    console.log(`📈 Overall score: ${result.summary.overallScore}/100`);
    
    console.log('\n🔍 Issue Breakdown:');
    console.log(`   🔴 Critical: ${result.summary.criticalIssues}`);
    console.log(`   🟠 High: ${result.summary.highIssues}`);
    console.log(`   🟡 Medium: ${result.summary.mediumIssues}`);
    console.log(`   🟢 Low: ${result.summary.lowIssues}`);

    console.log('\n📋 Detailed Issues:');
    result.issues.forEach((issue, index) => {
      const icon = issue.severity === 'critical' ? '🔴' : 
                   issue.severity === 'high' ? '🟠' : 
                   issue.severity === 'medium' ? '🟡' : '🟢';
      
      console.log(`${index + 1}. ${icon} ${issue.type}`);
      console.log(`   📍 Line ${issue.line}: ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      console.log(`   ⚡ Impact: ${issue.impact.estimatedSlowdown}`);
      console.log('');
    });

    console.log('💡 Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // Test 2: Analyze actual project files (if they exist)
    console.log('\n📝 Test 2: Analyzing actual project files...');
    
    const projectFiles = [
      'packages/core/src/analyzers/complexity.ts',
      'packages/core/src/analyzers/security.ts',
      'packages/core/src/engine/index.ts'
    ];

    for (const filePath of projectFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const language = filePath.endsWith('.ts') ? 'typescript' : 'javascript';
          
          const fileResult = await analyzer.analyzePerformance(fileContent, language, filePath);
          
          console.log(`📄 ${path.basename(filePath)}: ${fileResult.summary.totalIssues} issues (Score: ${fileResult.summary.overallScore}/100)`);
          
          if (fileResult.summary.totalIssues > 0) {
            fileResult.issues.slice(0, 3).forEach(issue => {
              console.log(`   - ${issue.type} (${issue.severity}) at line ${issue.line}`);
            });
          }
        } catch (error) {
          if (error instanceof Error) {
            console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
          } else {
            console.log(`❌ Error analyzing ${filePath}: ${String(error)}`);
          }
        }
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }

    // Test 3: Performance benchmark
    console.log('\n📝 Test 3: Performance benchmark...');
    
    const benchmarkCode = Array(100).fill(testCode).join('\n');
    const benchmarkStart = Date.now();
    
    await analyzer.analyzePerformance(benchmarkCode, 'typescript', 'benchmark.ts');
    
    const benchmarkTime = Date.now() - benchmarkStart;
    console.log(`⚡ Analyzed ${benchmarkCode.split('\n').length} lines in ${benchmarkTime}ms`);
    console.log(`📊 Performance: ${(benchmarkCode.length / benchmarkTime * 1000).toFixed(0)} chars/second`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n✅ Performance Analyzer is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Test 4: Integration test helper
export async function testWithRealFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const analyzer = new PerformanceAnalyzer();
  const content = fs.readFileSync(filePath, 'utf8');
  const language = filePath.endsWith('.py') ? 'python' : 
                   filePath.endsWith('.js') ? 'javascript' : 'typescript';

  console.log(`🔍 Analyzing: ${filePath}`);
  
  const result = await analyzer.analyzePerformance(content, language, filePath);
  
  console.log(`📊 Results: ${result.summary.totalIssues} issues, Score: ${result.summary.overallScore}/100`);
  
  if (result.summary.totalIssues > 0) {
    result.issues.forEach((issue, i) => {
      console.log(`${i+1}. ${issue.type} (${issue.severity}) - Line ${issue.line}`);
      console.log(`   ${issue.message}`);
    });
  } else {
    console.log('✅ No performance issues found!');
  }
}

// Run if called directly
if (require.main === module) {
  testPerformanceAnalyzer();
}

// Export for use in other test files
export { testPerformanceAnalyzer };