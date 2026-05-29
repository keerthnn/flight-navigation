import { WeatherPoint } from '../../types/domain';

interface RiskBarsProps {
  weather: WeatherPoint[];
}

export function RiskBars({ weather }: RiskBarsProps) {
  return (
    <div className="risk-bars" aria-label="Weather risk by route node">
      {weather.map((point) => (
        <div className="risk-bar" key={point.ident}>
          <span>{point.ident}</span>
          <div>
            <i style={{ height: `${Math.max(point.riskWeight * 10, 8)}%` }} />
          </div>
          <strong>{point.riskWeight.toFixed(1)}</strong>
        </div>
      ))}
    </div>
  );
}
