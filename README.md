# pwacn

If you are reading this, Firstly, hi, how the hell did you get here, are you stalking me??

Secondly, this is pre-alpha, pre-relase experimentation, nothing is ready yet, but if you really want to try then here - https://pwacn-settings.vercel.app/ (open in mobile and install as a PWA)

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

`MobileStack` owns the screen entries and all push, pop, and swipe animation. Push a full-screen
menu or detail view as a screen; use a sheet for a temporary overlay. The app back button and
swipe call the same stack controller. A swipe drives both visible screens from one progress
value, including cancellation and settling. Pointer-driven transitions never start a browser
View Transition; non-interactive transitions may use one.

`history="browser"` (the default) writes same-URL history entries for platform Back. Browser
Back requests a stack pop and browser Forward restores a cached screen. At the root, browser
Back may leave the app. `history="memory"` keeps navigation entirely local. Pass an explicit
`pathname` to `push` or `replace` only if your app wants URL changes. This history adapter
does not own animation or cause a page reload. iOS and Android system-edge behavior can
differ; `backGestureRegion="screen"` lets the browser own its physical edge while pwacn
recognizes swipes from the screen body.

One URL does not imply eager JavaScript loading. Split screens into chunks when useful and
include every required chunk in the offline build described below.

- preserved screens and scroll positions
- app and platform Back through one controller
- edge or full-screen gesture region

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

## Offline-ready builds

For Vite apps, install `@pwacn/offline` and add `pwacnOffline()` to the production Vite
plugins. The plugin generates `sw.js` and `offline-assets.json` from the finished build. It
includes local HTML, CSS, JavaScript chunks, fonts, icons, manifest, and other bundled files,
including lazy-loaded screens. Bundle required assets locally; remote APIs and CDN files are
outside the static readiness guarantee.

```tsx
// vite.config.ts
import { pwacnOffline } from '@pwacn/offline';
export default defineConfig({ plugins: [react(), pwacnOffline()] });

// App.tsx
const offline = useOfflineReadiness(); // from @pwacn/react
// 'preparing' | 'ready' | 'unavailable' | 'unsupported'
```

Show “Ready offline” only for `ready`. The worker verifies SHA-256 hashes while installing
and does not activate an incomplete build. It serves required assets from the complete cache
without a network wait, keeps the previous complete build and serves its old chunks to open tabs through an update, and checks for
missing cached assets when queried. After storage eviction it downloads missing assets when
online; an offline launch without cached HTML shows a recovery page. Browser storage may be
evicted later, so readiness describes the current cache, not a permanent installation promise.
The worker never substitutes HTML for a missing JavaScript or CSS file.

Run `node scripts/verify-offline.mjs` after building the kitchen sink to exercise first
install, offline cold launch, bundled screen navigation, incomplete update, coherent update,
and cache-loss recovery in Chromium and WebKit. The WebKit loop simulates a failed network
at the server because Playwright's WebKit offline toggle returned an internal navigation
error; review installed iPhone behavior on a device.

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
