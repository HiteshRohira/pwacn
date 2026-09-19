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

For the isolated BottomSheet fixture, run the playground preview on port 4173 and use:

```bash
pnpm feel:capture
```

This replays the five traces in `scenarios/bottom-sheet.json` and writes a video, screenshot,
telemetry JSON, and structured review for each scenario. The telemetry describes the
JavaScript motion model; real-device review remains the authority for physical latency and
perceived feel.

## Review cadence

- Run the suite after every primitive-level interaction change.
- Compare normal-speed playback first, then contact/turnaround/settle frames.
- Log every S1–S2 discrepancy in the relevant benchmark and iterate before deployment.
- Deploy the exact verified build and repeat against the production URL.
- Add a new scenario whenever an interaction defect escapes the loop.

Human review begins after the production run is clean; it is not the mechanism used to find
the first round of defects.
