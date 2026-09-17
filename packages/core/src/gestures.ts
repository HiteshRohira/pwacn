/** Experimental gesture thresholds. Tune on physical mobile hardware. */
export const gestures = {
  press: { movementTolerance: 8 },
  swipe: {
    activationDistance: 8,
    commitDistance: 0.35,
    velocityThreshold: 650,
  },
  sheet: { dragElastic: 0.12, dismissVelocity: 900, snapVelocity: 500 },
  edgeBack: { edgeWidth: 24, commitProgress: 0.4, velocityThreshold: 600 },
} as const;

export type Axis = 'x' | 'y';

export function movementDistance(
  start: { x: number; y: number },
  current: { x: number; y: number },
): number {
  return Math.hypot(current.x - start.x, current.y - start.y);
}

export function directionLock(
  deltaX: number,
  deltaY: number,
  threshold: number = gestures.swipe.activationDistance,
): Axis | null {
  if (Math.hypot(deltaX, deltaY) < threshold) return null;
  return Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
}

export function shouldCommitGesture({
  progress,
  velocity,
  progressThreshold,
  velocityThreshold,
}: {
  progress: number;
  velocity: number;
  progressThreshold: number;
  velocityThreshold: number;
}): boolean {
  return progress >= progressThreshold || velocity >= velocityThreshold;
}

export function applyElasticBoundary(
  value: number,
  min: number,
  max: number,
  elasticity: number,
): number {
  if (value < min) return min - (min - value) * elasticity;
  if (value > max) return max + (value - max) * elasticity;
  return value;
}
