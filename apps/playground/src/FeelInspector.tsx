import { useFeelTelemetry } from '@pwacn/react';
import { useEffect } from 'react';

export type FeelTelemetryController = ReturnType<typeof useFeelTelemetry>;

const format = (value: number | null | undefined, suffix = '') =>
  value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}${suffix}`;

function traceValue(
  sample: FeelTelemetryController['samples'][number],
  kind: 'pointer' | 'surface',
  axis: 'x' | 'y',
) {
  if (kind === 'pointer') return axis === 'x' ? sample.pointerX : sample.pointerY;
  return axis === 'x' ? sample.surfaceX : sample.surfaceY;
}

export function FeelInspector({
  telemetry,
  primitive,
  scenario,
  axis = 'y',
}: {
  telemetry: FeelTelemetryController;
  primitive: string;
  scenario: string;
  axis?: 'x' | 'y';
}) {
  const points = telemetry.samples.slice(-160);
  const firstPointer = points.find(
    (sample) => traceValue(sample, 'pointer', axis) != null,
  );
  const firstSurface = points.find(
    (sample) => traceValue(sample, 'surface', axis) != null,
  );
  const pointerOrigin = firstPointer
    ? (traceValue(firstPointer, 'pointer', axis) ?? 0)
    : 0;
  const surfaceOrigin = firstSurface
    ? (traceValue(firstSurface, 'surface', axis) ?? 0)
    : 0;
  const path = (kind: 'pointer' | 'surface', origin: number) =>
    points
      .map((sample, index) => {
        const value = traceValue(sample, kind, axis);
        if (value == null) return null;
        const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 300;
        const y = Math.min(92, Math.max(8, 50 + (value - origin) * 0.16));
        return `${x},${y}`;
      })
      .filter((point): point is string => point != null);
  const pointer = path('pointer', pointerOrigin);
  const surface = path('surface', surfaceOrigin);

  useEffect(() => {
    const snapshot = {
      primitive,
      scenario,
      samples: telemetry.samples,
      summary: telemetry.summary,
    };
    window.__PWACN_FEEL__ = snapshot;
  }, [primitive, scenario, telemetry.samples, telemetry.summary]);

  return (
    <div className="feel-inspector" aria-live="polite">
      <div className="inspector-title">
        <span>LIVE MOTION TRACE</span>
        <b data-feel-state="">{telemetry.current?.state ?? 'ready'}</b>
      </div>
      <svg className="feel-trace" viewBox="0 0 300 100" aria-label="Motion trace">
        <path d="M0 50H300" className="trace-grid" />
        {pointer.length > 1 ? (
          <polyline points={pointer.join(' ')} className="trace-pointer" />
        ) : null}
        {surface.length > 1 ? (
          <polyline points={surface.join(' ')} className="trace-surface" />
        ) : null}
      </svg>
      <div className="trace-key">
        <span>finger</span>
        <span>surface</span>
      </div>
      <dl>
        <div>
          <dt>Owner</dt>
          <dd>{telemetry.current?.gestureOwner ?? '—'}</dd>
        </div>
        <div>
          <dt>Event → commit</dt>
          <dd>{format(telemetry.summary.eventToCommitMs, ' ms')}</dd>
        </div>
        <div>
          <dt>Mean tracking error</dt>
          <dd>{format(telemetry.summary.meanTrackingErrorPx, ' px')}</dd>
        </div>
        <div>
          <dt>Velocity continuity</dt>
          <dd>{format(telemetry.summary.velocityContinuity)}</dd>
        </div>
        <div>
          <dt>Settle time</dt>
          <dd>{format(telemetry.summary.settleTimeMs, ' ms')}</dd>
        </div>
        <div>
          <dt>Intervals over 20 ms</dt>
          <dd>{telemetry.summary.longFrames}</dd>
        </div>
        <div>
          <dt>Interruptions</dt>
          <dd>{telemetry.summary.interruptions}</dd>
        </div>
        <div>
          <dt>Samples</dt>
          <dd>{telemetry.summary.sampleCount}</dd>
        </div>
      </dl>
    </div>
  );
}
