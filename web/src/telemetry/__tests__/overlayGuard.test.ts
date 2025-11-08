import { describe, expect, it } from 'vitest';
import { isOverlaySupported } from '../../hud/debug/Overlay';

describe('Debug overlay guard', () => {
  it('returns false when document is not available', () => {
    expect(isOverlaySupported(null)).toBe(false);
    expect(isOverlaySupported(undefined)).toBe(false);
    const noBody = { body: null, createElement: () => ({}) } as unknown as Document;
    expect(isOverlaySupported(noBody)).toBe(false);
  });

  it('returns true when document provides a body and createElement', () => {
    const fakeDoc = {
      body: {},
      createElement: () => ({})
    } as unknown as Document;
    expect(isOverlaySupported(fakeDoc)).toBe(true);
  });
});
