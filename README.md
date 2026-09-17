# pwacn

A mobile-first React primitive framework for PWAs that should feel physically native.

This repository contains the deployable v0 interaction system described in
[`PLAN.md`](./PLAN.md): experimental behavioral tokens, React motion primitives, mobile
surfaces and navigation, open-code tooling, documentation, and an installable kitchen-sink
PWA.

## Workspace

```text
apps/playground   Interactive Vite lab and tuning bench
apps/kitchen-sink Installable PWA build of the interaction lab
apps/docs         Public component and tooling reference
packages/core     Framework-agnostic physics, depth, and gesture tokens
packages/react    React primitives, surfaces, navigation, and viewport utilities
packages/cli      Open-code init, add, and diff commands
packages/eslint-plugin  Motion convention rules
registry          Source templates and dependency metadata
```

## Run locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm dev:docs
pnpm dev:kitchen-sink
```

The playground opens at `http://localhost:5173`. Its tuning bench is available at
`/tuning`.

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

The end-to-end suite uses a mobile Chromium profile. Install the browser once with
`pnpm exec playwright install chromium` if it is not already present.

## Current API surface

- `Pressable` and `MotionSurface`
- `Draggable`, `Swipeable`, and `SwipeTabs`
- `BottomSheet`, `ActionSheet`, and `FullScreenModal`
- `MobileStack`, `useMobileStack`, and `SharedElement`
- `useMobileViewport` and `usePrefersReducedMotion`
- semantic mass, spring, gesture, depth, capability, and haptic tokens

```tsx
import { Pressable } from '@pwacn/react';

<Pressable onPress={save}>Save</Pressable>;
```

`Pressable` responds on pointer-down, cancels after pointer drift or boundary exit, supports
native button and custom-element keyboard semantics, honors disabled state, and uses a
coherent reduced-motion fallback. Values in `@pwacn/core` remain experimental until they
have been tuned on real mobile hardware.

## Open-code workflow

```bash
npx pwacn init
npx pwacn add pressable sheet swipe-action stack
npx pwacn diff
```

Registry dependency resolution is automatic. The generated files live in the consumer's
source tree and can be changed freely.

## Autonomous UX loop

The repeatable native-interaction review lives in [`ux-research`](./ux-research). Capture
the kitchen-sink PWA on a mobile browser profile with:

```bash
pnpm ux:capture
```

Each ignored run contains a fixed-viewport screenshot and interaction video. Benchmarks
record the reference behavior, failure severity, implementation changes, and subsequent
audit so motion regressions are judged as interaction failures rather than decoration.
