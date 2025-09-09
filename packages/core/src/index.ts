// Export main analysis engine
export { AnalysisEngine } from './engine';

// Export configuration builders
export { 
  AnalysisConfigBuilder, 
  QuickConfigs,
  type CoreAnalysisConfig,
  type LanguageConfig
} from './models/analysis';

// Export file discovery utilities
export { 
  FileDiscovery,
  createDefaultFileDiscoveryOptions,
  type FileDiscoveryOptions,
  type FileStats
} from './utils/file-utils';

// Export language detection
export { 
  LanguageDetector,
  type LanguageDetectionResult
} from './utils/language-detection';

// Export enhanced file models
export {
  FileProcessor,
  type EnhancedFileInfo,
  type ImportInfo,
  type ExportInfo,
  type FunctionInfo,
  type ClassInfo,
  type FileIssue
} from './models/file';

// Export analyzers (placeholders for now)
export * from './analyzers';
export * from './parsers';
export * from './utils';
