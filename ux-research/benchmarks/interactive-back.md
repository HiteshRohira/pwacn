# Interactive back benchmark

## Reference behavior

The foreground screen follows a leading-edge gesture while the previous screen remains
mounted beneath it. Distance or release velocity commits the route. Cancellation and
interruption continue from the current surface position.

## Canonical scenarios

- 30% drag then cancel
- 70% drag then commit
- short fast flick then commit
- reverse direction then cancel
- interrupt a cancelling transition

## Automated invariants

- movement begins before release
- the previous screen remains mounted during the gesture
- distance and velocity can independently commit
- cancellation leaves the current route intact
- a committed route updates once

## Human review

Compare directness near the edge, the reversal frame, background-screen parallax, release
continuity, and the final settle. Test around system back gestures and browser navigation on
the target device.
