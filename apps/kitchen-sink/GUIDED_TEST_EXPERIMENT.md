# Guided mobile test experiment

This experiment combines a real iPhone screen recording with timestamped input and pwacn feel events from the Instagram kitchen-sink route. Session data stays on the Mac in a temporary directory; do not commit it to the repository. The temporary Cloudflare tunnel relays only the session's prompts, events, and optional uploaded recording. Stop the CLI to close the tunnel.

## Run a session

1. Run `pnpm guided:session` on the Mac. It starts a local relay and a temporary HTTPS tunnel, then prints a unique mobile link and session directory.
2. Open the link on the iPhone. Start iPhone screen recording in Control Center before tapping **Start test**. The bright `SYNC` flash appears in the recording and has a matching `sync-marker` event in the log.
3. Type `prompt Explore stories for a moment` into the running CLI. The phone shows the task and logs when the user taps **Start task**. Send more prompts at any time.
4. The user can tap **Mark issue** when something feels wrong. This records a timestamp without asking them to explain it first.
5. Tap **Finish** on the phone, stop its screen recording, and choose the video to upload. Wait for **Recording received** before closing the page or relay. If upload fails, keep the recording. With the iPhone unlocked and connected by USB, open macOS **Image Capture**, select the recording, click **Download**, and type `attach /absolute/path/to/recording.mp4` in the CLI. QuickTime Player's **New Movie Recording → Screen → iPhone** may capture directly on supported setups, but verify that the preview works before starting the test.
6. Type `status` to confirm the video path and event count, then `stop` to close the relay. The CLI refuses to stop an active log with no video unless `stop --no-video` is entered. Run `pnpm guided:analyze <session directory>` to get candidate missed and repeated taps before inspecting the video.

The CLI writes `session.json`, `prompts.ndjson`, `events.ndjson`, and the recording to the printed directory. A session link contains a temporary secret: only share it with the tester. Input values are excluded from event logs, but a screen recording may show anything visible on the device. Review the recording before sharing it.

## What is captured

- Pointer positions and target geometry, clicks, scroll, visibility, and viewport size.
- Selected DOM state changes (`aria-pressed`, `aria-hidden`, `aria-expanded`, `data-pressed`, and child counts), animation and transition lifecycle events, and window errors without message contents.
- All `pwacn:feel` samples emitted by instrumented primitives.
- Prompt delivery and acknowledgment, user issue markers, and the synchronization marker.

The testing controls emit `GuidedSession` feel samples with `start`, `acknowledge-prompt`, `mark-issue`, and `finish` gestures in the `complete` state. Inspect these in `events.ndjson` as `pwacn-feel` samples or subscribe to `pwacn:feel` in the browser. The `start` control is also written as a `guided-control` event because recording listeners attach immediately after it is pressed.

The event log cannot prove that an uninstrumented animation looked right. The video provides that visual context. The experiment has not yet established diagnosis accuracy or a faster app-building workflow.
