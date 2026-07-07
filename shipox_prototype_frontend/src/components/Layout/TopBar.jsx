import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user, role } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="topbar-right">
        <div className={`badge badge-${role}`}>{role}</div>
      </div>
    </header>
  );
}
