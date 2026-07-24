import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/learn', label: '学习', icon: '📚' },
  { path: '/chat', label: 'AI对话', icon: '💬' },
  { path: '/review', label: '复习', icon: '🔄' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 20, color: 'var(--primary)' }}>AILOS</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          {user?.nickname || '学习者'}
        </p>
      </div>

      <div style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'all 0.2s',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', fontSize: 13 }}
        >
          退出登录
        </button>
      </div>
    </nav>
  );
}