import { PHASES } from '../constants';

describe('constants', () => {
  it('should define all three phases', () => {
    expect(PHASES).toEqual({
      WORK: 'work',
      BREAK: 'break',
      LONG_BREAK: 'long_break',
    });
  });

  it('should use distinct phase values', () => {
    const values = Object.values(PHASES);
    expect(new Set(values).size).toBe(values.length);
  });
});
