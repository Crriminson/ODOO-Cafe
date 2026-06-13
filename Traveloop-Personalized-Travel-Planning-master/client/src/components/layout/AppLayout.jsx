import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Briefcase,
  User,
  LogOut,
  ChevronDown,
  Users,
  Shield,
} from 'lucide-react';

/**
 * AppLayout — top-nav shell.
 * Wordmark left · nav links center · avatar + dropdown right
 */
const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = (() => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.name) return user.name.slice(0, 2).toUpperCase();
    return 'U';
  })();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Top Navbar ── */}
      <header
        className="sticky top-0 z-40 bg-white border-b-2 border-[#1A1A1A] flex items-center
                   justify-between px-10 h-[68px] flex-shrink-0"
      >
        {/* Wordmark */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-2xl font-black tracking-tight text-[#1A1A1A]">Travel</span>
          <span className="text-2xl font-black tracking-tight text-[#F5C142]">oop</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-2">
          {[
            { name: 'Dashboard', path: '/',        icon: LayoutDashboard },
            { name: 'My Trips',  path: '/trips',   icon: Briefcase },
            { name: 'Community', path: '/community', icon: Users },
            { name: 'Profile',   path: '/profile', icon: User },
            ...(user?.role === 'ADMIN' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
          ].map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors duration-150
                 ${isActive
                   ? (name === 'Admin' ? 'bg-red-500 text-white border-2 border-red-700' : 'bg-[#F5C142] text-[#1A1A1A] border-2 border-[#1A1A1A]')
                   : (name === 'Admin' ? 'text-red-600 hover:bg-red-50 border-2 border-transparent' : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] border-2 border-transparent')
                 }`
              }
            >
              <Icon size={15} />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div
              className="w-10 h-10 rounded-full bg-[#F5C142] border-2 border-[#1A1A1A]
                         flex items-center justify-center font-black text-sm text-[#1A1A1A]"
              style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
            >
              {initials}
            </div>
            <ChevronDown
              size={14}
              className={`text-[#6B7280] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-3 w-52 bg-white border-2 border-[#1A1A1A] rounded-2xl
                         overflow-hidden z-50"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
            >
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : user?.name}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#1A1A1A]
                           hover:bg-[#F5F0E8] transition-colors"
              >
                <User size={14} /> Profile
              </Link>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#EF4444]
                           hover:bg-red-50 w-full transition-colors border-t border-[#E5E7EB]"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
