// test/simple-performance-test.ts
// Simple test to verify Performance Analyzer works

import { PerformanceAnalyzer } from '../src/analyzers/performance';

async function simpleTest() {
  console.log('🧪 Simple Performance Analyzer Test');
  console.log('='.repeat(40));

  const analyzer = new PerformanceAnalyzer();

  // Test code with obvious performance issues
  const testCode = `
function badCode(users) {
  // Bad: accesses .length every iteration
  for (let i = 0; i < users.length; i++) {
    console.log(users[i]);
  }

  // Bad: forEach with async
  users.forEach(async (user) => {
    await saveUser(user);
  });

  // Bad: dangerous regex
  const regex = /(.*)+/;

  return users;
}
  `;

  try {
    const result = await analyzer.analyzePerformance(testCode, 'typescript', 'test.ts');
    
    console.log('\n✅ RESULTS:');
    console.log(`Issues found: ${result.summary.totalIssues}`);
    console.log(`Score: ${result.summary.overallScore}/100`);
    
    result.issues.forEach((issue, i) => {
      console.log(`${i+1}. ${issue.type} - Line ${issue.line}`);
    });

    if (result.summary.totalIssues > 0) {
      console.log('\n✅ TEST PASSED - Issues detected correctly!');
    } else {
      console.log('\n❌ TEST FAILED - No issues detected');
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ TEST FAILED:', error.message);
    } else {
      console.error('❌ TEST FAILED:', error);
    }
  }
}

// Run the test
simpleTest();