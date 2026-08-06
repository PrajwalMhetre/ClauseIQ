import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  MessageSquare, 
  ShieldAlert, 
  LogOut, 
  Scale, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Contract', path: '/upload', icon: UploadCloud },
    { name: 'Interactive Chat', path: '/chat', icon: MessageSquare },
  ];

  if (user?.is_admin) {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  // Get user initials for profile avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside 
      className={`glass-card border-y-0 border-l-0 min-h-screen flex flex-col justify-between transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-brand-600 hover:bg-brand-500 text-white rounded-full p-1 border border-slate-800 transition duration-150"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div>
        {/* App Logo */}
        <div className={`p-6 flex items-center gap-3 border-b border-slate-800/80 ${collapsed ? 'justify-center' : ''}`}>
          <div className="bg-gradient-to-tr from-brand-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-outfit font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
              Clause<span className="text-brand-500">IQ</span>
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-3.5 rounded-xl font-medium transition duration-200 ${
                  isActive
                    ? 'bg-brand-600/90 text-white shadow-lg shadow-brand-600/15 border-l-2 border-brand-400'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border-l-2 border-transparent'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="font-outfit text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Information & Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400">
            {user ? getInitials(user.full_name) : <User size={18} />}
          </div>
          {!collapsed && user && (
            <div className="overflow-hidden">
              <p className="font-outfit font-semibold text-sm text-slate-200 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl font-medium text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300 transition duration-150 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="font-outfit text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
