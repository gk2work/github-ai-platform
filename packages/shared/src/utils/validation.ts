import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../constants';

export const RepositorySchema = z.object({
  name: z.string().min(1),
  owner: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  primaryLanguage: z.enum(SUPPORTED_LANGUAGES),
  isPrivate: z.boolean().default(false),
  defaultBranch: z.string().default('main')
});

export const AnalysisConfigSchema = z.object({
  languages: z.array(z.enum(SUPPORTED_LANGUAGES)),
  categories: z.array(z.string()),
  excludePatterns: z.array(z.string()),
  includePatterns: z.array(z.string()).optional(),
  maxFileSize: z.number().positive().default(1024 * 1024), // 1MB
  timeout: z.number().positive().default(30000), // 30 seconds
  enableAI: z.boolean().default(true)
});

export const AIAnalysisRequestSchema = z.object({
  repositoryId: z.string().min(1),
  codeSnippet: z.string().min(1),
  context: z.object({
    file: z.string(),
    language: z.enum(SUPPORTED_LANGUAGES),
    surroundingCode: z.string().optional(),
    relatedFiles: z.array(z.string()).optional()
  }),
  analysisType: z.enum([
    'explain_code',
    'suggest_improvement', 
    'security_review',
    'performance_optimization',
    'refactoring_suggestion',
    'documentation_generation',
    'test_generation'
  ]),
  userQuery: z.string().optional()
});
