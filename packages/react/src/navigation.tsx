import {
  gestureCoordinator,
  gestures,
  springs,
  stackReducer,
  type Presentation,
  type StackEntry,
  type StackState,
} from '@pwacn/core';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type ScreenData = { node: ReactNode };
type Navigation = {
  push: (
    node: ReactNode,
    options?: { key?: string; pathname?: string; presentation?: Presentation },
  ) => void;
  pop: () => void;
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

/** A preserved spatial stack with velocity-aware interactive back navigation. */
export function MobileStack({
  initialScreen,
  edgeBack = true,
  maxMountedScreens = 3,
  history = 'browser',
}: {
  initialScreen: ReactNode;
  edgeBack?: boolean;
  maxMountedScreens?: number;
  history?: 'browser' | 'memory';
}) {
  const reduced = usePrefersReducedMotion();
  const dragControls = useDragControls();
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
    const withTransition = (update: () => void) => {
      const documentWithTransitions = document as Document & {
        startViewTransition?: (callback: () => void) => unknown;
      };
      if (!reduced && documentWithTransitions.startViewTransition)
        documentWithTransitions.startViewTransition(update);
      else update();
    };
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
        withTransition(() => dispatch({ type: 'push', entry }));
        if (history === 'browser')
          window.history.pushState(
            { pwacn: true, pwacnKey: entry.key },
            '',
            entry.pathname,
          );
      },
      pop: () => {
        if (state.entries.length <= 1) return;
        withTransition(() => dispatch({ type: 'pop' }));
        if (history === 'browser') {
          suppressPop.current = true;
          window.history.back();
        }
      },
      replace: (node, options) => {
        const entry = makeEntry(node, options);
        entryCache.current.set(entry.key, entry);
        withTransition(() => dispatch({ type: 'replace', entry }));
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
  }, [history, makeEntry, reduced, state.entries]);
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
              <motion.div
                key={entry.key}
                ref={(node) => {
                  if (node) screenRefs.current.set(entry.key, node);
                  else screenRefs.current.delete(entry.key);
                }}
                data-pwacn-screen={active ? 'active' : 'preserved'}
                aria-hidden={!active}
                inert={!active}
                initial={
                  reduced
                    ? { opacity: 0 }
                    : { x: modal ? 0 : '100%', y: modal ? '100%' : 0 }
                }
                animate={
                  active
                    ? { x: 0, y: 0, scale: 1, opacity: 1 }
                    : {
                        x: modal ? 0 : '-24%',
                        y: 0,
                        scale: modal ? 0.96 : 1,
                        opacity: 1,
                      }
                }
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { x: modal ? 0 : '100%', y: modal ? '100%' : 0, opacity: 1 }
                }
                transition={reduced ? { duration: 0.01 } : springs.navigation}
                drag={
                  active && edgeBack && state.entries.length > 1 && !modal ? 'x' : false
                }
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.82 }}
                dragDirectionLock
                onDragEnd={(_, info) => {
                  gestureCoordinator.reset();
                  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
                  if (
                    info.offset.x > width * gestures.edgeBack.commitProgress ||
                    info.velocity.x > gestures.edgeBack.velocityThreshold
                  )
                    navigation.pop();
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  minHeight: '100%',
                  pointerEvents: active ? 'auto' : 'none',
                  overflow: 'hidden',
                  background: 'var(--pwacn-screen-background, #f2f2f7)',
                  boxShadow:
                    active && state.entries.length > 1
                      ? '-12px 0 28px rgb(0 0 0 / .14)'
                      : 'none',
                  zIndex: index,
                }}
              >
                {entry.data?.node}
                {active && edgeBack && state.entries.length > 1 && !modal ? (
                  <div
                    aria-hidden="true"
                    data-pwacn-edge-back=""
                    onPointerDown={(event) => {
                      if (
                        gestureCoordinator.claim(event.pointerId, {
                          owner: 'edge-back',
                          axis: 'x',
                          priority: 100,
                        })
                      )
                        dragControls.start(event);
                    }}
                    style={{
                      position: 'absolute',
                      inset: `0 auto 0 0`,
                      width: `max(${gestures.edgeBack.edgeWidth}px, env(safe-area-inset-left))`,
                      zIndex: 100,
                      touchAction: 'pan-y',
                    }}
                  />
                ) : null}
              </motion.div>
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
