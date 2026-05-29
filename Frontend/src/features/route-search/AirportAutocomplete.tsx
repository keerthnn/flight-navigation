import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(0);
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

    flightApi
      .searchAirports(debouncedQuery)
      .then((airports) => {
        if (!cancelled) setResults(airports);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, value?.name]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectAirport(results[activeIndex]);
    }
  }

  function selectAirport(airport: Airport) {
    onSelect(airport);
    setQuery(airport.name);
    setResults([]);
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-autocomplete="list"
      />
      {results.length ? (
        <ul className="autocomplete" role="listbox">
          {results.map((airport, index) => (
            <li key={airport.icao}>
              <button
                type="button"
                className={index === activeIndex ? 'active' : undefined}
                onClick={() => selectAirport(airport)}
              >
                <strong>{airport.icao}</strong>
                <span>{airport.name}</span>
                <small>{airport.regionName}, {airport.countryCode}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
