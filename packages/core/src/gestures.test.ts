import { describe, expect, it } from 'vitest';
import {
  applyElasticBoundary,
  directionLock,
  GestureCoordinator,
  movementDistance,
  shouldCommitGesture,
  shouldSheetCaptureScroll,
} from './gestures';

describe('gesture helpers', () => {
  it('measures pointer travel', () => {
    expect(movementDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('waits for intent before locking direction', () => {
    expect(directionLock(3, 2)).toBeNull();
    expect(directionLock(10, 2)).toBe('x');
    expect(directionLock(2, 10)).toBe('y');
  });

  it('commits by either distance or velocity', () => {
    expect(
      shouldCommitGesture({
        progress: 0.5,
        velocity: 0,
        progressThreshold: 0.4,
        velocityThreshold: 600,
      }),
    ).toBe(true);
    expect(
      shouldCommitGesture({
        progress: 0.1,
        velocity: 700,
        progressThreshold: 0.4,
        velocityThreshold: 600,
      }),
    ).toBe(true);
  });

  it('applies resistance only beyond boundaries', () => {
    expect(applyElasticBoundary(50, 0, 100, 0.1)).toBe(50);
    expect(applyElasticBoundary(120, 0, 100, 0.1)).toBe(102);
    expect(applyElasticBoundary(-20, 0, 100, 0.1)).toBe(-2);
  });
});

describe('GestureCoordinator', () => {
  it('allows higher-priority edge gestures to take ownership', () => {
    const coordinator = new GestureCoordinator();
    expect(coordinator.claim(1, { owner: 'tabs', axis: 'x', priority: 10 })).toBe(true);
    expect(coordinator.claim(1, { owner: 'edge-back', axis: 'x', priority: 100 })).toBe(
      true,
    );
    expect(coordinator.owns(1, 'edge-back')).toBe(true);
    coordinator.release(1, 'edge-back');
    expect(coordinator.owns(1, 'edge-back')).toBe(false);
  });

  it('hands downward movement to a sheet only at scroll top', () => {
    expect(shouldSheetCaptureScroll({ scrollTop: 0, deltaY: 12 })).toBe(true);
    expect(shouldSheetCaptureScroll({ scrollTop: 20, deltaY: 12 })).toBe(false);
    expect(shouldSheetCaptureScroll({ scrollTop: 0, deltaY: -12 })).toBe(false);
  });
});
