import { gestures, movementDistance, springForMass, type MassClass } from '@pwacn/core';
import { motion } from 'motion/react';
import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type PressFeedback = 'scale' | 'opacity' | 'none';

export interface PressableProps {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  mass?: MassClass;
  feedback?: PressFeedback;
  movementTolerance?: number;
  onPress?: (event: MouseEvent<HTMLElement>) => void;
  onPressStart?: () => void;
  onPressEnd?: (cancelled: boolean) => void;
  onFeedback?: () => void;
  type?: 'button' | 'submit' | 'reset';
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-checked'?: boolean;
  [key: `data-${string}`]: string | number | boolean | undefined;
}

type Point = { x: number; y: number };

export const Pressable = forwardRef<HTMLElement, PressableProps>(function Pressable(
  {
    as: Component = 'button',
    children,
    className,
    style,
    disabled = false,
    mass = 'control',
    feedback = 'scale',
    movementTolerance = gestures.press.movementTolerance,
    onPress,
    onPressStart,
    onPressEnd,
    onFeedback,
    type,
    role,
    tabIndex,
    ...rest
  },
  forwardedRef,
) {
  const MotionComponent = useMemo(() => motion.create(Component), [Component]);
  const reducedMotion = usePrefersReducedMotion();
  const [pressed, setPressed] = useState(false);
  const pointerId = useRef<number | null>(null);
  const start = useRef<Point | null>(null);
  const cancelled = useRef(false);

  const finish = (wasCancelled: boolean) => {
    if (!pressed && pointerId.current === null) return;
    setPressed(false);
    pointerId.current = null;
    start.current = null;
    cancelled.current = wasCancelled;
    onPressEnd?.(wasCancelled);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (disabled || event.button !== 0) return;
    pointerId.current = event.pointerId;
    start.current = { x: event.clientX, y: event.clientY };
    cancelled.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPressed(true);
    onFeedback?.();
    onPressStart?.();
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (pointerId.current !== event.pointerId || !start.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    const dragged =
      movementDistance(start.current, { x: event.clientX, y: event.clientY }) >
      movementTolerance;
    if (outside || dragged) finish(true);
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled || cancelled.current) {
      event.preventDefault();
      cancelled.current = false;
      return;
    }
    onPress?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled || event.repeat || !['Enter', ' '].includes(event.key)) return;
    setPressed(true);
    onFeedback?.();
    onPressStart?.();
    if (Component !== 'button') event.preventDefault();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled || !['Enter', ' '].includes(event.key)) return;
    setPressed(false);
    onPressEnd?.(false);
    if (Component !== 'button') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  const animate = reducedMotion
    ? { opacity: pressed && feedback !== 'none' ? 0.72 : 1 }
    : {
        scale: pressed && feedback === 'scale' ? 0.965 : 1,
        opacity: pressed && feedback === 'opacity' ? 0.62 : 1,
      };

  const semanticProps =
    Component === 'button'
      ? { disabled, type: type ?? 'button', role }
      : {
          'aria-disabled': disabled || undefined,
          role: role ?? 'button',
          tabIndex: disabled ? -1 : (tabIndex ?? 0),
        };

  return (
    <MotionComponent
      ref={forwardedRef}
      className={className}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style,
      }}
      animate={animate}
      transition={reducedMotion ? { duration: 0.01 } : springForMass('press', mass)}
      data-pressed={pressed || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event: PointerEvent<HTMLElement>) => {
        if (pointerId.current === event.pointerId) finish(cancelled.current);
      }}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => {
        if (pointerId.current !== null) finish(true);
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      {...semanticProps}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
});
