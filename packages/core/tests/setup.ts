// Test setup file
import { jest } from '@jest/globals';

// Mock console.log to reduce noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
