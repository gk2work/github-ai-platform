export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type AnalysisCategory = 
  | 'security' 
  | 'performance' 
  | 'complexity' 
  | 'duplication' 
  | 'testing' 
  | 'documentation'
  | 'maintainability';

export type Language = 
  | 'typescript' 
  | 'javascript' 
  | 'python' 
  | 'go' 
  | 'java' 
  | 'rust'
  | 'cpp'
  | 'csharp';

export interface FileLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface BaseEntity {
  _id?: string; // MongoDB ObjectId
  createdAt: Date;
  updatedAt: Date;
}
