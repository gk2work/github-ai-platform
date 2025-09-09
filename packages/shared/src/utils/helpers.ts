import { Language, Severity } from '../types';
import { FILE_EXTENSIONS } from '../constants';

export function getLanguageFromFile(filename: string): Language | null {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  
  for (const [language, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return language as Language;
    }
  }
  
  return null;
}

export function severityToNumber(severity: Severity): number {
  const map = { low: 1, medium: 2, high: 3, critical: 4 };
  return map[severity];
}

export function numberToSeverity(num: number): Severity {
  if (num <= 1) return 'low';
  if (num <= 2) return 'medium';
  if (num <= 3) return 'high';
  return 'critical';
}

export function calculateOverallScore(
  issuesBySeverity: Record<Severity, number>
): number {
  const weights = { low: 1, medium: 3, high: 7, critical: 15 };
  const totalPenalty = Object.entries(issuesBySeverity)
    .reduce((sum, [severity, count]) => 
      sum + (weights[severity as Severity] * count), 0);
  
  // Score from 0-100, where 100 is perfect
  return Math.max(0, 100 - totalPenalty);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
