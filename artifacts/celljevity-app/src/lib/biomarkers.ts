export function computeHealthScore(
  biomarkers: Array<{ value: number; refRangeLow?: number; refRangeHigh?: number }>,
): number {
  const withRanges = biomarkers.filter(b => b.refRangeLow != null && b.refRangeHigh != null);
  if (withRanges.length === 0) return -1; // sentinel: insufficient data
  const inRange = withRanges.filter(b => b.value >= b.refRangeLow! && b.value <= b.refRangeHigh!);
  return Math.round((inRange.length / withRanges.length) * 100);
}

export function computeBaselineDelta(
  firstValue: number,
  currentValue: number,
): number | null {
  if (firstValue === 0) return null;
  const delta = ((currentValue - firstValue) / firstValue) * 100;
  if (isNaN(delta) || !isFinite(delta)) return null;
  return Math.round(delta);
}

export function getValueStatus(
  value: number,
  refRangeLow?: number,
  refRangeHigh?: number,
): "green" | "yellow" | "red" {
  if (refRangeLow == null || refRangeHigh == null) return "yellow";
  if (value >= refRangeLow && value <= refRangeHigh) return "green";
  // Check if barely outside range (within 10%)
  const range = refRangeHigh - refRangeLow;
  if (value < refRangeLow && value >= refRangeLow - range * 0.1) return "yellow";
  if (value > refRangeHigh && value <= refRangeHigh + range * 0.1) return "yellow";
  return "red";
}
