import { describe, it, expect } from "vitest";
import { computeBaselineDelta } from "./biomarkers";

describe("computeBaselineDelta", () => {
  it("normal increase: 28 → 42 = +50%", () => {
    expect(computeBaselineDelta(28, 42)).toBe(50);
  });

  it("no change: 42 → 42 = 0%", () => {
    expect(computeBaselineDelta(42, 42)).toBe(0);
  });

  it("decrease: 100 → 80 = -20%", () => {
    expect(computeBaselineDelta(100, 80)).toBe(-20);
  });

  it("zero baseline returns null (division guard)", () => {
    expect(computeBaselineDelta(0, 42)).toBeNull();
  });

  it("zero to zero returns null", () => {
    expect(computeBaselineDelta(0, 0)).toBeNull();
  });

  it("small fractional delta rounds correctly", () => {
    // 100 → 101 = 1%
    expect(computeBaselineDelta(100, 101)).toBe(1);
    // 100 → 100.4 = 0% (rounds to 0)
    expect(computeBaselineDelta(100, 100.4)).toBe(0);
    // 100 → 100.5 = 1% (rounds to 1)
    expect(computeBaselineDelta(100, 100.5)).toBe(1);
  });

  it("large changes compute correctly", () => {
    // 10 → 100 = +900%
    expect(computeBaselineDelta(10, 100)).toBe(900);
    // 100 → 1 = -99%
    expect(computeBaselineDelta(100, 1)).toBe(-99);
  });
});
