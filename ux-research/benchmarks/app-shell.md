# Benchmark: installed app shell

## Coverage matrix

| Flow           | Physical contract                                                   | Automated evidence              |
| -------------- | ------------------------------------------------------------------- | ------------------------------- |
| Feed paging    | Content follows finger, reverses, commits by distance/velocity      | `tab-paging.webm`               |
| Comments       | Sheet rises from edge and dismisses with direct handle manipulation | `sheet-drag.webm`               |
| Compose        | Full-screen task preserves origin and exits to it                   | `full-screen-presentation.webm` |
| App navigation | Persistent controls preserve destination state and content context  | `bottom-navigation.webm`        |
| Reduced motion | Destination changes without residual interpolation                  | `reduced-motion.webm`           |

## Release gate

Do not deploy when a captured flow has an S1 or S2 discrepancy, an assertion fails, vertical
scroll is blocked, focus is lost behind a modal surface, or the PWA manifest/service worker
check fails. S3 tuning is documented and scheduled for another capture rather than silently
accepted.

## First audit finding

Frame review showed that `BottomSheet` animated opacity on the entire presentation layer.
That made the full-screen composer translucent during entry and visually merged it with the
feed below. Backdrop opacity now animates independently while the presented surface remains
opaque and carries its weight through movement alone.
