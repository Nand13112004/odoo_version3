const { exponentialRiskFactor } = require('../services/riskService');

describe('Risk service', () => {
  test('exponentialRiskFactor returns 0 for zero odometer', () => {
    expect(exponentialRiskFactor(0)).toBe(0);
  });
  test('exponentialRiskFactor returns number for positive odometer', () => {
    const r = exponentialRiskFactor(100000);
    expect(typeof r).toBe('number');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});
