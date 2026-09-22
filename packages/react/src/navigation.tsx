import {
  gestureCoordinator,
  gestures,
  springs,
  stackReducer,
  type Presentation,
  type StackEntry,
  type StackState,
} from '@pwacn/core';
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
} from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { emitFeelTelemetry } from './feel-telemetry';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type ScreenData = { node: ReactNode };
type Navigation = {
  push: (
    node: ReactNode,
    options?: { key?: string; pathname?: string; presentation?: Presentation },
  ) => void;
  pop: (options?: { interactive?: boolean }) => void;
  replace: (
    node: ReactNode,
    options?: { key?: string; pathname?: string; presentation?: Presentation },
  ) => void;
  canGoBack: boolean;
  pathname: string;
};

const NavigationContext = createContext<Navigation | null>(null);

export function useMobileStack(): Navigation {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useMobileStack must be used inside MobileStack');
  return context;
}

function StackScreen({
  entry,
  active,
  modal,
  depth,
  zIndex,
  reduced,
  edgeBack,
  backGestureRegion,
  navigation,
  screenRefs,
}: {
  entry: StackEntry<ScreenData>;
  active: boolean;
  modal: boolean;
  depth: number;
  zIndex: number;
  reduced: boolean;
  edgeBack: boolean;
  backGestureRegion: 'edge' | 'screen';
  navigation: Navigation;
  screenRefs: { current: Map<string, HTMLDivElement> };
}) {
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<{ pointerX: number; surfaceX: number } | null>(null);
  const motionState = useRef<'idle' | 'dragging' | 'settling'>('idle');
  const lastSample = useRef<{ timestamp: number; surfaceX: number } | null>(null);
  const manualDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    axis: 'x' | 'y' | null;
    responded: boolean;
  } | null>(null);
  const canDragBack = active && edgeBack && depth > 1 && !modal;

  const beginInteractiveBack = (
    event: PointerEvent<HTMLDivElement> | globalThis.PointerEvent,
  ) => {
    if (!canDragBack) return;
    if (motionState.current === 'settling') {
      emitFeelTelemetry({
        timestamp: performance.now(),
        primitive: 'InteractiveBack',
        gesture: 'edge-back',
        state: 'interrupted',
        axis: 'x',
        pointerX: event.clientX,
        surfaceX: 0,
        gestureOwner: 'edge-back',
      });
    }
    if (
      !gestureCoordinator.claim(event.pointerId, {
        owner: 'edge-back',
        axis: 'x',
        priority: 100,
      })
    )
      return;
    emitFeelTelemetry({
      timestamp: performance.now(),
      primitive: 'InteractiveBack',
      gesture: 'edge-back',
      state: 'contact',
      axis: 'x',
      pointerX: event.clientX,
      surfaceX: 0,
      gestureOwner: 'edge-back',
    });
    dragControls.start(event);
  };

  useEffect(() => {
    const node = hostRef.current;
    if (!node || !canDragBack || backGestureRegion !== 'screen') return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-pwacn-back-gesture="capture"]')) return;
      const relativeX = event.clientX - node.getBoundingClientRect().left;
      if (relativeX <= gestures.edgeBack.edgeWidth) return;
      if (
        !gestureCoordinator.claim(event.pointerId, {
          owner: 'edge-back',
          axis: 'x',
          priority: 100,
        })
      )
        return;
      manualDrag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocity: 0,
        axis: null,
        responded: false,
      };
      motionState.current = 'dragging';
      emitFeelTelemetry({
        timestamp: performance.now(),
        primitive: 'InteractiveBack',
        gesture: 'edge-back',
        state: 'contact',
        axis: 'x',
        pointerX: event.clientX,
        surfaceX: x.get(),
        gestureOwner: 'edge-back',
      });
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = manualDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.axis && Math.hypot(dx, dy) >= gestures.swipe.activationDistance)
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') {
        manualDrag.current = null;
        gestureCoordinator.release(event.pointerId, 'edge-back');
        return;
      }
      if (drag.axis !== 'x') return;
      const timestamp = performance.now();
      const elapsed = Math.max(1, timestamp - drag.lastTime);
      drag.velocity = ((event.clientX - drag.lastX) / elapsed) * 1000;
      drag.lastX = event.clientX;
      drag.lastTime = timestamp;
      const surfaceX = Math.max(0, dx);
      x.set(surfaceX);
      if (!drag.responded) {
        drag.responded = true;
        emitFeelTelemetry({
          timestamp,
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'responding',
          axis: 'x',
          pointerX: event.clientX,
          surfaceX,
          gestureOwner: 'edge-back',
        });
      }
      emitFeelTelemetry({
        timestamp,
        primitive: 'InteractiveBack',
        gesture: 'edge-back',
        state: 'dragging',
        axis: 'x',
        pointerX: event.clientX,
        surfaceX,
        pointerVelocityX: drag.velocity,
        surfaceVelocityX: x.getVelocity(),
        trackingErrorPx: Math.abs(dx - surfaceX),
        gestureOwner: 'edge-back',
      });
      event.preventDefault();
    };
    const finish = (event: globalThis.PointerEvent) => {
      const drag = manualDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      manualDrag.current = null;
      gestureCoordinator.release(event.pointerId, 'edge-back');
      if (drag.axis !== 'x') return;
      const surfaceX = x.get();
      const width = node.getBoundingClientRect().width;
      const committed =
        surfaceX > width * gestures.edgeBack.commitProgress ||
        drag.velocity > gestures.edgeBack.velocityThreshold;
      emitFeelTelemetry({
        timestamp: performance.now(),
        primitive: 'InteractiveBack',
        gesture: 'edge-back',
        state: 'releasing',
        axis: 'x',
        pointerX: event.clientX,
        surfaceX,
        pointerVelocityX: drag.velocity,
        surfaceVelocityX: x.getVelocity(),
        gestureOwner: 'edge-back',
      });
      motionState.current = 'settling';
      emitFeelTelemetry({
        timestamp: performance.now(),
        primitive: 'InteractiveBack',
        gesture: 'edge-back',
        state: 'settling',
        axis: 'x',
        surfaceX,
        surfaceVelocityX: drag.velocity,
        gestureOwner: 'edge-back',
      });
      if (committed) {
        emitFeelTelemetry({
          timestamp: performance.now(),
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'route-commit',
          axis: 'x',
          surfaceX,
          surfaceVelocityX: drag.velocity,
          gestureOwner: 'edge-back',
        });
        void animate(
          x,
          width,
          reduced
            ? { duration: 0.01 }
            : { ...springs.navigation, velocity: drag.velocity },
        ).then(() => {
          navigation.pop({ interactive: true });
          motionState.current = 'idle';
          emitFeelTelemetry({
            timestamp: performance.now(),
            primitive: 'InteractiveBack',
            gesture: 'edge-back',
            state: 'complete',
            axis: 'x',
            surfaceX: width,
            surfaceVelocityX: 0,
          });
        });
      } else {
        void animate(
          x,
          0,
          reduced
            ? { duration: 0.01 }
            : { ...springs.navigation, velocity: drag.velocity },
        ).then(() => {
          motionState.current = 'idle';
          emitFeelTelemetry({
            timestamp: performance.now(),
            primitive: 'InteractiveBack',
            gesture: 'edge-back',
            state: 'complete',
            axis: 'x',
            surfaceX: 0,
            surfaceVelocityX: 0,
          });
        });
      }
    };
    node.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  });

  return (
    <motion.div
      ref={(node) => {
        hostRef.current = node;
        if (node) screenRefs.current.set(entry.key, node);
        else screenRefs.current.delete(entry.key);
      }}
      data-pwacn-screen={active ? 'active' : 'preserved'}
      aria-hidden={!active}
      inert={!active}
      initial={
        reduced ? { opacity: 0 } : { x: modal ? 0 : '100%', y: modal ? '100%' : 0 }
      }
      animate={
        active
          ? { x: 0, y: 0, scale: 1, opacity: 1 }
          : { x: modal ? 0 : '-24%', y: 0, scale: modal ? 0.96 : 1, opacity: 1 }
      }
      exit={
        reduced
          ? { opacity: 0 }
          : { x: modal ? 0 : '100%', y: modal ? '100%' : 0, opacity: 1 }
      }
      transition={reduced ? { duration: 0.01 } : springs.navigation}
      drag={canDragBack && backGestureRegion === 'edge' ? 'x' : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.82 }}
      dragDirectionLock
      data-pwacn-back-surface={
        canDragBack && backGestureRegion === 'screen' ? '' : undefined
      }
      onDragStart={(_, info) => {
        motionState.current = 'dragging';
        lastSample.current = null;
        dragOrigin.current = { pointerX: info.point.x, surfaceX: info.offset.x };
        emitFeelTelemetry({
          timestamp: performance.now(),
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'responding',
          axis: 'x',
          pointerX: info.point.x,
          surfaceX: info.offset.x,
          pointerVelocityX: info.velocity.x,
          surfaceVelocityX: info.velocity.x,
          gestureOwner: 'edge-back',
        });
      }}
      onDrag={(_, info) => {
        const timestamp = performance.now();
        const previous = lastSample.current;
        if (previous && Math.abs(previous.surfaceX - info.offset.x) < 0.25) return;
        lastSample.current = { timestamp, surfaceX: info.offset.x };
        const origin = dragOrigin.current;
        emitFeelTelemetry({
          timestamp,
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'dragging',
          axis: 'x',
          pointerX: info.point.x,
          surfaceX: info.offset.x,
          pointerVelocityX: info.velocity.x,
          surfaceVelocityX: info.velocity.x,
          trackingErrorPx: origin
            ? info.point.x - origin.pointerX - (info.offset.x - origin.surfaceX)
            : undefined,
          gestureOwner: 'edge-back',
          frameIntervalMs: previous ? timestamp - previous.timestamp : undefined,
        });
      }}
      onDragEnd={(_, info) => {
        if (motionState.current !== 'dragging') return;
        gestureCoordinator.reset();
        motionState.current = 'settling';
        const width = hostRef.current?.getBoundingClientRect().width ?? window.innerWidth;
        const committed =
          info.offset.x > width * gestures.edgeBack.commitProgress ||
          info.velocity.x > gestures.edgeBack.velocityThreshold;
        emitFeelTelemetry({
          timestamp: performance.now(),
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'releasing',
          axis: 'x',
          pointerX: info.point.x,
          surfaceX: info.offset.x,
          pointerVelocityX: info.velocity.x,
          surfaceVelocityX: info.velocity.x,
          gestureOwner: 'edge-back',
        });
        emitFeelTelemetry({
          timestamp: performance.now(),
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'settling',
          axis: 'x',
          surfaceX: info.offset.x,
          surfaceVelocityX: info.velocity.x,
          gestureOwner: 'edge-back',
        });
        if (committed) {
          emitFeelTelemetry({
            timestamp: performance.now(),
            primitive: 'InteractiveBack',
            gesture: 'edge-back',
            state: 'route-commit',
            axis: 'x',
            pointerX: info.point.x,
            surfaceX: info.offset.x,
            pointerVelocityX: info.velocity.x,
            surfaceVelocityX: info.velocity.x,
            gestureOwner: 'edge-back',
          });
          navigation.pop({ interactive: true });
        }
      }}
      onDragTransitionEnd={() => {
        if (motionState.current !== 'settling') return;
        motionState.current = 'idle';
        emitFeelTelemetry({
          timestamp: performance.now(),
          primitive: 'InteractiveBack',
          gesture: 'edge-back',
          state: 'complete',
          axis: 'x',
          surfaceX: 0,
          surfaceVelocityX: 0,
        });
      }}
      style={{
        x: canDragBack && backGestureRegion === 'screen' ? x : undefined,
        position: 'absolute',
        inset: 0,
        minHeight: '100%',
        pointerEvents: active ? 'auto' : 'none',
        overflow: 'hidden',
        touchAction: active && backGestureRegion === 'screen' ? 'pan-y' : undefined,
        background: 'var(--pwacn-screen-background, #f2f2f7)',
        boxShadow: active && depth > 1 ? '-12px 0 28px rgb(0 0 0 / .14)' : 'none',
        zIndex,
      }}
    >
      {entry.data?.node}
      {canDragBack && backGestureRegion === 'edge' ? (
        <div
          aria-hidden="true"
          data-pwacn-edge-back=""
          onPointerDown={beginInteractiveBack}
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `max(${gestures.edgeBack.edgeWidth}px, env(safe-area-inset-left))`,
            zIndex: 100,
            touchAction: 'pan-y',
          }}
        />
      ) : null}
    </motion.div>
  );
}

