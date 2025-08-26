/**
 * Tests pour les utilitaires de formatage
 */

import {
  formatFileSize,
  formatDate,
  formatNumber,
  truncateText,
  capitalize,
  formatFileName,
  formatFilePath,
  formatDuration,
  formatUsername,
  formatRepoName,
} from '../formatting';

describe('formatting utils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-26');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/26/); // Vérifie que le jour est présent
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with separators', () => {
      expect(formatNumber(1000)).toBe('1 000');
      expect(formatNumber(1000000)).toBe('1 000 000');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('Hello World', 5)).toBe('He...');
      expect(truncateText('Short', 10)).toBe('Short');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
    });
  });

  describe('formatFileName', () => {
    it('should format file names correctly', () => {
      expect(formatFileName('very-long-file-name.txt', 20)).toBe('very-long-file...txt');
      expect(formatFileName('short.txt', 20)).toBe('short.txt');
    });
  });

  describe('formatFilePath', () => {
    it('should format file paths correctly', () => {
      expect(formatFilePath('src/components/very/deep/path/file.ts')).toBe('src/.../deep/path/file.ts');
      expect(formatFilePath('src/file.ts')).toBe('src/file.ts');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(65000)).toBe('1m 5s');
    });
  });

  describe('formatUsername', () => {
    it('should format usernames correctly', () => {
      expect(formatUsername('john')).toBe('@john');
      expect(formatUsername('@jane')).toBe('@jane');
    });
  });

  describe('formatRepoName', () => {
    it('should format repository names correctly', () => {
      expect(formatRepoName('owner/repo')).toBe('owner / repo');
    });
  });
});
