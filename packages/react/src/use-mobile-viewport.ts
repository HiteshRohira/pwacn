import { useEffect, useState } from 'react';

export type MobileViewport = {
  width: number;
  height: number;
  keyboardHeight: number;
  keyboardOpen: boolean;
};

function readViewport(): MobileViewport {
  if (typeof window === 'undefined')
    return { width: 0, height: 0, keyboardHeight: 0, keyboardOpen: false };
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const keyboardHeight = Math.max(
    0,
    window.innerHeight - height - (viewport?.offsetTop ?? 0),
  );
  return {
    width: viewport?.width ?? window.innerWidth,
    height,
    keyboardHeight,
    keyboardOpen: keyboardHeight > 100,
  };
}

export function useMobileViewport(): MobileViewport {
  const [state, setState] = useState(readViewport);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const next = readViewport();
      document.documentElement.style.setProperty(
        '--pwacn-viewport-height',
        `${next.height}px`,
      );
      document.documentElement.style.setProperty(
        '--pwacn-keyboard-height',
        `${next.keyboardHeight}px`,
      );
      setState(next);
    };
    update();
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, []);
  return state;
}
