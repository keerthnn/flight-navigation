import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { Airport } from '../../types/domain';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { flightApi } from '../../services/api/flightApi';

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
    flightApi
      .searchAirports(debouncedQuery)
      .then((airports) => {
        if (!cancelled) setResults(airports);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, value?.name]);

  function selectAirport(airport: Airport | null) {
    if (!airport) return;
    onSelect(airport);
    setQuery(airport.name);
    setResults([]);
  }

  return (
    <Autocomplete
      options={results}
      value={value ?? null}
      loading={loading}
      filterOptions={(options) => options}
      getOptionLabel={(option) => `${option.icao} · ${option.name}`}
      onChange={(_, next) => selectAirport(next)}
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
        <li {...props} key={option.icao}>
          {option.icao} · {option.name} · {option.regionName}, {option.countryCode}
        </li>
      )}
    />
  );
}
