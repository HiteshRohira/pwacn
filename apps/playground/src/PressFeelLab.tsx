import { Pressable, useFeelTelemetry } from '@pwacn/react';
import { useMemo, useState } from 'react';
import scenarioManifest from '../../../ux-research/scenarios/pressable.json';
import { FeelInspector } from './FeelInspector';
import { replayPointerTraces, wait } from './gesture-replay';

type Scenario = (typeof scenarioManifest.scenarios)[number];

export function PressFeelLab() {
  const initialId = new URLSearchParams(window.location.search).get('scenario');
  const [scenarioId, setScenarioId] = useState(
    scenarioManifest.scenarios.some((scenario) => scenario.id === initialId)
      ? (initialId as string)
      : scenarioManifest.scenarios[0]!.id,
  );
  const [commits, setCommits] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const telemetry = useFeelTelemetry('Pressable');
  const scenario = useMemo(
    () =>
      scenarioManifest.scenarios.find((candidate) => candidate.id === scenarioId) ??
      scenarioManifest.scenarios[0]!,
    [scenarioId],
  );

  const selectScenario = (next: Scenario) => {
    setScenarioId(next.id);
    setCommits(0);
    telemetry.clear();
    window.history.replaceState({}, '', `/feel/press?scenario=${next.id}`);
  };

  const replay = async () => {
    telemetry.clear();
    setCommits(0);
    setReplaying(true);
    try {
      await replayPointerTraces({
        target: () => document.querySelector<HTMLElement>('[data-feel-press-target]'),
        traces: scenario.traces,
        pauseBetweenTracesMs: scenario.pauseBetweenTracesMs,
        clickOnValidRelease: true,
      });
      await wait(650);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <main className="feel-shell press-feel-shell">
      <header className="feel-header compact">
        <a href="/" className="feel-back">
          ← Interaction lab
        </a>
        <div>
          <span className="lab-kicker">PWACN / FEEL FIXTURE 02</span>
          <h1>
            Contact,
            <br />
            then intent.
          </h1>
        </div>
        <p>
          Press feedback begins at contact. Activation remains a separate decision at
          release.
        </p>
      </header>

      <section className="feel-workbench press-workbench">
        <nav className="scenario-list" aria-label="Pressable scenarios">
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

        <article className="press-stage-large">
          <div className="press-target-orbit">
            <i aria-hidden="true" />
            <Pressable
              data-feel-press-target=""
              className="press-target"
              onPress={() => setCommits((value) => value + 1)}
            >
              <span>PRESS</span>
              <small>commit {commits.toString().padStart(2, '0')}</small>
            </Pressable>
          </div>
          <div className="press-scenario-copy">
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
          />
        </article>
      </section>
      <footer className="feel-footer">
        contact → React commit {telemetry.summary.eventToCommitMs?.toFixed(1) ?? '—'} ms ·
        activations {commits}
      </footer>
    </main>
  );
}
