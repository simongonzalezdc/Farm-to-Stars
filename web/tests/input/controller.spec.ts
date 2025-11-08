import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { wireBuildControls, type BuildControlHandlers } from '../../src/input/buildControls.ts';

class StubKeyboard {
  private listeners = new Map<string, Set<() => void>>();

  on(event: string, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: () => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }
}

class StubGamepad {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

describe('wireBuildControls', () => {
  function createHandlers(): BuildControlHandlers {
    return {
      onRotate: vi.fn(),
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };
  }

  it('wires keyboard bindings and removes them on cleanup', () => {
    const keyboard = new StubKeyboard();
    const scene = {
      input: { keyboard, gamepad: undefined }
    } as unknown as Phaser.Scene;
    const handlers = createHandlers();

    const dispose = wireBuildControls(scene, handlers);

    keyboard.emit('keydown-Q');
    keyboard.emit('keydown-E');
    keyboard.emit('keydown-ENTER');
    keyboard.emit('keydown-ESC');

    expect(handlers.onRotate).toHaveBeenCalledWith(-1);
    expect(handlers.onRotate).toHaveBeenCalledWith(1);
    expect(handlers.onRotate).toHaveBeenCalledTimes(2);
    expect(handlers.onConfirm).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);

    dispose();

    keyboard.emit('keydown-Q');
    expect(handlers.onRotate).toHaveBeenCalledTimes(2);
  });

  it('routes gamepad button presses to handlers', () => {
    const keyboard = undefined;
    const gamepad = new StubGamepad();
    const scene = {
      input: { keyboard, gamepad }
    } as unknown as Phaser.Scene;
    const handlers = createHandlers();

    const dispose = wireBuildControls(scene, handlers);

    const pad = {};
    const button = (index: number) => ({ index });

    gamepad.emit('down', pad, button(4), 1);
    gamepad.emit('down', pad, button(5), 1);
    gamepad.emit('down', pad, button(14), 1);
    gamepad.emit('down', pad, button(15), 1);
    gamepad.emit('down', pad, button(6), 0.4);
    gamepad.emit('down', pad, button(6), 0.6);
    gamepad.emit('down', pad, button(7), 0.7);
    gamepad.emit('down', pad, button(2), 1);
    gamepad.emit('down', pad, button(3), 1);
    gamepad.emit('down', pad, button(0), 1);
    gamepad.emit('down', pad, button(1), 1);

    expect(handlers.onRotate).toHaveBeenCalledTimes(8);
    expect(handlers.onConfirm).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);

    dispose();

    gamepad.emit('down', pad, button(4), 1);
    expect(handlers.onRotate).toHaveBeenCalledTimes(8);
  });
});
