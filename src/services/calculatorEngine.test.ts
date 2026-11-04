import { describe, expect, it } from 'vitest';
import { evaluateMathExpression } from './calculatorEngine';

describe('calculatorEngine', () => {
  it('calcola operazioni aritmetiche di base con corretta precedenza', () => {
    expect(evaluateMathExpression('2 + 2')?.result).toBe(4);
    expect(evaluateMathExpression('10 - 4')?.result).toBe(6);
    expect(evaluateMathExpression('6 * 7')?.result).toBe(42);
    expect(evaluateMathExpression('100 / 4')?.result).toBe(25);
    expect(evaluateMathExpression('2 + 3 * 4')?.result).toBe(14);
    expect(evaluateMathExpression('(2 + 3) * 4')?.result).toBe(20);
  });

  it('supporta moltiplicatori x e percentuali X% of Y', () => {
    expect(evaluateMathExpression('15 x 4')?.result).toBe(60);
    expect(evaluateMathExpression('20% of 500')?.result).toBe(100);
    expect(evaluateMathExpression('50 % of 200')?.result).toBe(100);
  });

  it('supporta potenze e funzioni matematiche', () => {
    expect(evaluateMathExpression('2 ^ 8')?.result).toBe(256);
    expect(evaluateMathExpression('sqrt(144)')?.result).toBe(12);
    expect(evaluateMathExpression('abs(-50)')?.result).toBe(50);
    expect(evaluateMathExpression('round(4.6)')?.result).toBe(5);
  });

  it('supporta conversioni hex() e bin()', () => {
    expect(evaluateMathExpression('hex(255)')?.formatted).toBe('0xFF');
    expect(evaluateMathExpression('bin(16)')?.formatted).toBe('0b10000');
  });

  it('rifiuta parole generiche o input non matematici (zero falsi positivi)', () => {
    expect(evaluateMathExpression('Safari')).toBeNull();
    expect(evaluateMathExpression('Chrome')).toBeNull();
    expect(evaluateMathExpression('Visual Studio Code')).toBeNull();
    expect(evaluateMathExpression('hello world')).toBeNull();
    expect(evaluateMathExpression('a')).toBeNull();
  });

  it('rifiuta divisione per zero in modo sicuro', () => {
    expect(evaluateMathExpression('10 / 0')).toBeNull();
  });
});
