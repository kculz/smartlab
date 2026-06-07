import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 text-white backdrop-blur-xl">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white transition duration-300 hover:text-sky-300">
          Macheke MedLab
        </Link>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm text-slate-300">
                {user.full_name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  menuItems: Array<{ label: string; path: string; roles?: string[]; end?: boolean }>;
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ menuItems, open = true, onClose }) => {
  const { user } = useAuthStore();

  const visibleItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">Navigation</p>
          <p className="mt-1 text-lg font-semibold text-white">Role workspace</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition duration-300 hover:bg-white/15"
          >
            Close
          </button>
        )}
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition duration-300 ${
                  isActive
                    ? 'bg-sky-400/15 text-white shadow-[0_10px_30px_rgba(56,189,248,0.12)]'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.label}</span>
              <span className="h-2 w-2 rounded-full bg-white/20" />
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 transition-opacity duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-full w-72 overflow-y-auto border-r border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:flex lg:w-72 lg:translate-x-0 lg:flex-col ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
