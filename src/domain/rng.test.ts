import { describe, expect, it } from 'vitest';
import { hashString, mulberry32 } from './rng';

describe('rng', () => {
  it('produces a deterministic sequence in [0, 1) for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];

    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(100);
    const b = mulberry32(200);
    expect(a()).not.toEqual(b());
  });

  it('hashes strings deterministically', () => {
    expect(hashString('2026-10-18|detox')).toBe(hashString('2026-10-18|detox'));
    expect(hashString('2026-10-18|detox')).not.toBe(hashString('2026-10-19|detox'));
  });
});
