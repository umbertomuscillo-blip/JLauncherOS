import { describe, expect, it, vi } from 'vitest';

describe('useTrackpadSwipe Logic', () => {
  it('filters out primarily vertical scroll events', () => {
    const isHorizontalGesture = (deltaX: number, deltaY: number) => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      return absX >= 6 && absX >= absY * 1.4;
    };

    // Vertical scroll (e.g. mouse wheel or vertical trackpad swipe)
    expect(isHorizontalGesture(0, 50)).toBe(false);
    expect(isHorizontalGesture(10, 30)).toBe(false);
    expect(isHorizontalGesture(2, 2)).toBe(false);

    // True horizontal two-finger swipe
    expect(isHorizontalGesture(40, 5)).toBe(true);
    expect(isHorizontalGesture(-60, 10)).toBe(true);
  });

  it('accumulates deltaX and triggers swipe only when threshold is reached', () => {
    const threshold = 45;
    let accumulated = 0;
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const processDelta = (dx: number) => {
      accumulated += dx;
      if (accumulated >= threshold) {
        onSwipeLeft();
        accumulated = 0;
      } else if (accumulated <= -threshold) {
        onSwipeRight();
        accumulated = 0;
      }
    };

    // Small increments below threshold
    processDelta(20);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    processDelta(15);
    expect(onSwipeLeft).not.toHaveBeenCalled();

    // Reaching threshold (20 + 15 + 12 = 47 >= 45)
    processDelta(12);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);

    // Swiping right
    processDelta(-50);
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });
});
