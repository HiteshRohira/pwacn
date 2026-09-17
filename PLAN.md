# pwacn — Plan

> A mobile-first primitive framework for building PWAs that feel physically native.

## 1. Project summary

`pwacn` is a React primitive framework focused on one narrow problem:

> **Mobile PWAs often feel like websites even when they look like apps.**

The goal of pwacn is to make mobile PWAs feel materially closer to native iOS/Android apps by standardizing the parts that create physicality and perceived “heft”:

- immediate touch feedback
- spring-driven motion
- gesture continuity
- velocity-aware interactions
- resistance and elasticity
- spatial navigation
- preserved screen state
- sheet and modal physics
- nested scroll / gesture arbitration
- shared-element transitions
- safe-area handling
- mobile keyboard behavior
- depth and layered motion
- interruptible animations
- reduced-motion behavior
- consistent interaction semantics across the entire app

This is **not** primarily a visual component library.

It is a **mobile interaction system** that happens to expose components.

The target developer experience should feel closer to shadcn than to Ionic:

```bash
npx pwacn init
npx pwacn add pressable
npx pwacn add sheet
npx pwacn add stack
npx pwacn add swipe-action
```

The generated components live in the consumer's codebase and can be modified.

---

# 2. Product thesis

A mobile app feels native when the UI behaves like a coherent physical system.

The web often models interaction as discrete state changes:

```text
Tap -> event -> state change -> animation
```

A native-feeling system should instead model interaction continuously:

```text
Finger down
  -> immediate visual response
  -> object tracks finger
  -> resistance changes near boundaries
  -> velocity is captured
  -> release transfers momentum
  -> object settles with spring physics
```

The framework should make the second model the default.

The project should optimize for **behavioral fidelity**, not pixel-perfect cloning of UIKit or Material Design.

A pwacn app should be allowed to look completely custom while still feeling native.

---

# 3. Non-goals

pwacn should deliberately avoid becoming a generic cross-platform UI framework.

## Not in scope

- desktop-first design
- generic dashboard components
- data tables
- desktop popovers/menus as a primary concern
- CSS utility framework replacement
- design-token replacement for colors/typography/spacing
- pixel-perfect UIKit recreation
- pixel-perfect Material Design recreation
- native packaging / Capacitor abstraction
- backend state management
- data fetching
- offline sync engine
- PWA manifest generation in the first versions
- replacing the browser's native scrolling with custom JS scrolling
- building a general animation engine

Use existing tools where they are already excellent.

---

# 4. Core design principles

## 4.1 Native mechanics, custom aesthetics

The library should standardize behavior rather than force a visual theme.

A consumer should be able to use:

- Tailwind
- CSS Modules
- vanilla CSS
- Panda
- styled-components
- any other styling system

without giving up pwacn interaction semantics.

---

## 4.2 Intent over implementation

Application code should describe what something **is**, not how it animates.

Bad:

```tsx
<motion.div
  animate={{ y: 0 }}
  transition={{ type: 'spring', stiffness: 382, damping: 31 }}
/>
```

Good:

```tsx
<Sheet />
```

Or, for lower-level primitives:

```tsx
<MotionSurface mass="surface" depth="overlay" />
```

The framework owns the physics.

---

## 4.3 No arbitrary motion values in product code

Consumers should rarely specify:

- duration
- stiffness
- damping
- mass
- bounce
- drag elasticity
- swipe thresholds
- gesture velocity thresholds

Those belong to semantic tokens.

---

## 4.4 Every interactive component responds on pointer-down

A native-feeling control should acknowledge contact immediately.

Press feedback must not wait for `click`.

All interaction primitives should use Pointer Events and support:

- touch
- pen
- mouse
- keyboard

without separate interaction implementations.

---

## 4.5 Motion must be interruptible

If an object is animating and the user touches it, control should transfer back to the user whenever possible.

Avoid animations that must finish before the next interaction can begin.

---

## 4.6 Navigation has geometry

