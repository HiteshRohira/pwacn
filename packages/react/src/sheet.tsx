import {
  gestureCoordinator,
  gestures,
  haptics,
  shouldSheetCaptureScroll,
  sounds,
  springs,
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
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useMobileViewport } from './use-mobile-viewport';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type SheetContextValue = {
  close: () => void;
  labelId: string;
  beginDrag: (event: React.PointerEvent) => void;
};
const SheetContext = createContext<SheetContextValue | null>(null);

const normalizeSnapPoints = (key: string) =>
  [
    ...new Set(key.split(',').map((point) => Math.min(1, Math.max(0.15, Number(point))))),
  ].sort((a, b) => b - a);

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  className?: string;
  style?: CSSProperties;
  dismissible?: boolean;
  onSnapChange?: (snapPoint: number) => void;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title = 'Sheet',
  snapPoints = [0.55, 0.9],
  initialSnap,
  className,
  style,
  dismissible = true,
  onSnapChange,
}: BottomSheetProps) {
  const reduced = usePrefersReducedMotion();
  const viewport = useMobileViewport();
  const y = useMotionValue(0);
  const controls = useDragControls();
  const labelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const snapPointsKey = snapPoints.join(',');
  const normalizedSnaps = useMemo(
    () => normalizeSnapPoints(snapPointsKey),
    [snapPointsKey],
  );
  const [snap, setSnap] = useState(initialSnap ?? normalizedSnaps[0] ?? 0.9);
  const height = Math.max(240, viewport.height * (normalizedSnaps[0] ?? 0.9));
  const snapOffset = useCallback(
    (point: number) => Math.max(0, height - viewport.height * point),
    [height, viewport.height],
  );
  const settle = useCallback(
    (nextSnap: number) => {
      setSnap(nextSnap);
      onSnapChange?.(nextSnap);
      animate(y, snapOffset(nextSnap), reduced ? { duration: 0.01 } : springs.sheet);
    },
    [onSnapChange, reduced, snapOffset, y],
  );
  const close = useCallback(() => {
    sounds.play('close');
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const next = initialSnap ?? normalizedSnaps[0] ?? 0.9;
    setSnap(next);
    y.set(height);
    const frame = requestAnimationFrame(() => {
      sounds.play('open');
      animate(y, snapOffset(next), reduced ? { duration: 0.01 } : springs.sheet);
    });
    return () => cancelAnimationFrame(frame);
  }, [height, initialSnap, normalizedSnaps, open, reduced, snapOffset, y]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    const portalRoot = contentRef.current?.closest('.pwacn-sheet-layer');
    const siblings = [...document.body.children].filter((node) => node !== portalRoot);
    const previous = siblings.map((node) => ({
      node: node as HTMLElement,
      inert: (node as HTMLElement).inert,
      hidden: node.getAttribute('aria-hidden'),
    }));
    siblings.forEach((node) => {
      (node as HTMLElement).inert = true;
      node.setAttribute('aria-hidden', 'true');
    });
    document.documentElement.dataset.pwacnSheetOpen = '';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => contentRef.current?.focus());
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) close();
      if (event.key !== 'Tab' || !contentRef.current) return;
      const focusable = [
        ...contentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return event.preventDefault();
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.pwacnSheetOpen;
      previous.forEach(({ node, inert, hidden }) => {
        node.inert = inert;
        if (hidden === null) node.removeAttribute('aria-hidden');
        else node.setAttribute('aria-hidden', hidden);
      });
      document.removeEventListener('keydown', escape);
      previousFocus.current?.focus();
    };
  }, [close, dismissible, open]);

  const beginDrag = (event: ReactPointerEvent) => {
    if (
      !gestureCoordinator.claim(event.pointerId, {
        owner: 'sheet',
        axis: 'y',
        priority: 20,
      })
    )
      return;
    controls.start(event);
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <SheetContext.Provider value={{ close, labelId, beginDrag }}>
          <motion.div
            className="pwacn-sheet-layer"
            style={{
              position: 'fixed',
              top: viewport.offsetTop,
              right: 0,
              left: 0,
              height: viewport.height,
              zIndex: 1000,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={reduced ? { duration: 0.01 } : springs.sheet}
          >
            <motion.button
              type="button"
              aria-label="Close sheet"
              onClick={() => dismissible && close()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.2 }}
              style={{
                position: 'absolute',
                inset: 0,
                border: 0,
                background: 'rgb(0 0 0 / .42)',
              }}
            />
            <motion.div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelId}
              tabIndex={-1}
              className={className}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height,
                maxHeight:
                  'calc(var(--pwacn-viewport-height, 100dvh) - env(safe-area-inset-top))',
                paddingBottom: 'env(safe-area-inset-bottom)',
                borderRadius: '24px 24px 0 0',
                color: 'var(--pwacn-sheet-foreground, CanvasText)',
                background: 'var(--pwacn-sheet-background, Canvas)',
                boxShadow: '0 -20px 70px rgb(0 0 0 / .2)',
                outline: 'none',
                y,
                ...style,
              }}
              initial={false}
              exit={{ y: height }}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: height }}
              dragElastic={{ top: 0.04, bottom: gestures.sheet.dragElastic }}
              onDragEnd={(_, info) => {
                gestureCoordinator.reset();
                const current = y.get();
                const projected = current + info.velocity.y * 0.16;
                const lowest = snapOffset(normalizedSnaps.at(-1) ?? snap);
                if (
                  dismissible &&
                  (projected > Math.max(lowest + 110, height * 0.82) ||
                    info.velocity.y > gestures.sheet.dismissVelocity)
                ) {
                  haptics.impact('light');
                  close();
                  return;
                }
                const next = normalizedSnaps.reduce((nearest, point) =>
                  Math.abs(snapOffset(point) - projected) <
                  Math.abs(snapOffset(nearest) - projected)
                    ? point
                    : nearest,
                );
                if (next !== snap) haptics.selection();
                settle(next);
              }}
            >
              <div
                className="pwacn-sheet-handle-zone"
                onPointerDown={beginDrag}
                style={{ padding: '10px 0 14px', cursor: 'grab', touchAction: 'none' }}
              >
                <div
                  style={{
                    width: 42,
                    height: 5,
                    borderRadius: 9,
                    background: 'rgb(0 0 0 / .22)',
                    margin: 'auto',
                  }}
                />
              </div>
              <h2
                id={labelId}
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                }}
              >
                {title}
              </h2>
              {children}
            </motion.div>
          </motion.div>
        </SheetContext.Provider>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function SheetScrollArea(props: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(SheetContext);
  const pointer = useRef<{ id: number; y: number } | null>(null);
  return (
    <div
      {...props}
      data-pwacn-sheet-scroll=""
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        pointer.current = { id: event.pointerId, y: event.clientY };
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        const start = pointer.current;
        if (!start || start.id !== event.pointerId) return;
        const target = event.currentTarget;
        if (
          shouldSheetCaptureScroll({
            scrollTop: target.scrollTop,
            deltaY: event.clientY - start.y,
          })
        ) {
          context?.beginDrag(event);
          pointer.current = null;
        }
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        pointer.current = null;
        gestureCoordinator.release(event.pointerId, 'scroll');
      }}
      style={{
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        ...props.style,
      }}
    />
  );
}

export function SheetClose({ children, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(SheetContext);
  return (
    <button {...props} type="button" onClick={context?.close}>
      {children}
    </button>
  );
}

export interface ActionSheetItem {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function ActionSheet({
  items,
  ...props
}: Omit<BottomSheetProps, 'children'> & { items: ActionSheetItem[] }) {
  return (
    <BottomSheet {...props} initialSnap={Math.min(0.75, 0.2 + items.length * 0.1)}>
      <div style={{ padding: '0 18px 18px' }}>
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              props.onOpenChange(false);
            }}
            style={{
              width: '100%',
              minHeight: 54,
              border: 0,
              borderBottom: '1px solid rgb(0 0 0 / .12)',
              background: 'transparent',
              color: item.destructive ? '#d83220' : 'inherit',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

export function FullScreenModal(props: BottomSheetProps) {
  return (
    <BottomSheet
      {...props}
      snapPoints={[1]}
      initialSnap={1}
      style={{ borderRadius: 0, ...props.style }}
    />
  );
}
