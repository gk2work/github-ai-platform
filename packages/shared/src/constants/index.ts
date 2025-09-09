export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript', 
  'python',
  'go',
  'java',
  'rust',
  'cpp',
  'csharp'
] as const;

export const FILE_EXTENSIONS = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs'],
  python: ['.py', '.pyx', '.pyi'],
  go: ['.go'],
  java: ['.java'],
  rust: ['.rs'],
  cpp: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h'],
  csharp: ['.cs']
} as const;

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.git/**',
  '*.min.js',
  '*.map',
  'vendor/**',
  '__pycache__/**',
  '*.pyc'
];

export const ANALYSIS_THRESHOLDS = {
  complexity: {
    low: 10,
    medium: 20,
    high: 50
  },
  fileSize: {
    warning: 1000, // lines
    critical: 2000
  },
  duplication: {
    warning: 5, // percentage
    critical: 15
  }
} as const;
