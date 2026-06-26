import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
import { getErrorMessage } from '../services/errorUtils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.username, form.password, rememberMe);
      } else {
        await register(form.username, form.email, form.password);
        await login(form.username, form.password, rememberMe);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <FiUser size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--secondary-text)' }} />
          <input style={{ paddingLeft: 36 }}
            name="username" placeholder="Имя пользователя" value={form.username}
            onChange={handleChange} required
          />
        </div>
        {!isLogin && (
          <div style={{ position: 'relative' }}>
            <FiMail size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--secondary-text)' }} />
            <input style={{ paddingLeft: 36 }}
              name="email" type="email" placeholder="Email" value={form.email}
              onChange={handleChange} required
            />
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <FiLock size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--secondary-text)' }} />
          <input style={{ paddingLeft: 36 }}
            name="password" type="password" placeholder="Пароль" value={form.password}
            onChange={handleChange} required
          />
        </div>
        {isLogin && (
          <label className="remember-me">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            <span>Запомнить меня</span>
          </label>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
      <button className="link-btn" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}
