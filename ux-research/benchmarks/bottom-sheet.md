# Benchmark: bottom sheet physical continuity

## Canonical scenarios

| Scenario         | Contract                                                        | Primary evidence             |
| ---------------- | --------------------------------------------------------------- | ---------------------------- |
| Slow snap        | Surface tracks the pointer and settles at the nearest snap      | tracking error, trace, video |
| Fast dismiss     | Release direction and useful velocity carry into dismissal      | velocity continuity, video   |
| Upper resistance | Movement continues beyond the bound at a reduced ratio          | pointer/surface trace        |
| Interrupt settle | A new gesture immediately takes ownership from the spring       | interrupted event, video     |
| Scroll handoff   | Native content scrolling yields to the sheet at `scrollTop = 0` | owner trace, final state     |

The scenario source is `ux-research/scenarios/bottom-sheet.json`. Browser telemetry reports
the JavaScript motion model. It does not claim to measure hardware touch latency, compositor
presentation, display scanout, or perceived haptic response.

## Review order

1. Confirm the logical destination and gesture owner.
2. Review the recording at normal speed for discontinuity.
3. Compare pointer and surface traces.
4. Inspect the velocity handoff before tuning spring constants.
5. Repeat the same scenario on the deployed kitchen sink using a physical phone.
