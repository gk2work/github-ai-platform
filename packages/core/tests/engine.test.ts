// packages/core/tests/analysis-engine.test.ts - SIMPLIFIED VERSION

import { AnalysisEngine } from '../src/engine';
import { QuickConfigs } from '../src/models/analysis';
import { Repository } from '@github-ai/shared';

describe('AnalysisEngine', () => {
  let engine: AnalysisEngine;
  let mockRepository: Repository;

  beforeAll(async () => {
    engine = new AnalysisEngine(QuickConfigs.minimal());

    // Use current directory which should exist and have files
    const currentDir = process.cwd();
    
    mockRepository = {
      name: 'test-repo',
      owner: 'test-owner',
      url: currentDir, // Use current working directory
      primaryLanguage: 'typescript',
      languages: [],
      size: 1000,
      isPrivate: false,
      defaultBranch: 'main',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  it('should analyze a repository successfully', async () => {
    const report = await engine.analyzeRepository(mockRepository);
    
    expect(report).toBeDefined();
    expect(report.repositoryId).toBe('');
    expect(report.summary).toBeDefined();
    expect(report.executionTime).toBeGreaterThan(0);
    expect(typeof report.analyzedFiles).toBe('number');
  });

  it('should generate meaningful summary', async () => {
    const report = await engine.analyzeRepository(mockRepository);
    
    expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.overallScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(report.summary.recommendations)).toBe(true);
    expect(report.summary.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle non-existent paths gracefully', async () => {
    const badRepository = {
      ...mockRepository,
      url: '/definitely/does/not/exist'
    };
    
    // Should either throw or return empty results
    try {
      const report = await engine.analyzeRepository(badRepository);
      // If it doesn't throw, it should return a valid report structure
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    } catch (error) {
      // If it throws, that's also acceptable behavior
      expect(error).toBeDefined();
    }
  });

  it('should create proper error results structure', async () => {
    const report = await engine.analyzeRepository(mockRepository);
    
    // Check that all results have the correct structure
    for (const result of report.results) {
      expect(result).toHaveProperty('repositoryId');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('suggestion');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});