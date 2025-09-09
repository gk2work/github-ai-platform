import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { Language, FileInfo, getLanguageFromFile } from '@github-ai/shared';

export interface FileDiscoveryOptions {
  includePatterns?: string[];
  excludePatterns: string[];
  maxFileSize: number; // in bytes
  supportedLanguages: Language[];
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  languageDistribution: Record<Language, number>;
  skippedFiles: string[];
  errors: Array<{ file: string; error: string }>;
}

export class FileDiscovery {
  constructor(private options: FileDiscoveryOptions) {}

  /**
   * Discover all relevant files in a directory
   */
  async discoverFiles(rootPath: string): Promise<{
    files: FileInfo[];
    stats: FileStats;
  }> {
    const startTime = Date.now();
    const files: FileInfo[] = [];
    const stats: FileStats = {
      totalFiles: 0,
      totalSize: 0,
      languageDistribution: {} as Record<Language, number>,
      skippedFiles: [],
      errors: []
    };

    try {
      // Build glob patterns
      const includePatterns = this.options.includePatterns || ['**/*'];
      const allFiles: string[] = [];

      // Get all files matching include patterns
      for (const pattern of includePatterns) {
        const matchedFiles = await glob(pattern, {
          cwd: rootPath,
          ignore: this.options.excludePatterns,
          nodir: true,
          absolute: false
        });
        allFiles.push(...matchedFiles);
      }

      // Remove duplicates
      const uniqueFiles = [...new Set(allFiles)];

      console.log(`��� Discovered ${uniqueFiles.length} potential files`);

      // Process each file
      for (const relativePath of uniqueFiles) {
        try {
          const filePath = path.join(rootPath, relativePath);
          const fileInfo = await this.processFile(filePath, relativePath);
          
          if (fileInfo) {
            files.push(fileInfo);
            stats.totalFiles++;
            stats.totalSize += fileInfo.size;
            
            // Update language distribution
            const lang = fileInfo.language;
            stats.languageDistribution[lang] = (stats.languageDistribution[lang] || 0) + 1;
          } else {
            stats.skippedFiles.push(relativePath);
          }
        } catch (error) {
          stats.errors.push({
            file: relativePath,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ File discovery completed in ${duration}ms`);
      console.log(`��� Processed: ${stats.totalFiles} files`);
      console.log(`⚠️ Skipped: ${stats.skippedFiles.length} files`);
      console.log(`❌ Errors: ${stats.errors.length} files`);

      return { files, stats };

    } catch (error) {
      throw new Error(`File discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a single file and extract metadata
   */
  private async processFile(filePath: string, relativePath: string): Promise<FileInfo | null> {
    try {
      // Get file stats
      const fileStats = await fs.stat(filePath);
      
      // Skip directories
      if (fileStats.isDirectory()) {
        return null;
      }

      // Check file size limit
      if (fileStats.size > this.options.maxFileSize) {
        console.log(`⚠️ Skipping large file: ${relativePath} (${fileStats.size} bytes)`);
        return null;
      }

      // Detect language
      const language = getLanguageFromFile(relativePath);
      if (!language || !this.options.supportedLanguages.includes(language)) {
        return null;
      }

      // Count lines
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;

      const fileInfo: FileInfo = {
        path: relativePath,
        language,
        size: fileStats.size,
        lines,
        complexity: 0, // Will be calculated later
        lastModified: fileStats.mtime
      };

      return fileInfo;

    } catch (error) {
      // If we can't read as UTF-8, it might be binary
      if (error instanceof Error && error.message.includes('invalid')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get content of a specific file with validation
   */
async getFileContent(filePath: string): Promise<string> {
  try {
    // filePath is already relative to the root, so we need to resolve it properly
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
  /**
   * Validate that a path exists and is accessible
   */
  async validatePath(targetPath: string): Promise<{
    exists: boolean;
    isDirectory: boolean;
    isFile: boolean;
    accessible: boolean;
  }> {
    try {
      const stats = await fs.stat(targetPath);
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        accessible: true
      };
    } catch (error) {
      return {
        exists: false,
        isDirectory: false,
        isFile: false,
        accessible: false
      };
    }
  }
}

/**
 * Utility function to create default file discovery options
 */
export function createDefaultFileDiscoveryOptions(): FileDiscoveryOptions {
  return {
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '*.min.js',
      '*.map',
      'vendor/**',
      '__pycache__/**',
      '*.pyc',
      '.env',
      '.env.*',
      '*.log',
      'tmp/**',
      'temp/**'
    ],
    maxFileSize: 1024 * 1024, // 1MB
    supportedLanguages: ['typescript', 'javascript', 'python', 'go', 'java']
  };
}
