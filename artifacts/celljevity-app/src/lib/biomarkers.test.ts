import { describe, it, expect } from "vitest";
import { computeHealthScore, getValueStatus, computeBaselineDelta } from "./biomarkers";

describe("computeHealthScore", () => {
  it("returns percentage of markers in range", () => {
    const markers = [
      { value: 50, refRangeLow: 40, refRangeHigh: 60 },  // in
      { value: 70, refRangeLow: 40, refRangeHigh: 60 },  // out
      { value: 55, refRangeLow: 40, refRangeHigh: 60 },  // in
      { value: 45, refRangeLow: 40, refRangeHigh: 60 },  // in
      { value: 30, refRangeLow: 40, refRangeHigh: 60 },  // out
    ];
    expect(computeHealthScore(markers)).toBe(60);
  });

  it("returns -1 when no markers provided", () => {
    expect(computeHealthScore([])).toBe(-1);
  });

  it("returns 0 when all markers are out of range", () => {
    const markers = [
      { value: 10, refRangeLow: 40, refRangeHigh: 60 },
      { value: 80, refRangeLow: 40, refRangeHigh: 60 },
    ];
    expect(computeHealthScore(markers)).toBe(0);
  });

  it("returns 100 when single marker is in range", () => {
    const markers = [{ value: 50, refRangeLow: 40, refRangeHigh: 60 }];
    expect(computeHealthScore(markers)).toBe(100);
  });

  it("returns -1 when all markers lack ref ranges", () => {
    const markers = [
      { value: 50 },
      { value: 60 },
    ];
    expect(computeHealthScore(markers)).toBe(-1);
  });
});

describe("getValueStatus", () => {
  it("returns green when in range", () => {
    expect(getValueStatus(50, 40, 60)).toBe("green");
  });

  it("returns yellow when slightly outside range (within 10%)", () => {
    // Range is 40-60, span = 20, 10% = 2
    // 38 is within 2 below 40
    expect(getValueStatus(38, 40, 60)).toBe("yellow");
    // 62 is within 2 above 60
    expect(getValueStatus(62, 40, 60)).toBe("yellow");
  });

  it("returns red when far outside range", () => {
    expect(getValueStatus(10, 40, 60)).toBe("red");
    expect(getValueStatus(90, 40, 60)).toBe("red");
  });

  it("returns yellow when no ref ranges provided", () => {
    expect(getValueStatus(50)).toBe("yellow");
    expect(getValueStatus(50, undefined, undefined)).toBe("yellow");
  });
});

describe("computeBaselineDelta", () => {
  it("computes positive delta", () => {
    expect(computeBaselineDelta(28, 42)).toBe(50);
  });

  it("returns 0 for no change", () => {
    expect(computeBaselineDelta(42, 42)).toBe(0);
  });

  it("computes negative delta", () => {
    expect(computeBaselineDelta(100, 80)).toBe(-20);
  });

  it("returns null for zero baseline", () => {
    expect(computeBaselineDelta(0, 42)).toBeNull();
  });

  it("handles Infinity guard", () => {
    // computeBaselineDelta guards against NaN/Infinity
    expect(computeBaselineDelta(0, 0)).toBeNull();
  });
});