Routes are not just URLs.

The navigation layer should understand relationships:

```text
push
pop
modal
sheet
tab
shared-element
```

A push and a modal must not look or behave the same.

---

## 4.7 Prefer browser-native scrolling

Use real scroll containers.

Do not replace scrolling with a requestAnimationFrame-based custom scroll implementation.

Enhance browser scrolling with:

- scroll snap
- overscroll rules
- gesture coordination
- scroll restoration

---

## 4.8 Progressive enhancement

The framework must remain usable when specific APIs are missing.

Examples:

- View Transition API unavailable -> fallback transition
- vibration unavailable -> no haptic
- reduced motion enabled -> simplified transitions
- iOS-specific behavior unavailable -> generic mobile behavior

The framework should not require a specific mobile browser.

---

# 5. Proposed stack

## Runtime

- React
- TypeScript
- Motion (`motion/react`)
- Pointer Events
- Web Animations / CSS where appropriate
- View Transition API where supported

## Accessibility foundation

Use accessible headless primitives where useful rather than rebuilding focus management and ARIA behavior from scratch.

Candidate dependency:

- Radix primitives selectively

Do **not** expose Radix concepts directly through the public API unless needed.

## Build tooling

Recommended:

- pnpm workspaces
- Turborepo
- tsup or Vite library mode for packages
- Vitest
- Testing Library
- Playwright

## Documentation / examples

- Vite React playground initially
- optional Next.js playground later
- Storybook is optional; a real mobile demo app is more important

---

# 6. Repository structure

Suggested monorepo:

```text
pwacn/
├── apps/
│   ├── docs/
│   ├── playground/
│   └── kitchen-sink/
│
├── packages/
│   ├── core/
│   ├── motion/
│   ├── gestures/
│   ├── navigation/
│   ├── primitives/
│   ├── eslint-plugin/
│   ├── cli/
│   └── config/
│
├── registry/
│   ├── pressable/
│   ├── sheet/
│   ├── stack/
│   ├── swipe-action/
│   └── ...
│
└── docs/
```

Potential simplification for v0:

```text
packages/
├── core
├── react
├── cli
└── eslint-plugin
```

Do not over-fragment the repository before APIs stabilize.

---

# 7. The behavioral token system

This is one of the most important parts of pwacn.

The framework needs semantic tokens for **physics**, not just CSS.

## 7.1 Mass classes

Objects should belong to semantic mass classes.

```ts
export type MassClass = 'micro' | 'control' | 'surface' | 'screen';
```

Suggested semantics:

```text
micro
  toggle thumb
  tiny indicator
  icon reaction

control
  button
  segmented control
  list item press

surface
  bottom sheet
  card expansion
  action sheet

screen
  route push/pop
  fullscreen modal
```

Initial default values can be tuned empirically.

Example:

```ts
export const mass = {
  micro: 0.28,
  control: 0.48,
  surface: 0.9,
  screen: 1.1,
};
```

These values are implementation details, not API promises.

---

## 7.2 Spring presets

Expose semantic presets.

```ts
export const springs = {
  press,
  control,
  snap,
  sheet,
  navigation,
  dismiss,
  rebound,
};
```

Consumers should reference intent:

```ts
springs.sheet;
```

not physics values directly.

---

## 7.3 Gesture tokens

```ts
export const gestures = {
  press: {
    movementTolerance: 8,
  },

  swipe: {
    activationDistance: 8,
    commitDistance: 0.35,
    velocityThreshold: 650,
  },

  sheet: {
    dragElastic: 0.12,
    dismissVelocity: 900,
    snapVelocity: 500,
  },

  edgeBack: {
    edgeWidth: 24,
    commitProgress: 0.4,
    velocityThreshold: 600,
  },
};
```

Exact numbers must be tuned through device testing.

Do not freeze these values early.

---

## 7.4 Depth tokens

```ts
export type Depth = 'base' | 'raised' | 'overlay' | 'modal';
```

