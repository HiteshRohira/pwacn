# pwacn autonomous interaction QA

This directory defines the feedback loop used to tune pwacn without relying on a person to
describe motion defects.

## Loop

1. Select one atomic interaction and its native reference.
2. Record the reference source, device, OS, gesture, and observable behavior.
3. Capture pwacn at a fixed mobile viewport with the matching gesture.
4. Review the videos at normal speed and frame-by-frame.
5. Score continuity, latency, displacement, velocity transfer, settling, interruption, and
   gesture arbitration.
6. Change the primitive, never just the demo call site.
7. Repeat capture until no severity-1 or severity-2 discrepancy remains.
8. Run automated semantics, reduced-motion, and performance checks before deployment.

Videos and screenshots are written to `.ux-artifacts/` and intentionally ignored by Git.

## Capture

Run a local kitchen-sink preview on port 4174, then:

```bash
pnpm ux:capture
```

To test production:

```bash
PWACN_UX_URL=https://pwacn-playground.vercel.app pnpm ux:capture
```

The general UX run currently captures Settings navigation, search, account-sheet, and dark
appearance flows. An `audit.json` records whether every observable state transition completed.

For the isolated interaction fixtures, run the playground preview on port 4173 and use:

```bash
pnpm feel:capture
```

This replays the canonical traces for BottomSheet, Pressable, and InteractiveBack and writes
a video, screenshot, telemetry JSON, and structured review for each scenario. The routes can
also be inspected directly:

- `/feel/sheet`
- `/feel/press`
- `/feel/interactive-back`

Compare any two captured runs with:

```bash
pnpm feel:compare .ux-artifacts/feel/<baseline> .ux-artifacts/feel/<candidate>
```

The generated table is deliberately descriptive rather than a pass/fail score. Telemetry
describes the JavaScript motion model; paired video and real-device review remain the
authority for physical latency and perceived feel.

For the integrated Settings navigation gate, run the production preview on port 4174 and:

```bash
pnpm feel:navigation
```

This replays commit, flick, cancel, reversal, nested-stack, and scrolled-screen back gestures
three times in Chromium/Android and real Playwright WebKit/iPhone. It samples the rendered
foreground and background positions on every frame rather than trusting the animation model, enforces route and telemetry
invariants, checks settle-time repeatability, and writes normal-speed video, 0.25× video,
screenshots, traces, and an audit to `.ux-artifacts/navigation/`.

Interactive navigation is framework-owned and must not start a browser View Transition.
View Transitions may only be introduced for transitions that have no pointer-driven phase.

## Evidence classes

- **Invariant:** deterministic behavior that can fail automation, such as route commitment,
  cancellation, interruption, or sufficient trace samples.
- **Metric:** a measurement that can regress or improve but needs context, such as tracking
  error, velocity continuity, settle time, and long frames.
- **Judgment:** a human comparison against the native reference at normal speed and
  frame-by-frame. Words such as direct, heavy, mushy, abrupt, or coherent belong here.

`eventToCommitMs` measures pointer contact to the React layout response observed by the
instrumentation. It is not physical touch-to-photon latency. `longFrames` is derived from
main-thread animation-frame intervals and is not a compositor trace.

## Review cadence

- Run the suite after every primitive-level interaction change.
- Compare normal-speed playback first, then contact/turnaround/settle frames.
- Log every S1–S2 discrepancy in the relevant benchmark and iterate before deployment.
- Deploy the exact verified build and repeat against the production URL.
- Add a new scenario whenever an interaction defect escapes the loop.

Human review begins after the production run is clean; it is not the mechanism used to find
the first round of defects.
