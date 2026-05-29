import { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Plane, SunMedium } from 'lucide-react';
import { useTheme } from '../../app/providers';

export function AppLayout({ children }: PropsWithChildren) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Flight Navigation Intelligence home">
          <span className="brand-mark">
            <Plane size={20} />
          </span>
          <span>
            <strong>FlightNav Intel</strong>
            <small>{location.pathname === '/' ? 'Route planning' : 'Route intelligence'}</small>
          </span>
        </Link>
        <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
          {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}
