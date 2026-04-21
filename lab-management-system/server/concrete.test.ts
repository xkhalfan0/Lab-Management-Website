import { describe, expect, it } from "vitest";

// ─── Calculation helpers (mirror client logic) ────────────────────────────────
function calcDensity(massKg: number, L: number, W: number, H: number): number {
  const vol = (L * W * H) / 1e9; // m³
  return massKg / vol;
}

function calcStrength(loadKN: number, L: number, W: number): number {
  const area = L * W; // mm²
  return (loadKN * 1000) / area;
}

function calcAvg(strengths: number[]): number {
  if (strengths.length === 0) return 0;
  return strengths.reduce((a, b) => a + b, 0) / strengths.length;
}

function checkCompliance(
  avg: number,
  min: number | null,
  max: number | null
): "pass" | "fail" | "none" {
  if (min === null && max === null) return "none";
  if (min !== null && avg < min) return "fail";
  if (max !== null && avg > max) return "fail";
  return "pass";
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Concrete Cube Calculations", () => {
  describe("calcDensity", () => {
    it("calculates density correctly for 150mm cube", () => {
      // 150×150×150mm = 0.003375 m³
      // mass = 8.1 kg → density = 8.1 / 0.003375 = 2400 kg/m³
      const density = calcDensity(8.1, 150, 150, 150);
      expect(density).toBeCloseTo(2400, 0);
    });

    it("calculates density for non-standard dimensions", () => {
      // 100×100×100mm = 0.001 m³, mass = 2.4 kg → 2400 kg/m³
      const density = calcDensity(2.4, 100, 100, 100);
      expect(density).toBeCloseTo(2400, 0);
    });
  });

  describe("calcStrength", () => {
    it("calculates compressive strength correctly", () => {
      // Load = 900 kN, area = 150×150 = 22500 mm²
      // Strength = 900000 / 22500 = 40 N/mm²
      const strength = calcStrength(900, 150, 150);
      expect(strength).toBeCloseTo(40, 2);
    });

    it("calculates strength for different dimensions", () => {
      // Load = 500 kN, area = 100×100 = 10000 mm²
      // Strength = 500000 / 10000 = 50 N/mm²
      const strength = calcStrength(500, 100, 100);
      expect(strength).toBeCloseTo(50, 2);
    });

    it("returns correct value for high-strength concrete", () => {
      // Load = 1350 kN, area = 150×150 = 22500 mm²
      // Strength = 1350000 / 22500 = 60 N/mm²
      const strength = calcStrength(1350, 150, 150);
      expect(strength).toBeCloseTo(60, 2);
    });
  });

  describe("calcAvg", () => {
    it("calculates average of three cubes", () => {
      const avg = calcAvg([38.5, 40.2, 41.3]);
      expect(avg).toBeCloseTo(40.0, 1);
    });

    it("returns 0 for empty array", () => {
      expect(calcAvg([])).toBe(0);
    });

    it("returns single value for one cube", () => {
      expect(calcAvg([40.0])).toBe(40.0);
    });
  });

  describe("checkCompliance", () => {
    it("returns pass when avg is above min", () => {
      expect(checkCompliance(40, 35, null)).toBe("pass");
    });

    it("returns fail when avg is below min", () => {
      expect(checkCompliance(30, 35, null)).toBe("fail");
    });

    it("returns fail when avg is above max", () => {
      expect(checkCompliance(70, null, 60)).toBe("fail");
    });

    it("returns pass when avg is within min and max", () => {
      expect(checkCompliance(40, 35, 50)).toBe("pass");
    });

    it("returns none when no limits defined", () => {
      expect(checkCompliance(40, null, null)).toBe("none");
    });

    it("returns pass when avg equals min exactly", () => {
      expect(checkCompliance(35, 35, null)).toBe("pass");
    });
  });

  describe("Integration: Full cube test workflow", () => {
    it("computes correct results for a typical 28-day test", () => {
      const cubes = [
        { loadKN: 900, L: 150, W: 150, H: 150, massKg: 8.1 },
        { loadKN: 945, L: 150, W: 150, H: 150, massKg: 8.2 },
        { loadKN: 855, L: 150, W: 150, H: 150, massKg: 8.0 },
      ];

      const strengths = cubes.map(c => calcStrength(c.loadKN, c.L, c.W));
      const densities = cubes.map(c => calcDensity(c.massKg, c.L, c.W, c.H));
      const avg = calcAvg(strengths);

      // Strengths: 40, 42, 38 N/mm²
      expect(strengths[0]).toBeCloseTo(40, 1);
      expect(strengths[1]).toBeCloseTo(42, 1);
      expect(strengths[2]).toBeCloseTo(38, 1);

      // Average: 40 N/mm²
      expect(avg).toBeCloseTo(40, 1);

      // Densities ≈ 2400 kg/m³ (±50 tolerance)
      densities.forEach(d => {
        expect(d).toBeGreaterThan(2350);
        expect(d).toBeLessThan(2500);
      });

      // Compliance check: min = 35 N/mm²
      expect(checkCompliance(avg, 35, null)).toBe("pass");
    });
  });
});
