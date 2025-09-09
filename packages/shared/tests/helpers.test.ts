import { getLanguageFromFile, calculateOverallScore, formatBytes } from '../src/utils/helpers';

describe('Helper Functions', () => {
  describe('getLanguageFromFile', () => {
    it('should detect TypeScript files', () => {
      expect(getLanguageFromFile('app.ts')).toBe('typescript');
      expect(getLanguageFromFile('component.tsx')).toBe('typescript');
    });

    it('should detect JavaScript files', () => {
      expect(getLanguageFromFile('app.js')).toBe('javascript');
      expect(getLanguageFromFile('component.jsx')).toBe('javascript');
    });

    it('should detect Python files', () => {
      expect(getLanguageFromFile('main.py')).toBe('python');
    });

    it('should return null for unknown extensions', () => {
      expect(getLanguageFromFile('readme.txt')).toBeNull();
    });
  });

  describe('calculateOverallScore', () => {
    it('should return 100 for no issues', () => {
      const score = calculateOverallScore({
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      });
      expect(score).toBe(100);
    });

    it('should decrease score based on severity', () => {
      const score = calculateOverallScore({
        low: 1,
        medium: 1,
        high: 1,
        critical: 1
      });
      expect(score).toBe(74); // 100 - (1+3+7+15)
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });
});
