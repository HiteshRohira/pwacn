import { gestures } from '@pwacn/core';
import {
  BottomSheet,
  Pressable,
  SheetClose,
  SheetScrollArea,
  useFeelTelemetry,
} from '@pwacn/react';
import { useEffect, useMemo, useState } from 'react';
import scenarioManifest from '../../../ux-research/scenarios/bottom-sheet.json';

type Scenario = (typeof scenarioManifest.scenarios)[number];

const format = (value: number | null, suffix = '') =>
  value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}${suffix}`;

const wait = (duration: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, duration));

async function replayScenario(scenario: Scenario) {
  const selector =
    scenario.target === 'scroll-area' ? '.feel-sheet-scroll' : '.pwacn-sheet-handle-zone';
  for (const [traceIndex, trace] of scenario.traces.entries()) {
    if (traceIndex > 0) await wait(scenario.pauseBetweenTracesMs ?? 50);
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) throw new Error(`Missing gesture target: ${selector}`);
    if (scenario.prepareScrollTop) {
      target.scrollTop = scenario.prepareScrollTop;
      target.scrollTop = 0;
    }
    const box = target.getBoundingClientRect();
    const origin = {
      x: box.left + box.width / 2,
      y: box.top + Math.min(24, box.height / 2),
    };
    const pointerId = 700 + traceIndex;
    const dispatch = (type: string, point: (typeof trace)[number], buttons: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId,
          pointerType: 'touch',
          isPrimary: true,
          button: 0,
          buttons,
          clientX: origin.x + point.dx,
          clientY: origin.y + point.dy,
        }),
      );
    dispatch('pointerdown', trace[0]!, 1);
    let previousTime = 0;
    for (const point of trace.slice(1)) {
      await wait(Math.max(0, point.t - previousTime));
      dispatch('pointermove', point, 1);
      previousTime = point.t;
    }
    dispatch('pointerup', trace.at(-1)!, 0);
  }
}

function MotionTrace({
  samples,
}: {
  samples: ReturnType<typeof useFeelTelemetry>['samples'];
}) {
  const points = samples.slice(-120);
  const surface = points.map((sample, index) => {
    const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 300;
    const y = Math.min(92, Math.max(8, 8 + sample.surfaceY * 0.16));
    return `${x},${y}`;
  });
  const pointer = points
    .map((sample, index) => {
      if (sample.pointerY == null) return null;
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 300;
      const firstPointer = points.find((item) => item.pointerY != null)?.pointerY ?? 0;
      return `${x},${Math.min(92, Math.max(8, 48 + (sample.pointerY - firstPointer) * 0.16))}`;
    })
    .filter(Boolean);
  return (
    <svg className="feel-trace" viewBox="0 0 300 100" aria-label="Motion trace">
      <path d="M0 50H300" className="trace-grid" />
      {pointer.length > 1 ? (
        <polyline points={pointer.join(' ')} className="trace-pointer" />
      ) : null}
      {surface.length > 1 ? (
        <polyline points={surface.join(' ')} className="trace-surface" />
      ) : null}
    </svg>
  );
}

export function SheetFeelLab() {
  const initialId = new URLSearchParams(window.location.search).get('scenario');
  const [scenarioId, setScenarioId] = useState(
    scenarioManifest.scenarios.some((scenario) => scenario.id === initialId)
      ? (initialId as string)
      : scenarioManifest.scenarios[0]!.id,
  );
  const [open, setOpen] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const telemetry = useFeelTelemetry('BottomSheet');
  const scenario = useMemo(
    () =>
      scenarioManifest.scenarios.find((candidate) => candidate.id === scenarioId) ??
      scenarioManifest.scenarios[0]!,
    [scenarioId],
  );

  useEffect(() => {
    const snapshot = {
      primitive: scenarioManifest.primitive,
      scenario: scenario.id,
      samples: telemetry.samples,
      summary: telemetry.summary,
    };
    (window as Window & { __PWACN_FEEL__?: typeof snapshot }).__PWACN_FEEL__ = snapshot;
  }, [scenario.id, telemetry.samples, telemetry.summary]);

  const selectScenario = (next: Scenario) => {
    setScenarioId(next.id);
    telemetry.clear();
    window.history.replaceState({}, '', `/feel/sheet?scenario=${next.id}`);
  };

  const replay = async () => {
    telemetry.clear();
    setReplaying(true);
    if (!open) {
      setOpen(true);
      await wait(500);
    }
    try {
      await replayScenario(scenario);
      await wait(700);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <main className="feel-shell">
      <header className="feel-header">
        <a href="/" className="feel-back">
          ← Interaction lab
        </a>
        <div>
          <span className="lab-kicker">PWACN / FEEL FIXTURE 01</span>
          <h1>
            Bottom sheet
            <br />
            under glass.
          </h1>
        </div>
        <p>
          One surface, five repeatable gestures. The trace records model motion—not
          physical display latency.
        </p>
      </header>

      <section className="feel-workbench">
        <nav className="scenario-list" aria-label="Bottom sheet scenarios">
          {scenarioManifest.scenarios.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={item.id === scenario.id ? 'active' : ''}
              aria-pressed={item.id === scenario.id}
              onClick={() => selectScenario(item)}
            >
              <span>0{index + 1}</span>
              <strong>{item.label}</strong>
              <small>{item.intent}</small>
            </button>
          ))}
        </nav>

        <article className="scenario-stage">
          <div className="stage-ruler" aria-hidden="true">
            <span>0</span>
            <span>400</span>
            <span>800 px</span>
          </div>
          <div className="stage-card">
            <span className="lab-kicker">ACTIVE SCENARIO</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
            <ul>
              {scenario.invariants.map((invariant) => (
                <li key={invariant}>{invariant}</li>
              ))}
            </ul>
            <Pressable
              className="run-sheet"
              onPress={() => {
                telemetry.clear();
                setOpen(true);
              }}
            >
              Open test surface <b>↑</b>
            </Pressable>
            <button
              type="button"
              className="replay-trace"
              disabled={replaying}
              onClick={() => void replay()}
            >
              {replaying ? 'Replaying trace…' : 'Replay exact trace'} <span>▶</span>
            </button>
          </div>
        </article>
      </section>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={`Bottom sheet feel test: ${scenario.label}`}
        snapPoints={[0.35, 0.62, 0.92]}
        initialSnap={0.62}
        className="feel-sheet"
      >
        <SheetScrollArea className="feel-sheet-scroll">
          <div className="feel-inspector" aria-live="polite">
            <div className="inspector-title">
              <span>LIVE MOTION TRACE</span>
              <b data-feel-state="">{telemetry.current?.state ?? 'ready'}</b>
            </div>
            <MotionTrace samples={telemetry.samples} />
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
                <dt>Surface velocity</dt>
                <dd>{format(telemetry.current?.surfaceVelocityY ?? null, ' px/s')}</dd>
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
            </dl>
          </div>
          <div className="fixture-content">
            <span className="lab-kicker">SCENARIO / {scenario.id.toUpperCase()}</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
            {Array.from({ length: 8 }, (_, index) => (
              <div className="fixture-row" key={index}>
                <span>Content sample {index + 1}</span>
                <small>{index % 2 ? 'gesture boundary' : 'native scroll'}</small>
              </div>
            ))}
            <SheetClose className="sheet-done">Close fixture</SheetClose>
          </div>
        </SheetScrollArea>
      </BottomSheet>
      <footer className="feel-footer">
        Dismiss threshold {gestures.sheet.dismissVelocity} px/s · viewport{' '}
        {scenarioManifest.viewport.width} × {scenarioManifest.viewport.height}
      </footer>
    </main>
  );
}
