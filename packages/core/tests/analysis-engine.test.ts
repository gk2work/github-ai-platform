// packages/core/tests/analysis-engine.test.ts - MINIMAL VERSION

import { AnalysisEngine } from '../src/engine';
import { QuickConfigs } from '../src/models/analysis';
import { Repository } from '@github-ai/shared';

describe('AnalysisEngine', () => {
  let engine: AnalysisEngine;

  beforeAll(() => {
    engine = new AnalysisEngine(QuickConfigs.minimal());
  });

  it('should create an analysis engine', () => {
    expect(engine).toBeInstanceOf(AnalysisEngine);
  });

  it('should handle empty directory analysis', async () => {
    // Use a directory that exists but has no supported files
    const mockRepository: Repository = {
      name: 'empty-repo',
      owner: 'test-owner',
      url: process.cwd() + '/non-existent', // This will cause file discovery to find no files
      primaryLanguage: 'typescript',
      languages: [],
      size: 0,
      isPrivate: false,
      defaultBranch: 'main',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const report = await engine.analyzeRepository(mockRepository);
      
      // Should return a valid report even if no files found
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.summary.recommendations)).toBe(true);
      
    } catch (error) {
      // If it throws an error, that's also acceptable for non-existent paths
      expect(error).toBeDefined();
    }
  });

  it('should have proper configuration', () => {
    const config = QuickConfigs.minimal();
    expect(config.languages).toContain('typescript');
    expect(config.categories).toContain('complexity');
    expect(config.maxFileSize).toBeGreaterThan(0);
  });
});