import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MobileStack, useMobileStack } from './navigation';

function Root() {
  const stack = useMobileStack();
  return (
    <button onClick={() => stack.push(<Detail />, { pathname: '/detail' })}>Open</button>
  );
}

function Detail() {
  const stack = useMobileStack();
  return (
    <main>
      <h1>Detail</h1>
      <button onClick={() => stack.pop()}>Back</button>
    </main>
  );
}

describe('MobileStack', () => {
  it('preserves screens and supports memory navigation', async () => {
    render(<MobileStack initialScreen={<Root />} history="memory" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('heading', { name: 'Detail' })).toBeVisible();
    expect(document.querySelector('[data-pwacn-edge-back]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('button', { name: 'Open' })).toBeVisible();
  });

  it('uses same-URL browser entries unless a pathname is explicitly requested', () => {
    window.history.replaceState(null, '', '/');
    render(<MobileStack initialScreen={<Root />} history="browser" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(window.location.pathname).toBe('/detail');
  });

  it('exposes a screen gesture surface when full-screen back is requested', () => {
    render(
      <MobileStack
        initialScreen={<Root />}
        history="memory"
        backGestureRegion="screen"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(document.querySelector('[data-pwacn-back-surface]')).toBeInTheDocument();
    expect(document.querySelector('[data-pwacn-edge-back]')).not.toBeInTheDocument();
  });
});
