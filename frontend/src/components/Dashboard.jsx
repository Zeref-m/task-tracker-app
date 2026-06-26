import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import GroupList from './GroupList';
import EmptyState from './EmptyState';
import { getErrorMessage } from '../services/errorUtils';
import { FiSearch, FiUsers, FiLock, FiGrid, FiCalendar, FiClock } from 'react-icons/fi';

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${accent}` }}>
      <div className="stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showJoin, setShowJoin] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/dashboard/activity').then(r => setActivity(r.data)).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await api.get(`/groups/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      if (res.data.length === 0) {
        setSearchError('Группы с таким названием не найдены');
      }
    } catch (err) {
      setSearchError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!joinPassword || !showJoin) return;
    setJoining(true);
    setJoinError('');
    try {
      await api.post(`/groups/${showJoin.id}/join`, { groupPassword: joinPassword });
      toast.success(`Вы вступили в группу "${showJoin.groupName}"`);
      setShowJoin(null);
      setJoinPassword('');
      setResults([]);
      setQuery('');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setJoinError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  const statusLabel = status => {
    switch (status) {
      case 'TASK_DONE': return 'завершил(а)';
      case 'TASK_IN_PROGRESS': return 'начал(а)';
      default: return 'создал(а)';
    }
  };

  return (
    <div>
      <h1 className="page-title">Панель управления</h1>

      {stats && (
        <div className="stats-row">
          <StatCard icon={<FiGrid size={22} />} label="Мои группы" value={stats.groupCount} accent="var(--accent-purple)" />
          <StatCard icon={<FiCalendar size={22} />} label="Мои задачи" value={stats.taskCount} accent="var(--action-edit)" />
          <StatCard icon={<FiClock size={22} />} label="Просрочено" value={stats.overdueCount} accent="var(--action-delete)" />
        </div>
      )}

      <div className="search-section">
        <h3 className="section-title">Поиск групп</h3>
        <div className="search-bar">
          <div className="search-input-wrapper">
            <FiSearch size={16} className="search-icon" />
            <input
              placeholder="Введите название группы..."
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) { setResults([]); setSearchError(''); } }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        {searchError && results.length === 0 && (
          <p className="search-error">{searchError}</p>
        )}

        {results.length > 0 && (
          <div className="search-results">
            <p className="results-count">Найдено групп: {results.length}</p>
            {results.map(g => (
              <div key={g.id} className="card search-result-card">
                <div>
                  <div className="card-title">{g.groupName}</div>
                  {g.description && <div className="card-desc">{g.description}</div>}
                  <div className="card-meta">
                    <FiUsers size={12} />
                    {g.users?.length || 0} участников
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => { setShowJoin(g); setJoinPassword(''); setJoinError(''); }}>
                  <FiLock size={14} /> Подключиться
                </button>
              </div>
            ))}
          </div>
        )}

        {showJoin && (
          <div className="modal-overlay" onClick={() => setShowJoin(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Подключиться к группе</h3>
              <p className="modal-desc">
                Введите пароль для вступления в <strong>{showJoin.groupName}</strong>
              </p>
              <div className="modal-inputs">
                <input type="password" placeholder="Пароль группы" value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()} />
              </div>
              {joinError && <p className="form-error">{joinError}</p>}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowJoin(null)}>Отмена</button>
                <button className="btn-primary" onClick={handleJoin} disabled={!joinPassword || joining}>
                  {joining ? 'Подключение...' : 'Войти'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Последняя активность</h3>
        {activity.length === 0 ? (
          <EmptyState icon="tasks" message="Здесь будет отображаться активность ваших групп" />
        ) : (
          <div className="activity-feed">
            {activity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-body">
                  <span className="activity-user">{a.username}</span>
                  {' '}{statusLabel(a.type)}{' '}
                  <span className="activity-task">«{a.taskDescription}»</span>
                  {a.groupName && <span className="activity-group">в {a.groupName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Мои группы</h3>
        <GroupList />
      </div>
    </div>
  );
}
