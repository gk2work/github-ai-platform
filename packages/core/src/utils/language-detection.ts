// packages/core/src/utils/language-detection.ts - FIXED VERSION

import * as fs from 'fs/promises';
import { Language, getLanguageFromFile } from '@github-ai/shared';

export interface LanguageDetectionResult {
  language: Language | null;
  confidence: number; // 0-1
  reasons: string[];
}

export class LanguageDetector {
  /**
   * Enhanced language detection that looks at both extension and content
   */
  async detectLanguage(filePath: string): Promise<LanguageDetectionResult> {
    const reasons: string[] = [];
    let language: Language | null = null;
    let confidence = 0;

    // First, try extension-based detection
    const extensionLanguage = getLanguageFromFile(filePath);
    if (extensionLanguage) {
      language = extensionLanguage;
      confidence = 0.8;
      reasons.push(`Extension-based detection: ${extensionLanguage}`);
    }

    try {
      // Read first few lines for content-based detection
      const content = await fs.readFile(filePath, 'utf-8');
      const firstLines = content.split('\n').slice(0, 10).join('\n');

      // Content-based detection patterns
      const contentPatterns = this.getContentPatterns();
      
      for (const [lang, patterns] of Object.entries(contentPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(firstLines)) {
            if (language === lang) {
              // Confirms extension-based detection
              confidence = Math.min(1.0, confidence + 0.2);
              reasons.push(`Content confirms ${lang}: ${pattern.source}`);
            } else if (!language) {
              // Content-only detection
              language = lang as Language;
              confidence = 0.6;
              reasons.push(`Content-based detection: ${lang} (${pattern.source})`);
            }
            break;
          }
        }
      }

      // Special cases for ambiguous files
      if (language === 'javascript') {
        // Check if it's actually TypeScript
        if (this.hasTypeScriptFeatures(content)) {
          language = 'typescript';
          confidence = 0.9;
          reasons.push('TypeScript features detected in JS file');
        }
      }

    } catch (error) {
      // File reading failed, stick with extension-based detection
      reasons.push(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      language,
      confidence,
      reasons
    };
  }

  /**
   * Get regex patterns for content-based language detection
   */
  private getContentPatterns(): Record<string, RegExp[]> {
    return {
      typescript: [
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /import.*from\s+['"][^'"]+['"];?$/m,
        /export\s+(interface|type|enum)/,
        /:\s*(string|number|boolean|object)/
      ],
      javascript: [
        /require\s*\(['"][^'"]+['"]\)/,
        /module\.exports\s*=/,
        /export\s+(default|const|let|var|function)/,
        /import.*from\s+['"][^'"]+['"];?$/m
      ],
      python: [
        /^#!.*python/m,
        /^#.*coding[:=]\s*(utf-8|latin-1)/m,
        /^import\s+\w+/m,
        /^from\s+\w+\s+import/m,
        /def\s+\w+\s*\(/m,
        /class\s+\w+\s*[\(:]?/m
      ],
      go: [
        /^package\s+\w+/m,
        /^import\s*\(/m,
        /func\s+\w+\s*\(/m,
        /type\s+\w+\s+struct/m,
        /var\s+\w+\s+\w+/m
      ],
      java: [
        /^package\s+[\w\.]+;/m,
        /^import\s+[\w\.]+;/m,
        /public\s+class\s+\w+/m,
        /public\s+static\s+void\s+main/m,
        /@\w+/m // Annotations
      ],
      rust: [
        /^use\s+\w+/m,
        /fn\s+\w+\s*\(/m,
        /struct\s+\w+/m,
        /impl\s+\w+/m,
        /let\s+mut\s+\w+/m
      ],
      cpp: [
        /^#include\s*[<"]/m,
        /using\s+namespace\s+std;/m,
        /std::/,
        /int\s+main\s*\(/m,
        /class\s+\w+/m
      ],
      csharp: [
        /^using\s+System/m,
        /namespace\s+\w+/m,
        /public\s+class\s+\w+/m,
        /static\s+void\s+Main/m,
        /\[.*\]/ // Attributes
      ]
    };
  }

  /**
   * Check if a JavaScript file has TypeScript features
   */
  private hasTypeScriptFeatures(content: string): boolean {
    const tsFeatures = [
      /:\s*(string|number|boolean|object|any|void)/,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /public\s+\w+/,
      /private\s+\w+/,
      /protected\s+\w+/,
      /<\w+>/,
      /as\s+\w+/
    ];

    return tsFeatures.some(pattern => pattern.test(content));
  }
}