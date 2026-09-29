import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { emitFeelTelemetry } from '@pwacn/react';
import './guided-session.css';

type Configuration = { relay: string; session: string; token: string };
type TestEvent = Record<string, unknown>;
type Prompt = { sequence: number; text: string };

function configuration(): Configuration | null {
  const query = new URLSearchParams(window.location.search);
  if (query.get('guided') !== '1') return null;
  const relay = query.get('relay');
  const session = query.get('session');
  const token = query.get('token');
  if (!relay || !session || !token) return null;
  try {
    const url = new URL(relay);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.trycloudflare.com'))
      return null;
    return { relay: url.origin, session, token };
  } catch {
    return null;
  }
}

function describe(target: EventTarget | null) {
  if (!(target instanceof Element)) return { tag: 'unknown' };
  const element = target.closest('[aria-label], button, a, [role]') ?? target;
  const box = element.getBoundingClientRect();
  return {
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute('role'),
    label: element.getAttribute('aria-label')?.slice(0, 100),
    id: element.id || undefined,
    className:
      typeof element.className === 'string' ? element.className.slice(0, 120) : undefined,
    rect: {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    },
  };
}

function endpoint(config: Configuration, path: string) {
  const url = new URL(path, config.relay);
  url.searchParams.set('session', config.session);
  url.searchParams.set('token', config.token);
  return url.toString();
}

