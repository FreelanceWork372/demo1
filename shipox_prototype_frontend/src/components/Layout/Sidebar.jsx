import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  Truck,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Box,
} from 'lucide-react';
import './Sidebar.css';

const navItems = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/merchants', icon: Store, label: 'Merchants' },
    { to: '/admin/drivers', icon: Truck, label: 'Drivers' },
    { to: '/admin/orders', icon: Package, label: 'Orders' },
  ],
  merchant: [
    { to: '/merchant', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/merchant/orders', icon: Package, label: 'My Orders' },
  ],
  driver: [
    { to: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/driver/orders', icon: Package, label: 'My Deliveries' },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const items = navItems[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Box size={28} className="logo-icon" />
          {!collapsed && <span className="logo-text">Shipox</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{role}</span>
            </div>
          )}
        </div>
        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
