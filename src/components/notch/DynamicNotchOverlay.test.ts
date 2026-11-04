import { describe, expect, it } from 'vitest';
import {
  computeNotchDimensions,
  isPointerInNotchZone,
} from './DynamicNotchOverlay';
import { DEFAULT_NOTCH_METRICS, type NotchMetrics } from '~types';

describe('DynamicNotchOverlay - Step 6 Dynamic Notch Engine', () => {
  const hardwareNotchMetrics: NotchMetrics = {
    hasNotch: true,
    topInset: 37.5,
    notchWidth: 208.0,
    notchHeight: 37.5,
    screenWidth: 1710.0,
    screenHeight: 1112.0,
  };

  const externalMonitorMetrics: NotchMetrics = {
    ...DEFAULT_NOTCH_METRICS,
    screenWidth: 2560,
    screenHeight: 1440,
  };

  describe('DEFAULT_NOTCH_METRICS contract', () => {
    it('provides standard fallback for non-notch displays', () => {
      expect(DEFAULT_NOTCH_METRICS.hasNotch).toBe(false);
      expect(DEFAULT_NOTCH_METRICS.topInset).toBe(0);
      expect(DEFAULT_NOTCH_METRICS.notchWidth).toBe(180);
      expect(DEFAULT_NOTCH_METRICS.notchHeight).toBe(32);
    });
  });

  describe('computeNotchDimensions', () => {
    it('computes stealth dimensions for hardware notch in idle state', () => {
      const dim = computeNotchDimensions('idle', hardwareNotchMetrics);
      expect(dim.width).toBe(208.0);
      expect(dim.height).toBe(37.5);
      expect(dim.borderRadius).toBe(16);
    });

    it('computes floating pill dimensions for external monitors in idle state', () => {
      const dim = computeNotchDimensions('idle', externalMonitorMetrics);
      expect(dim.width).toBe(180);
      expect(dim.height).toBe(32);
      expect(dim.borderRadius).toBe(24);
    });

    it('computes media compact dimensions', () => {
      const notchDim = computeNotchDimensions('media', hardwareNotchMetrics);
      expect(notchDim.width).toBe(390);
      expect(notchDim.height).toBe(48);
      expect(notchDim.borderRadius).toBe(24);

      const extDim = computeNotchDimensions('media', externalMonitorMetrics);
      expect(extDim.width).toBe(390);
      expect(extDim.height).toBe(48);
      expect(extDim.borderRadius).toBe(24);
    });

    it('computes media expanded micro-player dimensions', () => {
      const notchDim = computeNotchDimensions('media-expanded', hardwareNotchMetrics);
      expect(notchDim.width).toBe(440);
      expect(notchDim.height).toBe(104);
      expect(notchDim.borderRadius).toBe(28);

      const extDim = computeNotchDimensions('media-expanded', externalMonitorMetrics);
      expect(extDim.width).toBe(440);
      expect(extDim.height).toBe(104);
      expect(extDim.borderRadius).toBe(28);
    });

    it('computes action alert dimensions', () => {
      const notchDim = computeNotchDimensions('alert', hardwareNotchMetrics);
      expect(notchDim.width).toBe(360);
      expect(notchDim.height).toBe(44);
      expect(notchDim.borderRadius).toBe(24);

      const extDim = computeNotchDimensions('alert', externalMonitorMetrics);
      expect(extDim.width).toBe(360);
      expect(extDim.height).toBe(44);
      expect(extDim.borderRadius).toBe(24);
    });
  });

  describe('isPointerInNotchZone (Collision Avoidance)', () => {
    it('detects pointer inside hardware notch zone', () => {
      const screenW = 1710;
      const screenCenter = screenW / 2; // 855

      // Esattamente al centro, Y in alto
      expect(isPointerInNotchZone(screenCenter, 20, screenW, hardwareNotchMetrics)).toBe(true);
      // Leggermente a sinistra del centro ma dentro la sagoma del notch (208 / 2 = 104 (+16 safety margin) = 120)
      expect(isPointerInNotchZone(screenCenter - 80, 30, screenW, hardwareNotchMetrics)).toBe(true);
      expect(isPointerInNotchZone(screenCenter + 80, 30, screenW, hardwareNotchMetrics)).toBe(true);
    });

    it('returns false when pointer is outside notch zone horizontally', () => {
      const screenW = 1710;

      // Fuori a sinistra (es. X = 500)
      expect(isPointerInNotchZone(500, 20, screenW, hardwareNotchMetrics)).toBe(false);
      // Fuori a destra (es. X = 1200)
      expect(isPointerInNotchZone(1200, 20, screenW, hardwareNotchMetrics)).toBe(false);
    });

    it('returns false when pointer is below the notch in the grid content area', () => {
      const screenW = 1710;
      const screenCenter = screenW / 2; // 855

      // Y ben al di sotto del notch (es. riga 1 della griglia, Y = 150)
      expect(isPointerInNotchZone(screenCenter, 150, screenW, hardwareNotchMetrics)).toBe(false);
    });

    it('protects floating pill zone on external displays', () => {
      const screenW = 2560;
      const screenCenter = screenW / 2; // 1280

      expect(isPointerInNotchZone(screenCenter, 25, screenW, externalMonitorMetrics)).toBe(true);
      expect(isPointerInNotchZone(screenCenter - 200, 25, screenW, externalMonitorMetrics)).toBe(false);
    });
  });
});
