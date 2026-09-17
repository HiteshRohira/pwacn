import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pressable } from './pressable';

describe('Pressable', () => {
  it('exposes immediate pointer-down feedback and releases', () => {
    render(<Pressable>Save</Pressable>);
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    expect(button).toHaveAttribute('data-pressed', 'true');
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('invokes onPress for an accessible keyboard activation', async () => {
    const onPress = vi.fn();
    render(<Pressable onPress={onPress}>Save</Pressable>);
    await userEvent.setup().tab();
    await userEvent.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onPress while disabled', async () => {
    const onPress = vi.fn();
    render(
      <Pressable disabled onPress={onPress}>
        Save
      </Pressable>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('adds button semantics to a custom element', () => {
    render(<Pressable as="div">Card</Pressable>);
    expect(screen.getByRole('button', { name: 'Card' })).toHaveAttribute('tabindex', '0');
  });
});