function GuidedSessionActive({ config }: { config: Configuration }) {
  const [phase, setPhase] = useState<'intro' | 'testing' | 'finished'>('intro');
  const [prompt, setPrompt] = useState<Prompt>({ sequence: 0, text: '' });
  const [acknowledged, setAcknowledged] = useState(0);
  const [status, setStatus] = useState('Connecting…');
  const [uploadStatus, setUploadStatus] = useState('');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [marker, setMarker] = useState(false);
  const events = useRef<TestEvent[]>([]);
  const lastMove = useRef(0);
  const lastScroll = useRef(0);
  const sending = useRef(false);
  const markerTimer = useRef(0);

  const record = useCallback((type: string, details: TestEvent = {}) => {
    events.current.push({
      type,
      time: performance.now(),
      epoch: Date.now(),
      viewport: { width: innerWidth, height: innerHeight },
      ...details,
    });
  }, []);
  const emitControl = (gesture: string) => {
    emitFeelTelemetry({
      timestamp: performance.now(),
      primitive: 'GuidedSession',
      gesture,
      state: 'complete',
    });
    record('guided-control', { gesture });
  };

  const flush = useCallback(async () => {
    if (sending.current || !events.current.length) return;
    sending.current = true;
    const batch = events.current.splice(0, 100);
    try {
      const response = await fetch(endpoint(config, '/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
      if (!response.ok) throw new Error('Relay unavailable');
      setStatus('Connected');
    } catch {
      events.current.unshift(...batch);
      setStatus('Reconnecting…');
    } finally {
      sending.current = false;
    }
  }, [config]);

  useEffect(() => {
    if (phase !== 'testing') return;
    record('session-start', { userAgent: navigator.userAgent });
    const onPointer = (event: PointerEvent) => {
      if ((event.target as Element)?.closest?.('.pwacn-guided-ui')) return;
      if (event.type === 'pointermove') {
        if (performance.now() - lastMove.current < 24) return;
        lastMove.current = performance.now();
      }
      const target = describe(event.target);
      const rect = target.rect;
      record(event.type, {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        relativeX: rect ? Math.round(event.clientX - rect.x) : null,
        relativeY: rect ? Math.round(event.clientY - rect.y) : null,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target,
      });
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element)?.closest?.('.pwacn-guided-ui')) return;
      record('click', {
        x: event.clientX,
        y: event.clientY,
        target: describe(event.target),
      });
    };
    const onScroll = (event: Event) => {
      if (performance.now() - lastScroll.current < 90) return;
      lastScroll.current = performance.now();
      const target = event.target;
      if (!(target instanceof Element)) return;
      record('scroll', {
        target: describe(target),
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
      });
    };
    const onFeel = (event: Event) =>
      record('pwacn-feel', { sample: (event as CustomEvent).detail });
    const onMotion = (event: Event) => {
      if ((event.target as Element)?.closest?.('.pwacn-guided-ui')) return;
      const motion = event as AnimationEvent & TransitionEvent;
      record(event.type, {
        target: describe(event.target),
        name: motion.animationName || motion.propertyName,
      });
    };
    const onVisibility = () => record('visibility', { hidden: document.hidden });
    const onError = () => record('window-error');
    const onRejection = () => record('unhandled-rejection');
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if ((mutation.target as Element)?.closest?.('.pwacn-guided-ui')) continue;
        record('dom-change', {
          target: describe(mutation.target),
          attribute: mutation.attributeName,
          added: mutation.addedNodes.length,
          removed: mutation.removedNodes.length,
        });
      }
    });
    observer.observe(document.getElementById('root')!, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'aria-hidden', 'aria-expanded', 'data-pressed'],
      childList: true,
    });
    for (const name of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
      document.addEventListener(name, onPointer as EventListener, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('pwacn:feel', onFeel);
    for (const name of [
      'animationstart',
      'animationend',
      'transitionrun',
      'transitionend',
    ])
      document.addEventListener(name, onMotion, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    const timer = window.setInterval(() => void flush(), 500);
    return () => {
      record('session-stop');
      void flush();
      observer.disconnect();
      for (const name of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
        document.removeEventListener(name, onPointer as EventListener, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('pwacn:feel', onFeel);
      for (const name of [
        'animationstart',
        'animationend',
        'transitionrun',
        'transitionend',
      ])
        document.removeEventListener(name, onMotion, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.clearInterval(timer);
    };
  }, [phase, record, flush]);

  useEffect(() => {
    if (phase !== 'testing') return;
    const poll = async () => {
      try {
        const response = await fetch(endpoint(config, '/api/prompt'), {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Relay unavailable');
        const incoming = (await response.json()) as Prompt;
        setPrompt((current) => {
          if (incoming.sequence > current.sequence) {
            record('prompt-delivered', { sequence: incoming.sequence });
            return incoming;
          }
          return current;
        });
        setStatus('Connected');
      } catch {
        setStatus('Reconnecting…');
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 1000);
    return () => window.clearInterval(timer);
  }, [phase, config, record]);

  const start = () => {
    emitControl('start');
    setPhase('testing');
    setMarker(true);
    record('sync-marker');
    markerTimer.current = window.setTimeout(() => setMarker(false), 1400);
  };
  const stop = () => {
    emitControl('finish');
    window.clearTimeout(markerTimer.current);
    setPhase('finished');
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadStatus('Uploading recording…');
    try {
      const response = await fetch(endpoint(config, '/api/video'), {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'video/quicktime' },
        body: file,
      });
      if (!response.ok) throw new Error('Upload failed');
      setUploadStatus('Recording received');
    } catch {
      setUploadStatus('Upload failed. Keep the recording and try again.');
    }
  };

  return (
    <div className="pwacn-guided-ui">
      {marker && (
        <div className="pwacn-guided-marker" aria-hidden="true">
          SYNC
        </div>
      )}
      {phase === 'intro' && (
        <div className="pwacn-guided-backdrop">
          <section className="pwacn-guided-card" aria-label="Guided test setup">
            <span className="pwacn-guided-eyebrow">PWACN LAB</span>
            <h1>Guided mobile test</h1>
            <p>
              Start your iPhone screen recording in Control Center, then return here and
              tap Start. The agent will send small tasks to this screen.
            </p>
            <p>
              Touches, gestures, UI changes, and pwacn motion events are logged. Input
              values are not logged; the video can show whatever is on screen.
            </p>
            <button onClick={start}>Start test</button>
          </section>
        </div>
      )}
      {phase === 'testing' && (
        <>
          <div className="pwacn-guided-status">
            <span className="pwacn-guided-dot" />
            <button
              aria-label={controlsOpen ? 'Close test controls' : 'Open test controls'}
              onClick={() => setControlsOpen((current) => !current)}
            >
              {controlsOpen ? '×' : 'Test'}
            </button>
            {controlsOpen && (
              <div className="pwacn-guided-controls">
                <span>{status}</span>
                <button
                  onClick={() => {
                    emitControl('mark-issue');
                    record('user-mark', { prompt: prompt.sequence });
                    setControlsOpen(false);
                  }}
                >
                  Mark issue
                </button>
                <button onClick={stop}>Finish</button>
              </div>
            )}
          </div>
          {prompt.sequence > acknowledged && (
            <div className="pwacn-guided-backdrop">
              <section className="pwacn-guided-card" aria-label="Next testing task">
                <span className="pwacn-guided-eyebrow">TASK {prompt.sequence}</span>
                <h2>{prompt.text}</h2>
                <button
                  onClick={() => {
                    emitControl('acknowledge-prompt');
                    record('prompt-acknowledged', { sequence: prompt.sequence });
                    setAcknowledged(prompt.sequence);
                  }}
                >
                  Start task
                </button>
              </section>
            </div>
          )}
        </>
      )}
      {phase === 'finished' && (
        <div className="pwacn-guided-backdrop">
          <section className="pwacn-guided-card" aria-label="Finish guided test">
            <span className="pwacn-guided-eyebrow">SESSION COMPLETE</span>
            <h2>Thanks for testing</h2>
            <p>
              Stop your iPhone screen recording. Select the saved video here so it can be
              lined up with the gesture log.
            </p>
            <label className="pwacn-guided-upload">
              Choose screen recording
              <input type="file" accept="video/*" onChange={upload} />
            </label>
            <small>
              {uploadStatus || 'If the Mac recorded the screen, you can skip this step.'}
            </small>
          </section>
        </div>
      )}
    </div>
  );
}

export function GuidedSession() {
  const config = useMemo(configuration, []);
  return config ? <GuidedSessionActive config={config} /> : null;
}
