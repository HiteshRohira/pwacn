import { describe, expect, it } from 'vitest';
import { summarizeFeelTelemetry, type FeelTelemetrySample } from './feel-telemetry';

const sample = (overrides: Partial<FeelTelemetrySample>): FeelTelemetrySample => ({
  timestamp: 0,
  primitive: 'BottomSheet',
  gesture: 'drag-y',
  state: 'dragging',
  surfaceY: 0,
  surfaceVelocityY: 0,
  ...overrides,
});

describe('feel telemetry summaries', () => {
  it('describes tracking, velocity handoff, settling, and long intervals', () => {
    const summary = summarizeFeelTelemetry([
      sample({ timestamp: 10, trackingErrorPx: 1 }),
      sample({ timestamp: 20, trackingErrorPx: -3, frameIntervalMs: 22 }),
      sample({
        timestamp: 30,
        state: 'releasing',
        pointerVelocityY: 1000,
        surfaceVelocityY: 980,
      }),
      sample({ timestamp: 40, state: 'settling', surfaceVelocityY: 920 }),
      sample({ timestamp: 280, state: 'complete' }),
    ]);

    expect(summary.meanTrackingErrorPx).toBe(2);
    expect(summary.p95TrackingErrorPx).toBe(3);
    expect(summary.velocityContinuity).toBeCloseTo(0.92);
    expect(summary.settleTimeMs).toBe(250);
    expect(summary.longFrames).toBe(1);
  });

  it('summarizes contact response, interruptions, and gesture ownership', () => {
    const summary = summarizeFeelTelemetry([
      sample({ timestamp: 10, state: 'contact', gestureOwner: 'scroll' }),
      sample({ timestamp: 14.5, state: 'responding', gestureOwner: 'sheet' }),
      sample({ timestamp: 20, state: 'interrupted', gestureOwner: 'sheet' }),
    ]);

    expect(summary.eventToCommitMs).toBe(4.5);
    expect(summary.interruptions).toBe(1);
    expect(summary.gestureTransfers).toEqual(['scroll', 'sheet']);
  });
});
