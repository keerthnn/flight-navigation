import { Autocomplete, Box, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { flightApi } from '../../services/api/flightApi';
import { Airport } from '../../types/domain';
import { Units } from '../../utils/units';

interface AirportAutocompleteProps {
  label: string;
  placeholder: string;
  value?: Airport;
  onSelect: (airport: Airport) => void;
}

export function AirportAutocomplete({ label, placeholder, value, onSelect }: AirportAutocompleteProps) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.length < 2 || debouncedQuery === value?.name) {
      setResults([]);
      return;
    }

    setLoading(true);
    flightApi.searchAirports(debouncedQuery)
      .then((airports) => { if (!cancelled) setResults(airports); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery, value?.name]);

  return (
    <Autocomplete
      options={results}
      value={value ?? null}
      loading={loading}
      filterOptions={(options) => options}
      getOptionLabel={(option) => `${option.icao} · ${option.name}`}
      onChange={(_, next) => next && onSelect(next)}
      onInputChange={(_, inputValue) => setQuery(inputValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.icao} sx={{ width: '100%' }}>
          <Stack spacing={0.4} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, px: 0.7, borderRadius: 0.5, bgcolor: 'primary.main', color: '#fff' }}>{option.icao}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">{option.regionName}, {option.countryCode}</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>Elev {Units.metersToFeet(0)} ft</Typography>
            </Stack>
          </Stack>
        </Box>
      )}
    />
  );
}
