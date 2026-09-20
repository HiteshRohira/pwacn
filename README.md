# pwacn

Mobile interaction primitives for React PWAs: native mechanics, application-owned visuals.

pwacn 0.1 provides one motion vocabulary across pressing, dragging, swiping, sheets,
navigation, controls, feedback, safe areas, keyboards, and reduced motion. The repository
contains two deliberately separate products:

- `apps/playground` — an instrumented interaction and tuning laboratory.
- `apps/kitchen-sink` — an installable iPhone Settings benchmark built from pwacn.

## Packages

| Package                | Purpose                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `@pwacn/core`          | Physics, depth, platform feedback, gesture tokens, arbitration, and stack state |
| `@pwacn/react`         | React controls, surfaces, navigation, feedback, and viewport hooks              |
| `pwacn`                | Open-code registry CLI                                                          |
| `@pwacn/eslint-plugin` | Guardrails for coherent motion and mobile interaction surfaces                  |

## Run and verify

Requires Node 20+ and pnpm 8.

```bash
pnpm install
pnpm dev                 # interaction playground
pnpm dev:kitchen-sink    # Settings PWA
pnpm dev:docs
pnpm release:check       # format, lint, types, unit, build, multi-device E2E
```

## React API

Foundations and controls:

- `Pressable`, `MotionSurface`, `Draggable`, `Swipeable`, `SwipeTabs`
- `MobileSwitch`, `SegmentedControl`, `Picker`
- `useMobileViewport`, including keyboard, viewport offset, and safe-area measurements
- `usePrefersReducedMotion`

Spatial surfaces and feedback:

- `BottomSheet`, `SheetScrollArea`, `ActionSheet`, `FullScreenModal`
- `ContextMenu`, `ToastProvider`, `useToast`, `RefreshControl`
- `ReorderableList`, `Carousel`, `NavigationBar`

Navigation:

- `MobileStack`, `useMobileStack`, `SharedElement`

`MobileStack` defaults to an edge-origin back gesture. Set
`backGestureRegion="screen"` when the browser's physical edge must remain system-owned and
the app should recognize a right-swipe from the screen body instead.

- preserved screens and scroll positions
- browser history synchronization and progressive View Transitions
- leading-edge-only interactive back navigation

```tsx
import { BottomSheet, Pressable, SheetScrollArea } from '@pwacn/react';

<Pressable onPress={() => setOpen(true)}>Open comments</Pressable>
<BottomSheet
  open={open}
  onOpenChange={setOpen}
  snapPoints={[0.35, 0.62, 0.92]}
  onSnapChange={setSnap}
  title="Comments"
>
  <SheetScrollArea>{comments}</SheetScrollArea>
</BottomSheet>
```

## Gesture ownership

`GestureCoordinator` arbitrates nested interactions. Edge-back has the highest priority,
sheets take vertical ownership at the top of a scroll area, swipe actions own committed
horizontal rows, and tab paging yields to all of them. Components release ownership on
completion or cancellation so a new pointer sequence can interrupt immediately.

## Open-code CLI

```bash
npx pwacn init
npx pwacn list
npx pwacn add pressable sheet action-sheet switch toast
npx pwacn diff
npx pwacn doctor
```

Registry dependencies install automatically. `add` refuses to overwrite locally modified
files unless `--force` is passed.

## Accessibility and devices

Sheets use modal semantics, focus containment, background inerting, Escape dismissal, and
focus restoration. Controls expose native switch, radio, tab, dialog, status, and carousel
semantics. Every animated primitive has a reduced-motion path.

The browser release matrix covers iPhone Safari, Pixel Chrome, and Galaxy Chrome profiles.
Physical hardware and screen-reader sign-off follows [DEVICE_TESTING.md](./DEVICE_TESTING.md).

## Release

The four public packages are versioned together. Run `pnpm release:check`, update
[CHANGELOG.md](./CHANGELOG.md), publish from a clean main branch, then tag the commit as
`v0.1.0`. CI runs the same release gate for pushes and pull requests.

The long-form product rationale and roadmap are in [PLAN.md](./PLAN.md).
