import { describe, expect, it } from 'vitest';
import { components, hash } from './index';

describe('pwacn registry CLI', () => {
  it('uses deterministic content hashes', () => {
    expect(hash('same')).toBe(hash('same'));
    expect(hash('same')).not.toBe(hash('different'));
  });

  it('declares dependencies for composed components', () => {
    expect(components.sheet?.dependencies).toContain('pressable');
    expect(components['action-sheet']?.dependencies).toContain('sheet');
    expect(components['context-menu']?.dependencies).toContain('action-sheet');
  });

  it('ships the complete v0.1 registry', () => {
    expect(Object.keys(components)).toEqual(
      expect.arrayContaining([
        'pressable',
        'sheet',
        'stack',
        'switch',
        'segmented-control',
        'navigation-bar',
        'context-menu',
        'picker',
        'toast',
        'refresh-control',
        'reorderable-list',
        'carousel',
      ]),
    );
  });
});
