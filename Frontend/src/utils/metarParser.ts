export function parseMetarHazards(metarString: string): {
  hasCB: boolean;
  hasTS: boolean;
  hasFreezingPrecip: boolean;
  hasFog: boolean;
  phenomena: string[];
} {
  const s = metarString.toUpperCase();
  return {
    hasCB: s.includes('CB'),
    hasTS: /\bTS/.test(s),
    hasFreezingPrecip: /FZ|FZRA|FZDZ/.test(s),
    hasFog: /\bFG\b|\bBR\b/.test(s),
    phenomena: [
      s.includes('CB') && 'Cumulonimbus',
      /\bTS/.test(s) && 'Thunderstorm',
      /FZ|FZRA|FZDZ/.test(s) && 'Freezing precip',
      /\bFG\b/.test(s) && 'Fog',
      /\bBR\b/.test(s) && 'Mist',
      /\bHZ\b/.test(s) && 'Haze',
      /\bSQ\b/.test(s) && 'Squalls',
      /\bFC\b/.test(s) && 'Funnel cloud',
    ].filter(Boolean) as string[],
  };
}
