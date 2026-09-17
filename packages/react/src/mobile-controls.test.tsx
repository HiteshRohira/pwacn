import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileSwitch, SegmentedControl } from './mobile-controls';

describe('mobile controls', () => {
  it('exposes switch state and changes it', () => {
    const change = vi.fn();
    render(<MobileSwitch label="Wi-Fi" checked={false} onCheckedChange={change} />);
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(control).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(control);
    expect(change).toHaveBeenCalledWith(true);
  });

  it('exposes mutually exclusive segments', () => {
    const change = vi.fn();
    render(
      <SegmentedControl
        label="Period"
        value="day"
        onValueChange={change}
        items={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Week' }));
    expect(change).toHaveBeenCalledWith('week');
  });
});
