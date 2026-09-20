# Pressable benchmark

## Reference behavior

Feedback starts at contact, remains stable while held, clears outside the valid region, and
can be restored when the same pointer returns. Activation is decided at release and occurs
at most once.

## Canonical scenarios

- quick tap
- slow press
- drag away
- drag away and back
- rapid repeat during release

## Automated invariants

- contact precedes response
- drag-away does not activate
- drag-back restores response and activates once
- rapid repeat leaves no stuck pressed state
- keyboard activation preserves native button semantics

## Human review

Compare the first visible response, held-state stability, and release rebound against the
native reference. Record device, OS, refresh rate, reduced-motion state, and browser.
