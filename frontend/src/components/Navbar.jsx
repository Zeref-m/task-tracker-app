import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiGrid, FiSun, FiMoon } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="brand" style={{ textDecoration: 'none' }}>
        TaskManager
      </Link>
      <div className="nav-right">
        <button className="btn-icon theme-toggle" onClick={cycleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
        {user && (
          <>
            <span className="nav-user">
              <FiGrid size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              <strong>{user.username}</strong>
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              <FiLogOut size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Выйти
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