Depth is not merely z-index.

It can drive coordinated motion.

Example modal presentation:

```text
foreground
  y: 100% -> 0

background
  scale: 1 -> .97
  translateY: 0 -> 6px
  borderRadius: 0 -> 14px

backdrop
  opacity: 0 -> .25
```

This should be encoded once rather than recreated in every component.

---

# 8. Core primitives

Build primitives before branded components.

---

## 8.1 Pressable

The most foundational primitive.

```tsx
<Pressable onPress={save}>Save</Pressable>
```

Responsibilities:

- immediate pointer-down response
- spring compression
- release response
- cancel when pointer leaves / gesture becomes drag
- keyboard activation
- disabled state
- reduced-motion fallback
- semantic element support
- optional haptic hook
- optional sound hook

Possible API:

```tsx
<Pressable asChild mass="control" feedback="scale" haptic="selection" />
```

Default behavior should be good enough that most callers specify no motion props.

---

## 8.2 MotionSurface

Low-level building block for physical surfaces.

```tsx
<MotionSurface mass="surface" depth="raised" />
```

Responsibilities:

- standardized springs
- interruption behavior
- reduced-motion handling
- transform composition

Avoid making this overly magical.

---

## 8.3 Draggable

```tsx
<Draggable axis="y" />
```

Responsibilities:

- drag tracking
- velocity
- elastic boundaries
- direction locking
- cancel / commit callbacks
- pointer capture
- nested interactive child handling

---

## 8.4 Swipeable

For items that reveal actions or dismiss.

```tsx
<Swipeable direction="left" onCommit={archive}>
  ...
</Swipeable>
```

Must support:

- progressive reveal
- resistance
- action threshold
- velocity commit
- cancellation
- spring-back
- optional destructive threshold feedback

---

# 9. Surface components

---

## 9.1 BottomSheet

One of the flagship components.

```tsx
<BottomSheet open={open} onOpenChange={setOpen} snapPoints={[0.4, 0.9]}>
  ...
</BottomSheet>
```

Must eventually support:

- velocity-aware dragging
- snap points
- drag resistance
- backdrop motion
- underlying-screen depth reaction
- drag handle
- nested scrolling
- scroll-to-drag handoff
- keyboard-safe viewport behavior
- safe-area inset
- interactive dismissal
- animation interruption
- focus management
- screen-reader semantics
- `prefers-reduced-motion`

Critical quality bar:

A scrollable sheet must feel correct when the inner list is at scrollTop 0 and the user continues dragging downward.

This is a major framework-level problem and should receive dedicated tests.

---

## 9.2 ActionSheet

Built on BottomSheet.

```tsx
<ActionSheet>
  <ActionSheet.Item>Share</ActionSheet.Item>
  <ActionSheet.Item destructive>Delete</ActionSheet.Item>
</ActionSheet>
```

Focus on interaction behavior rather than visual imitation of iOS.

---

## 9.3 FullScreenModal

```tsx
<FullScreenModal presentation="modal" />
```

Supports:

- enter from bottom
- interactive swipe-down dismissal
- background depth transition
- preserved previous screen
- keyboard-safe behavior

---

## 9.4 SwipeAction

For mail/chat/list interfaces.

```tsx
<SwipeAction left={<ArchiveAction />} right={<DeleteAction />}>
  <ListItem />
</SwipeAction>
```

Must define a consistent threshold grammar.

Potential phases:

```text
0%      resting
10%     action begins to reveal
30%     action readable
60%     commit mode engages
release commit or spring back
```

---

## 9.5 RefreshControl

Later milestone.

Do not implement fake scrolling.

Integrate with native scroll containers.

Potential behaviors:

- pull distance
- resistance
- threshold crossing
- loading state
- spring return

---

# 10. Navigation system

This is probably the hardest and most strategically important part of pwacn.

A PWA should not treat mobile navigation as simple route replacement.

---

## 10.1 Navigation concepts

The system should distinguish:

