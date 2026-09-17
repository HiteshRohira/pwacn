import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { BottomSheet } from './sheet';

describe('BottomSheet', () => {
  it('renders accessible modal semantics and dismisses with Escape', () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Comments">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Comments' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not mount content while closed', () => {
    render(
      <BottomSheet open={false} onOpenChange={() => undefined} title="Comments">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('traps tab focus and restores focus when dismissed', () => {
    const Wrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <BottomSheet open={open} onOpenChange={setOpen} title="Actions">
            <button>First</button>
            <button>Last</button>
          </BottomSheet>
        </>
      );
    };
    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });
});
