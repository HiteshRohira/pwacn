import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SwipeTabs } from './swipe-tabs';

class ResizeObserverMock {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  disconnect() {}
  unobserve() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

const items = [
  { value: 'discover', label: 'Discover', content: <p>Discover feed</p> },
  { value: 'following', label: 'Following', content: <p>Following feed</p> },
] as const;

function Fixture() {
  const [value, setValue] = useState<'discover' | 'following'>('discover');
  return <SwipeTabs value={value} onValueChange={setValue} items={[...items]} />;
}

describe('SwipeTabs', () => {
  it('connects tabs to panels and hides the inactive panel from interaction', () => {
    render(<Fixture />);
    const discover = screen.getByRole('tab', { name: 'Discover' });
    const following = screen.getByRole('tab', { name: 'Following' });
    expect(discover).toHaveAttribute('aria-selected', 'true');
    expect(discover).toHaveAttribute('tabindex', '0');
    expect(following).toHaveAttribute('tabindex', '-1');
    expect(
      document.getElementById(discover.getAttribute('aria-controls')!),
    ).toHaveAttribute('aria-hidden', 'false');
    expect(
      document.getElementById(following.getAttribute('aria-controls')!),
    ).toHaveAttribute('inert');
  });

  it('selects and focuses adjacent tabs with arrow keys', async () => {
    render(<Fixture />);
    const discover = screen.getByRole('tab', { name: 'Discover' });
    discover.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Following' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Following' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('commits a horizontal drag and ignores a vertical gesture', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    const onValueChange = vi.fn();
    const { container } = render(
      <SwipeTabs value="discover" onValueChange={onValueChange} items={[...items]} />,
    );
    const viewport = container.querySelector('.pwacn-tab-viewport') as HTMLDivElement;
    fireEvent.pointerDown(viewport, {
      pointerId: 1,
      button: 0,
      clientX: 350,
      clientY: 200,
    });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 120, clientY: 205 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 120, clientY: 205 });
    expect(onValueChange).toHaveBeenCalledWith('following');

    onValueChange.mockClear();
    fireEvent.pointerDown(viewport, {
      pointerId: 2,
      button: 0,
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 195, clientY: 180 });
    fireEvent.pointerUp(viewport, { pointerId: 2, clientX: 195, clientY: 180 });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