```text
push
pop
modal
sheet
tab
replace
shared-element
```

Each has different spatial semantics.

---

## 10.2 Navigation stack

Desired API direction:

```tsx
<MobileStack>
  <Stack.Screen name="home" component={Home} />
  <Stack.Screen name="post" component={Post} />
</MobileStack>
```

Or router-integrated equivalent.

Internal representation:

```ts
type StackEntry = {
  key: string;
  pathname: string;
  element: React.ReactNode;
  scrollPosition?: number;
  presentation: 'push' | 'modal' | 'sheet';
};
```

A small number of previous screens should remain mounted or restorable to support:

- interactive back
- preserved scroll
- preserved local component state
- instant visual continuity

Avoid unbounded memory growth.

---

## 10.3 Push transition

Default conceptual model:

```text
current screen moves slightly left / recedes
new screen enters from right
```

The transition should feel like a screen entering the stack, not a webpage loading.

---

## 10.4 Pop transition

Reverse the geometry of push.

Navigation direction should be inferred from stack semantics, never guessed from pathname strings.

---

## 10.5 Interactive edge-back gesture

Long-term flagship feature.

Behavior:

1. gesture begins inside configured left-edge region
2. current screen follows pointer horizontally
3. previous screen becomes visible underneath
4. progress remains continuous
5. release considers progress + velocity
6. animation completes or reverses
7. router history is updated only when commit semantics are safe

Conceptually:

```text
[ previous screen ][ current screen ---> ]
                         ^ finger
```

Key problems to solve:

- browser history synchronization
- back gesture cancellation
- screen mounting
- URL timing
- scroll preservation
- edge conflicts with carousels
- iOS browser back-swipe conflicts

Do not promise this feature until it is genuinely robust.

---

## 10.6 Shared element transitions

Use View Transition API where available.

Desired primitive:

```tsx
<SharedElement id={`photo-${photo.id}`}>
  <img ... />
</SharedElement>
```

The library should manage stable `view-transition-name` values and fallbacks.

Use cases:

- image -> detail hero
- card -> detail screen
- mini-player -> full player
- avatar -> profile header

Do not make every navigation a shared-element transition.

---

# 11. Gesture arbitration

This deserves its own subsystem.

Complex mobile interactions often contain multiple potential gesture owners.

Example:

```text
BottomSheet
  -> ScrollView
      -> horizontal carousel
          -> pressable card
```

The system needs predictable rules.

---

## 11.1 Gesture ownership

Track whether a gesture is currently owned by:

```text
press
vertical scroll
horizontal scroll
sheet drag
swipe action
back gesture
reorder
```

Avoid multiple handlers reacting simultaneously.

---

## 11.2 Direction locking

A small movement threshold should determine intent before locking.

Example:

```text
mostly x -> horizontal interaction
mostly y -> vertical interaction
```

Do not lock at the first pixel of movement.

---

## 11.3 Scroll-to-sheet handoff

Required behavior:

```text
if innerScroll.scrollTop > 0
  vertical gesture belongs to scroll

if innerScroll.scrollTop === 0
and user drags downward
  ownership can transfer to sheet
```

This must not create visible jumps.

---

## 11.4 Edge-back conflicts

Horizontal carousels near the left edge can conflict with navigation back gestures.

Possible policy:

- edge gesture receives priority inside first N px
- components can opt out with `backGesture="capture"`
- navigation respects interactive descendants when gesture did not originate in edge region

Needs real device testing.

---

# 12. Haptics abstraction

PWAs have limited haptic capabilities, especially on iOS.

Still provide a normalized abstraction so PWAs can enhance where available and apps wrapped with Capacitor could potentially plug in richer implementations later.

```ts
haptics.selection();
haptics.impact('light');
haptics.success();
```

Internally:

```text
web vibration supported -> use conservative vibration
unsupported -> no-op
custom adapter installed -> delegate
```

The core framework must never depend on haptics being available.

Avoid long vibration patterns.

