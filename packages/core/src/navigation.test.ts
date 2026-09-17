import { describe, expect, it } from 'vitest';
import { stackReducer, type StackState } from './navigation';

const home = { key: 'home', pathname: '/', presentation: 'push' as const };

describe('stackReducer', () => {
  it('pushes, pops, and replaces with explicit direction', () => {
    const initial: StackState = { entries: [home], direction: 'replace' };
    const pushed = stackReducer(initial, {
      type: 'push',
      entry: { key: 'post', pathname: '/post/1', presentation: 'push' },
    });
    expect(pushed.direction).toBe('push');
    expect(pushed.entries).toHaveLength(2);
    expect(stackReducer(pushed, { type: 'pop' }).entries).toEqual([home]);
  });

  it('keeps the root screen mounted', () => {
    const initial: StackState = { entries: [home], direction: 'replace' };
    expect(stackReducer(initial, { type: 'pop' })).toBe(initial);
  });

  it('records scroll position without changing direction', () => {
    const initial: StackState = { entries: [home], direction: 'replace' };
    expect(
      stackReducer(initial, { type: 'set-scroll', key: 'home', scrollPosition: 240 })
        .entries[0]?.scrollPosition,
    ).toBe(240);
  });
});
