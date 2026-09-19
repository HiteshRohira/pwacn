import { useEffect, useMemo, useRef, useState } from 'react';

export type FeelTelemetryState =
  'dragging' | 'releasing' | 'settling' | 'complete' | 'interrupted';

export type FeelTelemetrySample = Readonly<{
  timestamp: number;
  primitive: string;
  gesture: string;
  state: FeelTelemetryState;
  pointerY?: number;
  surfaceY: number;
  pointerVelocityY?: number;
  surfaceVelocityY: number;
  trackingErrorPx?: number;
  activeSnapPoint?: number;
  targetSnapPoint?: number;
  gestureOwner?: string;
  frameIntervalMs?: number;
}>;

export type FeelTelemetrySummary = Readonly<{
  sampleCount: number;
  meanTrackingErrorPx: number | null;
  p95TrackingErrorPx: number | null;
  releaseVelocityPxPerSec: number | null;
  animationInitialVelocityPxPerSec: number | null;
  velocityContinuity: number | null;
  settleTimeMs: number | null;
  longFrames: number;
}>;

type Subscriber = (sample: FeelTelemetrySample) => void;

const subscribers = new Set<Subscriber>();

export function emitFeelTelemetry(sample: FeelTelemetrySample) {
  subscribers.forEach((subscriber) => subscriber(sample));
}

export function subscribeFeelTelemetry(subscriber: Subscriber) {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function summarizeFeelTelemetry(
  samples: readonly FeelTelemetrySample[],
): FeelTelemetrySummary {
  const tracking = samples
    .filter((sample) => sample.state === 'dragging' && sample.trackingErrorPx != null)
    .map((sample) => Math.abs(sample.trackingErrorPx ?? 0))
    .sort((a, b) => a - b);
  const release = [...samples].reverse().find((sample) => sample.state === 'releasing');
  const initialAnimation = samples.find(
    (sample) =>
      sample.state === 'settling' &&
      release != null &&
      sample.timestamp >= release.timestamp,
  );
  const complete = [...samples].reverse().find((sample) => sample.state === 'complete');
  const releaseVelocity = release?.pointerVelocityY ?? null;
  const initialVelocity = initialAnimation?.surfaceVelocityY ?? null;
  return {
    sampleCount: samples.length,
    meanTrackingErrorPx: tracking.length
      ? tracking.reduce((total, value) => total + value, 0) / tracking.length
      : null,
    p95TrackingErrorPx: tracking.length
      ? (tracking[Math.min(tracking.length - 1, Math.floor(tracking.length * 0.95))] ??
        null)
      : null,
    releaseVelocityPxPerSec: releaseVelocity,
    animationInitialVelocityPxPerSec: initialVelocity,
    velocityContinuity:
      releaseVelocity && initialVelocity != null
        ? Math.abs(initialVelocity / releaseVelocity)
        : null,
    settleTimeMs:
      release && complete ? Math.max(0, complete.timestamp - release.timestamp) : null,
    longFrames: samples.filter((sample) => (sample.frameIntervalMs ?? 0) > 20).length,
  };
}

export function useFeelTelemetry(primitive?: string, limit = 900) {
  const samplesRef = useRef<FeelTelemetrySample[]>([]);
  const [samples, setSamples] = useState<FeelTelemetrySample[]>([]);
  const [current, setCurrent] = useState<FeelTelemetrySample | null>(null);

  useEffect(
    () =>
      subscribeFeelTelemetry((sample) => {
        if (primitive && sample.primitive !== primitive) return;
        const next = [...samplesRef.current, sample].slice(-limit);
        samplesRef.current = next;
        setSamples(next);
        setCurrent(sample);
      }),
    [limit, primitive],
  );

  return {
    current,
    samples,
    summary: useMemo(() => summarizeFeelTelemetry(samples), [samples]),
    clear: () => {
      samplesRef.current = [];
      setSamples([]);
      setCurrent(null);
    },
  };
}
