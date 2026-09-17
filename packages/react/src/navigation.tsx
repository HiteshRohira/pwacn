import {
  springs,
  stackReducer,
  type Presentation,
  type StackEntry,
  type StackState,
} from '@pwacn/core';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
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
}: {
  initialScreen: ReactNode;
  edgeBack?: boolean;
  maxMountedScreens?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [state, dispatch] = useReducer(stackReducer<ScreenData>, {
    entries: [
      { key: 'root', pathname: '/', presentation: 'push', data: { node: initialScreen } },
    ],
    direction: 'replace',
  } satisfies StackState<ScreenData>);
  const makeEntry = useCallback(
    (
      node: ReactNode,
      options?: { key?: string; pathname?: string; presentation?: Presentation },
    ): StackEntry<ScreenData> => ({
      key: options?.key ?? crypto.randomUUID(),
      pathname: options?.pathname ?? window.location.pathname,
      presentation: options?.presentation ?? 'push',
      data: { node },
    }),
    [],
  );
  const navigation = useMemo<Navigation>(
    () => ({
      push: (node, options) =>
        dispatch({ type: 'push', entry: makeEntry(node, options) }),
      pop: () => dispatch({ type: 'pop' }),
      replace: (node, options) =>
        dispatch({ type: 'replace', entry: makeEntry(node, options) }),
      canGoBack: state.entries.length > 1,
    }),
    [makeEntry, state.entries.length],
  );
  const visibleEntries = state.entries.slice(-Math.max(2, maxMountedScreens));

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
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.82 }}
                dragDirectionLock
                onDragEnd={(_, info) => {
                  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
                  if (info.offset.x > width * 0.35 || info.velocity.x > 600)
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