---

# 13. Sound feedback abstraction

Optional and off by default.

```ts
feedback.sound('selection');
```

Potential uses:

- camera capture
- task completion
- payment success
- destructive confirmation

Do not turn ordinary button presses into noisy UI.

---

# 14. Mobile viewport and keyboard system

Mobile browser chrome and software keyboards are major sources of “web feel.”

pwacn should provide utilities for:

- `dvh` / dynamic viewport handling
- safe areas
- VisualViewport fallbacks
- keyboard-open detection only where necessary
- bottom navigation avoidance
- sheet resizing
- focus visibility

Potential CSS variables:

```css
--pwacn-safe-top
--pwacn-safe-bottom
--pwacn-viewport-height
--pwacn-keyboard-height
```

Provide a hook:

```ts
const viewport = useMobileViewport();
```

Possible result:

```ts
{
  width,
  height,
  keyboardHeight,
  keyboardOpen,
  safeArea,
}
```

Do not over-rely on JS when CSS viewport units can solve the problem.

---

# 15. Reduced motion

Reduced-motion support is required from day one.

Every motion primitive must define a reduced-motion behavior.

Do not merely set every duration to zero.

Example:

```text
normal push
  spatial slide + depth

reduced motion push
  minimal fade / instantaneous hierarchy change
```

The user should retain context without unnecessary movement.

---

# 16. Styling philosophy

pwacn should ship minimally styled components.

The default registry can include sensible mobile styling but behavior should remain separable.

Possible design:

```tsx
<Button className="..." />
```

with `className`, `style`, `asChild`, and CSS-variable overrides.

Do not hardcode a visual system so tightly that consumers must fight it.

---

# 17. shadcn-style registry model

The preferred distribution strategy is open-code.

Example CLI:

```bash
npx pwacn init
npx pwacn add pressable
npx pwacn add sheet
```

The CLI copies source into the app.

Example output:

```text
src/
├── components/pwacn/
│   ├── pressable.tsx
│   ├── sheet.tsx
│   └── swipe-action.tsx
│
└── lib/pwacn/
    ├── motion.ts
    ├── gestures.ts
    └── viewport.ts
```

Benefits:

- consumer owns implementation
- easy Safari-specific fixes
- no black-box styling
- easy customization
- behavior is still standardized through shared primitives/tokens

The CLI should track registry dependencies.

Example:

```text
sheet
  requires pressable
  requires motion
  requires gesture-core
  requires viewport
```

---

# 18. ESLint plugin

One of pwacn's differentiators should be enforcement.

Package:

```text
@pwacn/eslint-plugin
```

Potential rules:

## `no-arbitrary-spring`

Warn on:

```tsx
transition={{ stiffness: 312, damping: 22 }}
```

inside application code.

Suggest semantic tokens.

---

## `prefer-pressable`

Warn when an interactive mobile surface uses raw `onClick` without appropriate press feedback.

Be careful not to flag every button in every context.

---

## `require-reduced-motion`

For custom Motion usage, require a reduced-motion path.

---

## `no-arbitrary-transition-duration`

Warn on arbitrary animation durations in pwacn-aware files.

---

## `prefer-mobile-surface`

Optional rule that discourages raw generic dialogs for mobile sheet-like interactions.

Keep lint rules helpful, not ideological.

---

# 19. Platform detection policy

Avoid excessive user-agent sniffing.

Prefer capability detection.

Possible environment utilities:

```ts
supports.viewTransitions;
supports.vibration;
supports.visualViewport;
supports.pointerEvents;
supports.safeArea;
```

Platform-specific tuning may occasionally be warranted, but it should be isolated.

---

# 20. Performance requirements

A “native feeling” library that drops frames has failed.

## Targets

- interactions should aim for compositor-friendly transforms
- avoid layout thrashing during pointermove
- use MotionValues for continuous gestures
- avoid React state updates on every pointer frame
- avoid excessive DOM wrappers
- measure layout only when required
- use passive listeners where correct
- preserve browser scrolling performance

