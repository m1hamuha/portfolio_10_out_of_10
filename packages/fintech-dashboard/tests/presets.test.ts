import { describe, it, expect } from 'vitest';
import {
  FINTECH_PRESETS,
  SEED_EMERGENCY_PRESET,
  SERIES_A_SCALEUP_PRESET,
  BOOTSTRAPPED_ALIVE_PRESET,
  getPresetById,
  presetToBaselineFinancials,
} from '../src/engine/presets';
import { calculateRunway } from '../src/engine/runway';

describe('Feature F37: 1-Click Startup Presets Tests', () => {
  it('defines 3 distinct employer-facing presets with realistic profiles', () => {
    expect(FINTECH_PRESETS).toHaveLength(3);

    expect(SEED_EMERGENCY_PRESET.status).toBe('CRITICAL');
    expect(SEED_EMERGENCY_PRESET.expectedRunwayMonths).toBeCloseTo(3.6, 1);

    expect(SERIES_A_SCALEUP_PRESET.status).toBe('HEALTHY');
    expect(SERIES_A_SCALEUP_PRESET.expectedRunwayMonths).toBeCloseTo(18.75, 1);

    expect(BOOTSTRAPPED_ALIVE_PRESET.status).toBe('DEFAULT_ALIVE');
    expect(BOOTSTRAPPED_ALIVE_PRESET.expectedRunwayMonths).toBe(Infinity);
  });

  it('retrieves preset by ID with fallback to Seed Emergency', () => {
    expect(getPresetById('series-a-scaleup').id).toBe('series-a-scaleup');
    expect(getPresetById('bootstrapped-alive').id).toBe('bootstrapped-alive');
    expect(getPresetById('unknown-id').id).toBe('seed-emergency');
  });

  it('converts preset to valid baseline financials matching runway expectations', () => {
    // 1. Seed Emergency
    const seedBase = presetToBaselineFinancials(SEED_EMERGENCY_PRESET);
    const seedRunway = calculateRunway(seedBase);
    expect(seedRunway.runwayMonths).toBe(3.6);
    expect(seedRunway.isDefaultAlive).toBe(false);

    // 2. Series A Scaleup
    const seriesABase = presetToBaselineFinancials(SERIES_A_SCALEUP_PRESET);
    const seriesARunway = calculateRunway(seriesABase);
    expect(seriesARunway.runwayMonths).toBe(18.8);
    expect(seriesARunway.isDefaultAlive).toBe(false);

    // 3. Bootstrapped Default Alive
    const aliveBase = presetToBaselineFinancials(BOOTSTRAPPED_ALIVE_PRESET);
    const aliveRunway = calculateRunway(aliveBase);
    expect(aliveRunway.isDefaultAlive).toBe(true);
    expect(aliveRunway.runwayMonths).toBe(Infinity);
  });
});
