import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton } from '@mui/material';
import { useThemeMode } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  return (
    <IconButton aria-label="Toggle theme" onClick={toggleMode} color="inherit">
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}