## Performance testing

Test on at least:

- modern flagship iPhone
- older iPhone
- modern Pixel / Android flagship
- mid-range Android device

Desktop emulation is insufficient.

---

# 21. Browser support target

The primary concern is modern mobile browsers.

Target initially:

- iOS Safari / installed Home Screen web apps
- Android Chrome / installed PWAs
- Samsung Internet if practical

Desktop compatibility is welcome but not a design priority.

The framework should not optimize desktop interactions at the expense of mobile behavior.

---

# 22. Testing strategy

## 22.1 Unit tests

Test deterministic helpers:

- gesture thresholds
- velocity decisions
- snap-point calculation
- direction locking
- navigation stack reducers

---

## 22.2 Component tests

Use Testing Library for:

- semantics
- keyboard behavior
- focus behavior
- state transitions

---

## 22.3 Playwright

Test interactions with real pointer sequences where possible:

- press cancellation
- swipe commit
- swipe cancel
- sheet snap
- sheet dismiss
- nested scroll interactions
- back navigation

---

## 22.4 Real-device testing

Mandatory before declaring primitives stable.

Maintain a manual interaction checklist.

Example for BottomSheet:

```text
[ ] slow drag down
[ ] fast flick down
[ ] drag above maximum
[ ] interrupt open animation
[ ] interrupt close animation
[ ] scroll list to middle
[ ] drag while list is scrolled
[ ] drag down at scrollTop 0
[ ] open keyboard inside sheet
[ ] close keyboard
[ ] rotate device
[ ] reduce motion enabled
[ ] VoiceOver / TalkBack basic flow
```

---

# 23. Demo application

A “kitchen sink” is not enough.

Build a realistic mobile demo app that stresses the system.

Recommended example: lightweight social/feed application.

Screens:

```text
Feed
Post detail
Comments
Profile
Search
Compose
Settings
```

Interactions:

- feed card press
- shared image transition
- push/pop navigation
- edge swipe-back
- bottom sheet
- comments sheet
- swipe actions
- tab navigation
- fullscreen compose modal
- keyboard interaction
- pull-to-refresh later

This app becomes the primary subjective benchmark for “does this feel native?”

---

# 24. Architecture phases

Do not try to build navigation, sheets, gestures, registry, linting, and docs simultaneously.

---

## Phase 0 — Interaction lab

Goal: validate the physics vocabulary before building a framework.

Build isolated prototypes for:

1. Pressable
2. BottomSheet
3. SwipeAction
4. push/pop transition
5. shared element transition

Create a single playground page with adjustable parameters.

Compare behavior side-by-side with native apps.

Output:

```text
physics.ts
gestures.ts
```

Do not stabilize public APIs yet.

---

## Phase 1 — Core motion primitives

Build:

- semantic springs
- mass classes
- depth classes
- Pressable
- MotionSurface
- Draggable
- Swipeable
- reduced-motion utilities

Deliverable:

A user can build custom components that all share the same physical language.

---

## Phase 2 — BottomSheet

Build the first flagship surface.

Focus heavily on:

- gesture quality
- snap points
- interruption
- nested scrolling
- keyboard behavior
- safe areas

Do not rush this component.

If pwacn's sheet feels mediocre, the project thesis is weakened.

---

## Phase 3 — Navigation stack

Build:

- stack model
- push
- pop
- preserved previous screen
- scroll restoration
- modal presentation

Integrate with one router first.

Recommended first target:

- React Router or TanStack Router

Avoid supporting every router initially.

---

## Phase 4 — Interactive back

Add edge swipe-back after push/pop stack behavior is stable.

Treat this as an advanced feature.

---

## Phase 5 — Open-code registry + CLI

Only after the primitives are worth distributing.

Implement:

```bash
pwacn init
pwacn add
pwacn diff
```

`diff` can compare local component source with registry updates similar to open-code workflows.

---

## Phase 6 — Enforcement

