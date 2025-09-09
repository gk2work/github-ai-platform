import { AnalysisConfig, Language, AnalysisCategory } from '@github-ai/shared';

export interface CoreAnalysisConfig extends AnalysisConfig {
  // Core-specific configuration
  parseComments: boolean;
  parseImports: boolean;
  calculateComplexity: boolean;
  detectPatterns: boolean;
  
  // Performance settings
  maxConcurrentFiles: number;
  analysisTimeoutMs: number;
  
  // Language-specific settings
  languageConfigs: Record<Language, LanguageConfig>;
}

export interface LanguageConfig {
  enabled: boolean;
  maxFileSize: number;
  skipPatterns?: string[];
  customRules?: string[];
  parserOptions?: Record<string, any>;
}

export class AnalysisConfigBuilder {
  private config: Partial<CoreAnalysisConfig> = {};

  static create(): AnalysisConfigBuilder {
    return new AnalysisConfigBuilder();
  }

  languages(languages: Language[]): this {
    this.config.languages = languages;
    return this;
  }

  categories(categories: AnalysisCategory[]): this {
    this.config.categories = categories;
    return this;
  }

  excludePatterns(patterns: string[]): this {
    this.config.excludePatterns = patterns;
    return this;
  }

  includePatterns(patterns: string[]): this {
    this.config.includePatterns = patterns;
    return this;
  }

  maxFileSize(bytes: number): this {
    this.config.maxFileSize = bytes;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  enableAI(enabled: boolean = true): this {
    this.config.enableAI = enabled;
    return this;
  }

  maxConcurrentFiles(count: number): this {
    this.config.maxConcurrentFiles = count;
    return this;
  }

  languageConfig(language: Language, config: LanguageConfig): this {
    if (!this.config.languageConfigs) {
      this.config.languageConfigs = {} as Record<Language, LanguageConfig>;
    }
    this.config.languageConfigs[language] = config;
    return this;
  }

  build(): CoreAnalysisConfig {
    // Set defaults
    const defaultConfig: CoreAnalysisConfig = {
      languages: ['typescript', 'javascript', 'python'],
      categories: ['complexity', 'security', 'performance'],
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.git/**',
        '*.min.js',
        '*.map'
      ],
      maxFileSize: 1024 * 1024, // 1MB
      timeout: 30000, // 30 seconds
      enableAI: false, // Default to false for core analysis
      parseComments: true,
      parseImports: true,
      calculateComplexity: true,
      detectPatterns: true,
      maxConcurrentFiles: 10,
      analysisTimeoutMs: 5000, // 5 seconds per file
      languageConfigs: {
        typescript: { enabled: true, maxFileSize: 1024 * 1024 },
        javascript: { enabled: true, maxFileSize: 1024 * 1024 },
        python: { enabled: true, maxFileSize: 1024 * 1024 },
        go: { enabled: true, maxFileSize: 1024 * 1024 },
        java: { enabled: true, maxFileSize: 2 * 1024 * 1024 }, // Java files can be larger
        rust: { enabled: true, maxFileSize: 1024 * 1024 },
        cpp: { enabled: true, maxFileSize: 1024 * 1024 },
        csharp: { enabled: true, maxFileSize: 1024 * 1024 }
      }
    };

    // Merge with provided config
    return { ...defaultConfig, ...this.config };
  }
}

/**
 * Create a quick config for common scenarios
 */
export class QuickConfigs {
  static minimal(): CoreAnalysisConfig {
    return AnalysisConfigBuilder.create()
      .languages(['typescript', 'javascript'])
      .categories(['complexity'])
      .maxFileSize(512 * 1024) // 512KB
      .maxConcurrentFiles(5)
      .build();
  }

  static standard(): CoreAnalysisConfig {
    return AnalysisConfigBuilder.create()
      .languages(['typescript', 'javascript', 'python'])
      .categories(['complexity', 'security', 'performance'])
      .maxFileSize(1024 * 1024) // 1MB
      .maxConcurrentFiles(10)
      .build();
  }

  static comprehensive(): CoreAnalysisConfig {
    return AnalysisConfigBuilder.create()
      .languages(['typescript', 'javascript', 'python', 'go', 'java'])
      .categories(['complexity', 'security', 'performance', 'duplication', 'maintainability'])
      .maxFileSize(2 * 1024 * 1024) // 2MB
      .maxConcurrentFiles(20)
      .enableAI(true)
      .build();
  }
}
