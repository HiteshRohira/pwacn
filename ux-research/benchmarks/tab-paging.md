# Benchmark: horizontal feed paging

## Expected physical model

- Discover and Following are adjacent surfaces on one horizontal plane.
- A tap moves the complete content plane in the correct direction.
- A drag transfers control to the finger after an 8 px intent threshold.
- Until release, displacement is continuous and reversible.
- Distance or velocity can commit; insufficient movement returns to origin.
- Boundary overdrag is resisted rather than hard-clamped.
- The indicator and content resolve to the same selected state.
- Vertical scrolling wins when vertical intent is dominant.
- A running settle animation can be interrupted by a new pointer-down.
- Reduced motion uses an immediate state change without leaving content between pages.

## Severity rubric

- S1: no transition, wrong destination, blocked scrolling, or lost content.
- S2: content does not follow the finger, cannot reverse, or settles in the wrong direction.
- S3: timing, damping, overshoot, or visual indicator feels inconsistent.
- S4: cosmetic discrepancy with no effect on gesture understanding.

## First audit

The original Morrow implementation was S1: tab buttons replaced content with no spatial
transition and offered no horizontal gesture. `SwipeTabs` replaces the boolean content swap
with a single MotionValue-driven plane and semantic navigation spring.

## Second audit

- Tap paging preserves spatial continuity between adjacent feeds: pass.
- Horizontal drag follows the pointer continuously and can reverse before release: pass.
- Distance and velocity both commit to the correct semantic tab: pass.
- Vertical intent remains available to native page scrolling: pass.
- A new pointer-down stops the running spring before taking control: pass.
- Nested swipe-to-save on feed media competed for the same horizontal gesture: removed;
  saving remains available through the explicit bookmark control.
- Remaining S3 tuning belongs on physical iOS hardware: spring damping and indicator/content
  phase alignment should be compared again after several days of ordinary use.