Add ESLint rules and conventions.

By this point the framework should know which patterns are genuinely harmful rather than guessing early.

---

## Phase 7 — Additional components

Potential additions:

- ActionSheet
- SegmentedControl
- Switch
- Tabs
- NavigationBar
- SwipeAction
- ContextMenu
- Picker
- Toast
- RefreshControl
- ReorderableList
- Carousel primitives

Every component must justify itself through mobile interaction behavior.

---

# 25. API design guidelines

## Prefer boring APIs

A developer should not need to understand physics to get good physics.

Good:

```tsx
<Sheet snapPoints={[0.5, 0.9]} />
```

Avoid:

```tsx
<Sheet
  spring={{ stiffness: 340, damping: 32 }}
  elasticity={0.12}
  velocityThreshold={782}
/>
```

Expert overrides can exist later behind an advanced escape hatch.

---

## Prefer semantic props

Good:

```tsx
<MotionSurface mass="surface" />
```

Bad:

```tsx
<MotionSurface mass={0.92} />
```

---

## Allow escape hatches

Because open-code is central, consumers can always customize implementation.

The runtime API therefore does not need dozens of micro-configuration props.

---

# 26. Candidate public APIs

These are sketches, not commitments.

## Pressable

```tsx
<Pressable onPress={handler} feedback="scale" mass="control">
  ...
</Pressable>
```

---

## Sheet

```tsx
<Sheet.Root open={open} onOpenChange={setOpen}>
  <Sheet.Trigger asChild>
    <Button>Open</Button>
  </Sheet.Trigger>

  <Sheet.Content snapPoints={[0.5, 0.9]}>
    <Sheet.Handle />
    <Sheet.ScrollArea>...</Sheet.ScrollArea>
  </Sheet.Content>
</Sheet.Root>
```

---

## SwipeAction

```tsx
<SwipeAction.Root>
  <SwipeAction.Action side="left" onCommit={archive}>
    Archive
  </SwipeAction.Action>

  <SwipeAction.Content>
    <MessageRow />
  </SwipeAction.Content>
</SwipeAction.Root>
```

---

## Stack

```tsx
<Stack.Root>
  <Stack.Screen path="/" component={Home} />
  <Stack.Screen path="/post/:id" component={Post} />
</Stack.Root>
```

---

# 27. Quality bar

Do not judge components only visually.

For every primitive ask:

### Touch

- Does it respond immediately?
- Can the user reverse the interaction?
- Is the hit target forgiving?

### Motion

- Does velocity matter?
- Does the object have appropriate mass?
- Is the spring consistent with other components?
- Can animation be interrupted?

### Space

- Where did the surface come from?
- Where does it go when dismissed?
- Does that match the interaction hierarchy?

### Scroll

- Who owns the gesture?
- What happens at boundaries?
- Does nested scrolling feel natural?

### Accessibility

- Does keyboard interaction still work?
- Does reduced motion remain coherent?
- Are semantics correct?

### Performance

- Does it remain smooth on mid-range mobile hardware?

---

# 28. The "native feel" checklist

A pwacn component should ideally satisfy several of these:

- immediate pointer-down feedback
- no unnecessary click latency
- motion linked to gesture progress
- release velocity influences outcome
- elastic resistance at boundaries
- spring-based settling
- animation can be interrupted
- spatially consistent enter/exit direction
- background reacts to foreground presentation
- native browser scrolling retained
- overscroll intentionally controlled
- safe-area aware
- keyboard aware
- reduced-motion aware
- screen state preserved when navigation semantics require it

If a component only looks like a native component but does none of these, it does not belong in pwacn.

---

# 29. Anti-patterns

Avoid these throughout the project.

## Arbitrary CSS duration soup

```css
transition: all 250ms ease;
```

Avoid as a default interaction strategy.

---

## `transition: all`

Too broad and difficult to reason about.

---

## JS-driven fake scrolling

Do not replace browser scrolling for visual smoothness.

