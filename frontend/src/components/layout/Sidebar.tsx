import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',       icon: '⬡' },
  { to: '/fleet',       label: 'Fleet',            icon: '🚛' },
  { to: '/drivers',     label: 'Drivers',          icon: '👤' },
  { to: '/trips',       label: 'Trips',            icon: '📍' },
  { to: '/maintenance', label: 'Maintenance',      icon: '🔧' },
  { to: '/fuel',        label: 'Fuel & Expenses',  icon: '⛽' },
  { to: '/reports',     label: 'Analytics',        icon: '📊' },
  { to: '/settings',    label: 'Settings',         icon: '⚙' },
];

export function Sidebar() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">TransitOps</div>
        <div className="sidebar-logo-sub">Transport Operations</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user?.email ?? '—'}</div>
            <div className="sidebar-user-role">{role ?? '—'}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '16px', padding: '4px',
            }}
          >
            ⏏
          </button>
        </div>
      </div>
    </aside>
  );
}
