import { LanguageDetector } from '../src/utils/language-detection';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('LanguageDetector', () => {
  let detector: LanguageDetector;
  let tempDir: string;

  beforeAll(async () => {
    detector = new LanguageDetector();
    tempDir = path.join(tmpdir(), 'lang-detect-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should detect TypeScript from content', async () => {
    const tsContent = `
interface User {
  name: string;
  age: number;
}

export const user: User = { name: "test", age: 25 };
    `;
    
    const filePath = path.join(tempDir, 'test.ts');
    await fs.writeFile(filePath, tsContent);
    
    const result = await detector.detectLanguage(filePath);
    expect(result.language).toBe('typescript');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect Python from content', async () => {
    const pyContent = `
def hello_world():
    print("Hello, World!")

class MyClass:
    def __init__(self):
        pass
    `;
    
    const filePath = path.join(tempDir, 'test.py');
    await fs.writeFile(filePath, pyContent);
    
    const result = await detector.detectLanguage(filePath);
    expect(result.language).toBe('python');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('should detect TypeScript features in JS files', async () => {
    const jsWithTsContent = `
const user: User = {
  name: "test",
  age: 25
};

interface Config {
  apiUrl: string;
}
    `;
    
    const filePath = path.join(tempDir, 'test.js');
    await fs.writeFile(filePath, jsWithTsContent);
    
    const result = await detector.detectLanguage(filePath);
    expect(result.language).toBe('typescript');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
