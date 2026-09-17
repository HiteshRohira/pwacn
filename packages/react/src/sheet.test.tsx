import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
