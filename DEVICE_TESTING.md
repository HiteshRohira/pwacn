# Device validation

Automated coverage runs the playground and Settings benchmark using iPhone Safari,
Pixel Chrome, and Galaxy Chrome device profiles. This catches viewport, pointer,
touch-target, history, and WebKit differences before release.

Physical-device release checks:

1. Install the kitchen-sink PWA from Safari on a current iPhone and one older iPhone.
2. Install it from Chrome on a Pixel-class Android device and test once in Samsung Internet.
3. Verify sheet snap points, nested scrolling, keyboard resizing, and focus restoration.
4. Verify edge-back does not steal horizontal controls away from the leading edge.
5. Test VoiceOver and TalkBack traversal, switch announcements, dialogs, and focus return.
6. Enable Reduce Motion, Increase Contrast, 200% text, dark appearance, and landscape.
7. Record the device, OS, browser, install mode, and any token adjustment in `ux-research`.

The automated matrix is a release gate. Physical checks remain a release-owner sign-off
because browsers cannot emulate hardware haptics, display latency, thumb reach, or assistive
technology speech accurately.
