import { FileDiscovery, createDefaultFileDiscoveryOptions } from '../src/utils/file-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('FileDiscovery', () => {
  let tempDir: string;
  let discovery: FileDiscovery;

  beforeAll(async () => {
    // Create temporary test directory
    tempDir = path.join(tmpdir(), 'github-ai-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });

    // Create test files
    await fs.writeFile(path.join(tempDir, 'test.ts'), 'console.log("test");');
    await fs.writeFile(path.join(tempDir, 'test.js'), 'console.log("test");');
    await fs.writeFile(path.join(tempDir, 'test.py'), 'print("test")');
    await fs.writeFile(path.join(tempDir, 'readme.txt'), 'This is a readme');
    
    // Create node_modules to test exclusion
    await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'node_modules', 'package.js'), 'module.exports = {};');

    discovery = new FileDiscovery(createDefaultFileDiscoveryOptions());
  });

  afterAll(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should discover supported files', async () => {
    const result = await discovery.discoverFiles(tempDir);
    
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.stats.totalFiles).toBeGreaterThan(0);
    
    // Should find .ts, .js, .py files
    const extensions = result.files.map(f => path.extname(f.path));
    expect(extensions).toContain('.ts');
    expect(extensions).toContain('.js');
    expect(extensions).toContain('.py');
    
    // Should not find .txt files
    expect(extensions).not.toContain('.txt');
  });

  it('should exclude node_modules', async () => {
    const result = await discovery.discoverFiles(tempDir);
    
    // Should not include files from node_modules
    const nodeModuleFiles = result.files.filter(f => f.path.includes('node_modules'));
    expect(nodeModuleFiles.length).toBe(0);
  });

  it('should calculate language distribution', async () => {
    const result = await discovery.discoverFiles(tempDir);
    
    expect(result.stats.languageDistribution).toBeDefined();
    expect(result.stats.languageDistribution.typescript).toBeGreaterThan(0);
    expect(result.stats.languageDistribution.javascript).toBeGreaterThan(0);
    expect(result.stats.languageDistribution.python).toBeGreaterThan(0);
  });

  it('should validate paths correctly', async () => {
    const validResult = await discovery.validatePath(tempDir);
    expect(validResult.exists).toBe(true);
    expect(validResult.isDirectory).toBe(true);
    expect(validResult.accessible).toBe(true);

    const invalidResult = await discovery.validatePath('/nonexistent/path');
    expect(invalidResult.exists).toBe(false);
  });
});
