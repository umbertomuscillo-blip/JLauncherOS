import { describe, expect, it } from 'vitest';
import { formatBytes } from './CleanUninstallModal';

describe('formatBytes', () => {
  it('formats zero and negative bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-100)).toBe('0 B');
  });

  it('formats bytes, kilobytes, megabytes, and gigabytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(26214400)).toBe('25 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(2684354560)).toBe('2.5 GB');
  });
});
