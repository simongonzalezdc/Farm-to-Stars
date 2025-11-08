import Phaser from 'phaser';

export interface BuildControlHandlers {
  onRotate(delta: number): void;
  onConfirm(): void;
  onCancel(): void;
}

export function wireBuildControls(scene: Phaser.Scene, handlers: BuildControlHandlers): () => void {
  const cleanups: Array<() => void> = [];

  const keyboard = scene.input.keyboard;
  if (keyboard) {
    const bindKey = (event: string, callback: () => void) => {
      const wrapped = () => callback();
      keyboard.on(event, wrapped);
      cleanups.push(() => keyboard.off(event, wrapped));
    };

    const rotationKeys: Array<[string, number]> = [
      ['keydown-Q', -1],
      ['keydown-E', 1],
      ['keydown-R', 1],
      ['keydown-Z', -1],
      ['keydown-X', 1],
      ['keydown-LEFT', -1],
      ['keydown-RIGHT', 1]
    ];

    for (const [event, delta] of rotationKeys) {
      bindKey(event, () => handlers.onRotate(delta));
    }

    const confirmKeys = ['keydown-ENTER', 'keydown-NUMPAD_ENTER', 'keydown-SPACE'];
    for (const event of confirmKeys) {
      bindKey(event, () => handlers.onConfirm());
    }

    const cancelKeys = ['keydown-ESC', 'keydown-BACKSPACE'];
    for (const event of cancelKeys) {
      bindKey(event, () => handlers.onCancel());
    }
  }

  const gamepad = scene.input.gamepad;
  if (gamepad) {
    const onButtonDown = (
      pad: Phaser.Input.Gamepad.Gamepad,
      button: Phaser.Input.Gamepad.Button,
      value: number
    ) => {
      if (!pad || !button) {
        return;
      }
      const index = button.index;
      switch (index) {
        case 4:
        case 14:
          handlers.onRotate(-1);
          break;
        case 5:
        case 15:
          handlers.onRotate(1);
          break;
        case 6:
          if (value >= 0.5) {
            handlers.onRotate(-1);
          }
          break;
        case 7:
          if (value >= 0.5) {
            handlers.onRotate(1);
          }
          break;
        case 2:
          handlers.onRotate(-1);
          break;
        case 3:
          handlers.onRotate(1);
          break;
        case 0:
          handlers.onConfirm();
          break;
        case 1:
          handlers.onCancel();
          break;
        default:
          break;
      }
    };

    gamepad.on('down', onButtonDown);
    cleanups.push(() => gamepad.off('down', onButtonDown));
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}
