import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { RouteIntelligence } from '../../types/domain';
import { SunriseSunsetData } from '../../types/external';
import { Units } from '../../utils/units';

export function PilotDecisionCard({
  decision,
  intelligence,
  sunriseSunset,
  flightId,
}: {
  decision: 'GO' | 'CAUTION' | 'NO-GO';
  intelligence: RouteIntelligence;
  sunriseSunset: SunriseSunsetData | null;
  flightId: string;
}) {
  const key = `flightnav_notes_${flightId}`;
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(window.sessionStorage.getItem(key) ?? '');
  }, [key]);

  useEffect(() => {
    const id = window.setTimeout(() => window.sessionStorage.setItem(key, notes), 500);
    return () => window.clearTimeout(id);
  }, [key, notes]);

  const banner = useMemo(() => {
    if (decision === 'GO') return { bg: 'success.main', text: 'GO - Route Clear', icon: <CheckCircleIcon /> };
    if (decision === 'CAUTION') return { bg: 'warning.main', text: 'CAUTION - Review Required', icon: <WarningAmberIcon /> };
    return { bg: 'error.main', text: 'NO-GO - Do Not Depart', icon: <BlockIcon /> };
  }, [decision]);

  function saveBrief() {
    const distanceNm = Units.kmToNm(intelligence.flight.distance);
    const text = `FLIGHT BRIEF - ${intelligence.flight.fromICAO} -> ${intelligence.flight.toICAO}\nGenerated: ${new Date().toISOString()}\nDECISION: ${decision}\nDISTANCE: ${distanceNm} nm / ${intelligence.flight.distance} km\nEST TIME: ${Units.hoursToHHMM(distanceNm / 480)}Z\nSUNRISE: ${sunriseSunset ? Units.formatUtcTime(sunriseSunset.sunriseUtc) : '-'}\nSUNSET: ${sunriseSunset ? Units.formatUtcTime(sunriseSunset.sunsetUtc) : '-'}\nNOT FOR NAVIGATION - PLANNING USE ONLY\n\nNOTES:\n${notes}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `flightbrief_${intelligence.flight.fromICAO}_${intelligence.flight.toICAO}_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}Z.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Paper className="pilot-decision-card" sx={{ p: 1.2, position: 'sticky', bottom: 0, zIndex: 10 }}>
      <Box sx={{ bgcolor: banner.bg, color: 'white', p: 1, borderRadius: 1, display: 'flex', gap: 0.7, alignItems: 'center' }}>{banner.icon}<Typography variant="h3">{banner.text}</Typography></Box>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <Typography variant="caption">Best window: {sunriseSunset ? `${Units.formatUtcTime(sunriseSunset.sunriseUtc)} - ${Units.formatUtcTime(sunriseSunset.sunsetUtc)}` : 'Unavailable'}</Typography>
        <TextField size="small" multiline rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add flight notes..." />
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={saveBrief}>Save Flight Brief</Button>
      </Stack>
    </Paper>
  );
}
