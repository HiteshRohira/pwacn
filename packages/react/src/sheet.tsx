import { gestures, springs } from '@pwacn/core';
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useMobileViewport } from './use-mobile-viewport';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type SheetContextValue = { close: () => void; labelId: string };
const SheetContext = createContext<SheetContextValue | null>(null);

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
}: BottomSheetProps) {
  const reduced = usePrefersReducedMotion();
  const viewport = useMobileViewport();
  const y = useMotionValue(0);
  const controls = useDragControls();
  const labelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const snap = initialSnap ?? Math.max(...snapPoints);
  const height = Math.max(240, viewport.height * snap);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => contentRef.current?.focus());
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onOpenChange(false);
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', escape);
      previousFocus.current?.focus();
    };
  }, [dismissible, onOpenChange, open]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <SheetContext.Provider value={{ close: () => onOpenChange(false), labelId }}>
          <motion.div
            className="pwacn-sheet-layer"
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={reduced ? { duration: 0.01 } : springs.sheet}
          >
            <motion.button
              type="button"
              aria-label="Close sheet"
              onClick={() => dismissible && onOpenChange(false)}
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
                background: '#f7f4ec',
                boxShadow: '0 -20px 70px rgb(0 0 0 / .2)',
                outline: 'none',
                y,
                ...style,
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={reduced ? { duration: 0.01 } : springs.sheet}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.04, bottom: gestures.sheet.dragElastic }}
              onDragEnd={(_, info) => {
                if (
                  dismissible &&
                  (info.offset.y > height * 0.22 ||
                    info.velocity.y > gestures.sheet.dismissVelocity)
                ) {
                  onOpenChange(false);
                }
              }}
            >
              <div
                className="pwacn-sheet-handle-zone"
                onPointerDown={(event) => controls.start(event)}
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
  return (
    <div
      {...props}
      data-pwacn-sheet-scroll=""
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