/** A preserved spatial stack with velocity-aware interactive back navigation. */
export function MobileStack({
  initialScreen,
  edgeBack = true,
  backGestureRegion = 'edge',
  maxMountedScreens = 3,
  history = 'browser',
}: {
  initialScreen: ReactNode;
  edgeBack?: boolean;
  backGestureRegion?: 'edge' | 'screen';
  maxMountedScreens?: number;
  history?: 'browser' | 'memory';
}) {
  const reduced = usePrefersReducedMotion();
  const screenRefs = useRef(new Map<string, HTMLDivElement>());
  const entryCache = useRef(new Map<string, StackEntry<ScreenData>>());
  const suppressPop = useRef(false);
  const [state, dispatch] = useReducer(stackReducer<ScreenData>, {
    entries: [
      {
        key: 'root',
        pathname: typeof window === 'undefined' ? '/' : window.location.pathname,
        presentation: 'push',
        data: { node: initialScreen },
      },
    ],
    direction: 'replace',
  } satisfies StackState<ScreenData>);
  const entriesRef = useRef(state.entries);
  const rootEntry = useRef(state.entries[0]);
  entriesRef.current = state.entries;
  const makeEntry = useCallback(
    (
      node: ReactNode,
      options?: { key?: string; pathname?: string; presentation?: Presentation },
    ): StackEntry<ScreenData> => {
      const key = options?.key ?? crypto.randomUUID();
      return {
        key,
        pathname:
          options?.pathname ??
          (options?.key
            ? `/${encodeURIComponent(options.key)}`
            : window.location.pathname),
        presentation: options?.presentation ?? 'push',
        data: { node },
      };
    },
    [],
  );
  const navigation = useMemo<Navigation>(() => {
    const saveActiveScroll = () => {
      const active = state.entries.at(-1);
      const host = active ? screenRefs.current.get(active.key) : undefined;
      const scroll = host?.querySelector<HTMLElement>(
        '[data-pwacn-scroll],.settings-scroll,.detail-scroll',
      );
      if (active && scroll)
        dispatch({
          type: 'set-scroll',
          key: active.key,
          scrollPosition: scroll.scrollTop,
        });
    };
    return {
      push: (node, options) => {
        saveActiveScroll();
        const entry = makeEntry(node, options);
        entryCache.current.set(entry.key, entry);
        dispatch({ type: 'push', entry });
        if (history === 'browser')
          window.history.pushState(
            { pwacn: true, pwacnKey: entry.key },
            '',
            entry.pathname,
          );
      },
      pop: () => {
        if (state.entries.length <= 1) return;
        dispatch({ type: 'pop' });
        if (history === 'browser') {
          suppressPop.current = true;
          window.history.back();
        }
      },
      replace: (node, options) => {
        const entry = makeEntry(node, options);
        entryCache.current.set(entry.key, entry);
        dispatch({ type: 'replace', entry });
        if (history === 'browser')
          window.history.replaceState(
            { pwacn: true, pwacnKey: entry.key },
            '',
            entry.pathname,
          );
      },
      canGoBack: state.entries.length > 1,
      pathname: state.entries.at(-1)?.pathname ?? '/',
    };
  }, [history, makeEntry, state.entries]);
  const visibleEntries = state.entries.slice(-Math.max(2, maxMountedScreens));

  useEffect(() => {
    if (history !== 'browser') return;
    const root = rootEntry.current;
    if (root) entryCache.current.set(root.key, root);
    window.history.replaceState(
      { ...(window.history.state ?? {}), pwacn: true, pwacnKey: root?.key },
      '',
    );
    const onPopState = (event: PopStateEvent) => {
      if (suppressPop.current) {
        suppressPop.current = false;
        return;
      }
      const targetKey = event.state?.pwacnKey as string | undefined;
      const entries = entriesRef.current;
      const currentIndex = entries.findIndex((entry) => entry.key === targetKey);
      if (currentIndex >= 0 && currentIndex < entries.length - 1) {
        dispatch({ type: 'pop' });
        return;
      }
      const cached = targetKey ? entryCache.current.get(targetKey) : undefined;
      if (cached) dispatch({ type: 'push', entry: cached });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [history]);

  const activeEntry = state.entries.at(-1);
  useLayoutEffect(() => {
    if (!activeEntry) return;
    const frame = requestAnimationFrame(() => {
      const host = screenRefs.current.get(activeEntry.key);
      const scroll = host?.querySelector<HTMLElement>(
        '[data-pwacn-scroll],.settings-scroll,.detail-scroll',
      );
      if (scroll) scroll.scrollTop = activeEntry.scrollPosition ?? 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeEntry]);

  return (
    <NavigationContext.Provider value={navigation}>
      <div
        data-pwacn-stack=""
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleEntries.map((entry, index) => {
            const active = index === visibleEntries.length - 1;
            const modal = entry.presentation === 'modal';
            return (
              <StackScreen
                key={entry.key}
                entry={entry}
                active={active}
                modal={modal}
                depth={state.entries.length}
                zIndex={index}
                reduced={reduced}
                edgeBack={edgeBack}
                backGestureRegion={backGestureRegion}
                navigation={navigation}
                screenRefs={screenRefs}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </NavigationContext.Provider>
  );
}

export function SharedElement({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div style={{ viewTransitionName: `pwacn-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}` }}>
      {children}
    </div>
  );
}
