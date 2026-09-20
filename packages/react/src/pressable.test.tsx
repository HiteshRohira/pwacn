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

  it('cancels outside movement and restores a press when the pointer returns', () => {
    const onPress = vi.fn();
    render(<Pressable onPress={onPress}>Save</Pressable>);
    const button = screen.getByRole('button', { name: 'Save' });
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(button, { pointerId: 7, button: 0, clientX: 50, clientY: 25 });
    fireEvent.pointerMove(button, { pointerId: 7, clientX: 130, clientY: 25 });
    expect(button).not.toHaveAttribute('data-pressed');
    fireEvent.pointerMove(button, { pointerId: 7, clientX: 50, clientY: 25 });
    expect(button).toHaveAttribute('data-pressed', 'true');
    fireEvent.pointerUp(button, { pointerId: 7, clientX: 50, clientY: 25 });
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('adds button semantics to a custom element', () => {
    render(<Pressable as="div">Card</Pressable>);
    expect(screen.getByRole('button', { name: 'Card' })).toHaveAttribute('tabindex', '0');
  });
});
