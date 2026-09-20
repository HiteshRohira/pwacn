export type TracePoint = { t: number; dx: number; dy: number };

export const wait = (duration: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, duration));

export async function replayPointerTraces({
  target,
  traces,
  pauseBetweenTracesMs = 50,
  clickOnValidRelease = false,
}: {
  target: () => HTMLElement | null;
  traces: readonly (readonly TracePoint[])[];
  pauseBetweenTracesMs?: number;
  clickOnValidRelease?: boolean;
}) {
  for (const [traceIndex, trace] of traces.entries()) {
    if (traceIndex > 0) await wait(pauseBetweenTracesMs);
    const element = target();
    if (!element) throw new Error('Missing gesture target');
    const box = element.getBoundingClientRect();
    const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const pointerId = 700 + traceIndex;
    const dispatch = (type: string, point: TracePoint, buttons: number) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId,
          pointerType: 'touch',
          isPrimary: true,
          button: 0,
          buttons,
          clientX: origin.x + point.dx,
          clientY: origin.y + point.dy,
        }),
      );
    dispatch('pointerdown', trace[0]!, 1);
    let previousTime = 0;
    for (const point of trace.slice(1)) {
      await wait(Math.max(0, point.t - previousTime));
      dispatch('pointermove', point, 1);
      previousTime = point.t;
    }
    const last = trace.at(-1)!;
    dispatch('pointerup', last, 0);
    const releaseX = origin.x + last.dx;
    const releaseY = origin.y + last.dy;
    if (
      clickOnValidRelease &&
      releaseX >= box.left &&
      releaseX <= box.right &&
      releaseY >= box.top &&
      releaseY <= box.bottom
    ) {
      element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
      );
    }
  }
}