---

## Gesture logic through React state on every frame

Use MotionValues / refs / animation system primitives.

---

## Everything slides

Not every state change deserves movement.

Tabs, toggles, hierarchy changes, and modals should use different semantics.

---

## Excessive bounce

Native-feeling does not mean cartoon physics.

Most high-quality native UI is relatively restrained.

---

## Pixel-perfect iOS cloning

The framework should be useful for branded products rather than Apple Settings replicas.

---

# 30. Initial tasks for the implementation agent

Start here.

## Task 1 — bootstrap repository

Create pnpm workspace with:

```text
apps/playground
packages/core
packages/react
```

Install:

```text
react
react-dom
motion
typescript
vite
vitest
playwright
```

Set up formatting/linting.

Do not add a large component framework.

---

## Task 2 — create motion token prototype

Create:

```text
packages/core/src/physics.ts
packages/core/src/gestures.ts
packages/core/src/depth.ts
```

Define semantic tokens.

All numeric values should be documented as experimental.

---

## Task 3 — build Pressable

Create a production-quality Pressable prototype.

Acceptance criteria:

- reacts on pointer-down
- springs back on release
- cancels correctly
- keyboard accessible
- supports disabled
- reduced-motion aware
- no React state updates per animation frame

Add playground examples with:

- text button
- icon button
- list item
- card

---

## Task 4 — build interaction tuning screen

Create a playground route where spring presets can be compared.

This screen may expose raw sliders for internal tuning only.

Include:

- mass
- stiffness
- damping
- elasticity

Do not expose these tuning controls in public APIs.

---

## Task 5 — prototype BottomSheet

Build only the physical behavior initially.

Do not spend time on polished styling.

Acceptance criteria:

- opens with spring
- follows finger
- captures release velocity
- supports at least two snap points
- resistance outside limits
- flick-to-dismiss
- animation interruption

Then add nested scrolling in a separate iteration.

---

## Task 6 — device test

Run Pressable and Sheet on actual iPhone and Android devices.

Record subjective problems.

Tune physics based on device interaction, not desktop Chrome.

---

# 31. v0.1 scope

Keep the first release intentionally small.

Ship:

```text
physics tokens
Pressable
MotionSurface
Swipeable
BottomSheet
reduced-motion utilities
viewport / safe-area utilities
```

Maybe:

```text
SwipeAction
```

Do not block v0.1 on navigation.

The first release should prove:

> pwacn components feel substantially more physical than ordinary React web components.

---

# 32. v0.2 scope

Focus on navigation.

Ship:

```text
Stack
push/pop transitions
screen preservation
scroll restoration
modal presentation
```

---

# 33. v0.3 scope

Ship advanced gesture navigation.

```text
interactive back
shared-element abstraction
router integration improvements
```

---

# 34. Success criteria

The project is successful when a developer can build a custom-designed mobile PWA using pwacn and get the following without hand-authoring animation behavior for every feature:

- buttons feel pressable
- surfaces feel like they have mass
- sheets feel physically connected to the finger
- navigation has stable spatial rules
- swipe actions respond to velocity
- modal/background depth behaves consistently
- gestures do not fight scrolling
- mobile keyboard and safe areas do not break layout
- reduced motion works automatically
- motion across the product feels like one coherent system

The strongest test is subjective:

> When installed to the home screen and used full-screen, does the app stop constantly reminding the user that it is a website?

---

# 35. Guiding rule for every future feature

Before adding a component, ask:

> **Does pwacn provide meaningful mobile interaction behavior here that a normal headless/UI library does not?**

If the answer is no, it probably should not exist in pwacn.

The project's advantage is not the number of components.

It is the quality and consistency of its mobile interaction model.

---

# 36. One-sentence definition

**pwacn is an open-code React primitive system that gives mobile PWAs a coherent physical interaction language—springs, gestures, spatial navigation, depth, and touch behavior—so they feel much closer to native apps without becoming native apps.**
