export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
