import TerrainIcon from '@mui/icons-material/Terrain';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { RouteNode } from '../../types/domain';
import { Units } from '../../utils/units';

export function AltitudeProfile({
  nodes,
  selectedIndex,
  onSelectIndex,
}: {
  nodes: RouteNode[];
  selectedIndex?: number | null;
  onSelectIndex?: (index: number) => void;
}) {
  const theme = useTheme();
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => {
    if (!nodes.length) return [];
    return nodes.map((node, index) => {
      const progress = nodes.length === 1 ? 0 : index / (nodes.length - 1);
      let altFt = 35000;
      if (progress < 0.2) altFt = progress / 0.2 * 35000;
      else if (progress > 0.8) altFt = (1 - progress) / 0.2 * 35000;
      return { node, altFt: Math.max(0, altFt) };
    });
  }, [nodes]);

  const width = 760;
  const height = 210;
  const leftPad = 56;
  const rightPad = 24;
  const topPad = 18;
  const bottomPad = 34;
  const max = 40000;
  const min = 0;
  const chartW = width - leftPad - rightPad;
  const chartH = height - topPad - bottomPad;
  const cruiseFt = 35000;
  const bands = [
    { label: 'FL350', value: 35000 },
    { label: 'FL200', value: 20000 },
    { label: 'FL100', value: 10000 },
  ];

  function pointX(index: number) {
    return leftPad + (index / Math.max(points.length - 1, 1)) * chartW;
  }

  function pointY(value: number) {
    return topPad + (1 - (value - min) / (max - min)) * chartH;
  }

  const path = points.map((point, index) => {
    const x = pointX(index);
    const y = pointY(point.altFt);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const focusIndex = hover ?? selectedIndex ?? null;
  const hoverPoint = focusIndex !== null ? points[focusIndex] : undefined;
  const hoverX = focusIndex !== null ? pointX(focusIndex) : 0;
  const hoverY = hoverPoint ? pointY(hoverPoint.altFt) : 0;
  const selectedPoint = selectedIndex !== null && selectedIndex !== undefined ? points[selectedIndex] : undefined;
  const selectedX = selectedPoint ? pointX(selectedIndex as number) : 0;
  const selectedY = selectedPoint ? pointY(selectedPoint.altFt) : 0;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Stack spacing={0.7}>
      <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.6} alignItems="center">
          <TerrainIcon fontSize="small" />
          <Typography variant="caption">Altitude Profile</Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
          Cruise {Units.formatAlt(cruiseFt)}
        </Typography>
      </Stack>
      <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 1.2, overflow: 'hidden', bgcolor: 'background.surface' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={170}
          onMouseMove={(event) => {
            const bounds = (event.currentTarget as SVGElement).getBoundingClientRect();
            const ratio = (event.clientX - bounds.left - leftPad) / chartW;
            setHover(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
          }}
          onMouseLeave={() => setHover(null)}
        >
          <rect x={leftPad} y={topPad} width={chartW * 0.2} height={chartH} fill={theme.palette.info.main} opacity={0.06} />
          <rect x={leftPad + chartW * 0.2} y={topPad} width={chartW * 0.6} height={chartH} fill={theme.palette.primary.main} opacity={0.05} />
          <rect x={leftPad + chartW * 0.8} y={topPad} width={chartW * 0.2} height={chartH} fill={theme.palette.warning.main} opacity={0.08} />

          {bands.map((band) => (
            <g key={band.label}>
              <line
                x1={leftPad}
                y1={pointY(band.value)}
                x2={width - rightPad}
                y2={pointY(band.value)}
                stroke={theme.palette.divider}
                strokeDasharray="5 5"
              />
              <text x={10} y={pointY(band.value) + 4} fill={theme.palette.text.secondary} fontSize="10" fontFamily="JetBrains Mono, monospace">
                {band.label}
              </text>
            </g>
          ))}

          <line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke={theme.palette.divider} />
          <line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke={theme.palette.divider} />

          <path d={`${path} L ${width - rightPad} ${height - bottomPad} L ${leftPad} ${height - bottomPad} Z`} fill={theme.palette.primary.main} opacity={0.18} />
          <path d={path} fill="none" stroke={theme.palette.primary.main} strokeWidth={2.4} />

          {points.map((point, index) => {
            const x = pointX(index);
            const y = pointY(point.altFt);
            const active = focusIndex === index;
            const isSelected = selectedIndex === index;
            return (
              <g key={point.node.ident + index}>
                {isSelected ? (
                  <>
                    <circle cx={x} cy={y} r={11} fill={theme.palette.warning.main} opacity={isDark ? 0.35 : 0.22} />
                    <circle cx={x} cy={y} r={7.2} fill="none" stroke={theme.palette.warning.main} strokeWidth={2.8} />
                  </>
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 5.2 : isSelected ? 4.6 : 2.8}
                  fill={active ? theme.palette.secondary.main : isSelected ? theme.palette.warning.main : theme.palette.primary.main}
                  stroke={isSelected ? theme.palette.background.paper : 'none'}
                  strokeWidth={isSelected ? 1.4 : 0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectIndex?.(index)}
                />
              </g>
            );
          })}

          {selectedPoint ? (
            <>
              <line
                x1={selectedX}
                y1={topPad}
                x2={selectedX}
                y2={height - bottomPad}
                stroke={theme.palette.warning.main}
                strokeDasharray="3 5"
                strokeWidth={2}
                opacity={isDark ? 0.9 : 0.8}
              />
              <rect
                x={Math.max(leftPad, selectedX - 10)}
                y={topPad}
                width={20}
                height={chartH}
                fill={theme.palette.warning.main}
                opacity={isDark ? 0.14 : 0.08}
              />
            </>
          ) : null}

          {hoverPoint ? (
            <g>
              <line x1={hoverX} y1={topPad} x2={hoverX} y2={height - bottomPad} stroke={theme.palette.secondary.main} strokeDasharray="4 4" />
              <circle cx={hoverX} cy={hoverY} r={4} fill={theme.palette.secondary.main} />
            </g>
          ) : null}

          <text x={leftPad + 6} y={height - 10} fill={theme.palette.text.secondary} fontSize="10">CLIMB</text>
          <text x={leftPad + chartW * 0.47} y={height - 10} fill={theme.palette.text.secondary} fontSize="10">CRUISE</text>
          <text x={leftPad + chartW * 0.85} y={height - 10} fill={theme.palette.text.secondary} fontSize="10">DESCENT</text>
        </svg>
        {hoverPoint ? (
          <Typography variant="caption" sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'background.paper', px: 0.8, py: 0.2, borderRadius: 0.8, fontFamily: 'JetBrains Mono, monospace' }}>
            {hoverPoint.node.ident} · {Units.formatAlt(hoverPoint.altFt)} · {Math.round(hoverPoint.altFt).toLocaleString()} ft
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
