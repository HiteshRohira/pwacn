import { MobileStack, Pressable, useFeelTelemetry, useMobileStack } from '@pwacn/react';
import { useMemo, useState } from 'react';
import scenarioManifest from '../../../ux-research/scenarios/interactive-back.json';
import { FeelInspector } from './FeelInspector';
import { replayPointerTraces, wait } from './gesture-replay';

type Scenario = (typeof scenarioManifest.scenarios)[number];

function BackDetail() {
  const nav = useMobileStack();
  return (
    <section className="back-demo-screen detail" data-back-detail="">
      <header>
        <Pressable feedback="opacity" onPress={nav.pop}>
          ‹ Index
        </Pressable>
        <strong>Continuity</strong>
        <span />
      </header>
      <div className="back-demo-scroll" data-pwacn-scroll="">
        <span className="lab-kicker">SCREEN / 02</span>
        <h2>A preserved place.</h2>
        <p>Drag from the leading edge. The index remains mounted behind this surface.</p>
        {Array.from({ length: 8 }, (_, index) => (
          <article key={index}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <span>Navigation state {index + 1}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function BackIndex() {
  const nav = useMobileStack();
  return (
    <section className="back-demo-screen index">
      <span className="lab-kicker">SCREEN / 01</span>
      <h2>
        Spatial
        <br />
        index
      </h2>
      <p>This screen stays alive so interactive back can reveal it continuously.</p>
      <Pressable
        data-open-back-detail=""
        className="open-back-detail"
        onPress={() =>
          nav.push(<BackDetail />, {
            key: 'continuity',
            pathname: '/feel/interactive-back/detail',
          })
        }
      >
        Open detail <span>→</span>
      </Pressable>
    </section>
  );
}

export function InteractiveBackFeelLab() {
  const initialId = new URLSearchParams(window.location.search).get('scenario');
  const [scenarioId, setScenarioId] = useState(
    scenarioManifest.scenarios.some((scenario) => scenario.id === initialId)
      ? (initialId as string)
      : scenarioManifest.scenarios[0]!.id,
  );
  const [replaying, setReplaying] = useState(false);
  const telemetry = useFeelTelemetry('InteractiveBack');
  const scenario = useMemo(
    () =>
      scenarioManifest.scenarios.find((candidate) => candidate.id === scenarioId) ??
      scenarioManifest.scenarios[0]!,
    [scenarioId],
  );

  const selectScenario = (next: Scenario) => {
    setScenarioId(next.id);
    telemetry.clear();
    window.history.replaceState({}, '', `/feel/interactive-back?scenario=${next.id}`);
  };

  const ensureDetail = async () => {
    if (document.querySelector('[data-pwacn-edge-back]')) return;
    document.querySelector<HTMLElement>('[data-open-back-detail]')?.click();
    await wait(600);
  };

  const replay = async () => {
    telemetry.clear();
    setReplaying(true);
    try {
      await ensureDetail();
      await replayPointerTraces({
        target: () => document.querySelector<HTMLElement>('[data-pwacn-edge-back]'),
        traces: scenario.traces,
        pauseBetweenTracesMs: scenario.pauseBetweenTracesMs,
      });
      await wait(750);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <main className="feel-shell back-feel-shell">
      <header className="feel-header compact">
        <a href="/" className="feel-back">
          ← Interaction lab
        </a>
        <div>
          <span className="lab-kicker">PWACN / FEEL FIXTURE 03</span>
          <h1>
            Back is
            <br />a direction.
          </h1>
        </div>
        <p>
          Navigation responds before release, preserves the previous screen, and commits
          by distance or velocity.
        </p>
      </header>

      <section className="feel-workbench back-workbench">
        <nav className="scenario-list" aria-label="Interactive back scenarios">
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

        <article className="back-stage">
          <div className="back-device">
            <MobileStack initialScreen={<BackIndex />} history="memory" />
          </div>
          <div className="back-controls">
            <span className="lab-kicker">ACTIVE / {scenario.id}</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
            <ul>
              {scenario.invariants.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              className="replay-trace light"
              disabled={replaying}
              onClick={() => void replay()}
            >
              {replaying ? 'Replaying trace…' : 'Replay exact trace'} <span>▶</span>
            </button>
          </div>
          <FeelInspector
            telemetry={telemetry}
            primitive={scenarioManifest.primitive}
            scenario={scenario.id}
            axis="x"
          />
        </article>
      </section>
      <footer className="feel-footer">
        leading edge 24 px · distance 40% · velocity 600 px/s
      </footer>
    </main>
  );
}
