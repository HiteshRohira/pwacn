import { gestures } from '@pwacn/core';
import {
  BottomSheet,
  Pressable,
  SheetClose,
  SheetScrollArea,
  useFeelTelemetry,
} from '@pwacn/react';
import { useMemo, useState } from 'react';
import scenarioManifest from '../../../ux-research/scenarios/bottom-sheet.json';
import { FeelInspector } from './FeelInspector';
import { replayPointerTraces, wait } from './gesture-replay';

type Scenario = (typeof scenarioManifest.scenarios)[number];

async function replayScenario(scenario: Scenario) {
  const selector =
    scenario.target === 'scroll-area' ? '.feel-sheet-scroll' : '.pwacn-sheet-handle-zone';
  const target = () => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element && scenario.prepareScrollTop) {
      element.scrollTop = scenario.prepareScrollTop;
      element.scrollTop = 0;
    }
    return element;
  };
  await replayPointerTraces({
    target,
    traces: scenario.traces,
    pauseBetweenTracesMs: scenario.pauseBetweenTracesMs,
  });
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
          <FeelInspector
            telemetry={telemetry}
            primitive={scenarioManifest.primitive}
            scenario={scenario.id}
          />
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
