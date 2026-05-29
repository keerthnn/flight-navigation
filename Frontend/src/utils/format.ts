export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

export function riskLabel(value: number): string {
  if (value >= 7) return 'High';
  if (value >= 4) return 'Moderate';
  return 'Low';
}
