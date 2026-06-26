import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/errorUtils';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiShield } from 'react-icons/fi';

export default function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [form, setForm] = useState({ groupName: '', description: '', groupPassword: '' });
  const [formError, setFormError] = useState('');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const openCreate = () => {
    setEditGroup(null);
    setForm({ groupName: '', description: '', groupPassword: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (g, e) => {
    e.stopPropagation();
    setEditGroup(g);
    setForm({ groupName: g.groupName, description: g.description || '', groupPassword: '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    try {
      if (editGroup) {
        await api.put(`/groups/${editGroup.id}`, { groupName: form.groupName, description: form.description });
        toast.success('Группа обновлена');
      } else {
        await api.post('/groups', {
          groupName: form.groupName,
          description: form.description,
          groupPassword: form.groupPassword
        });
        toast.success('Группа создана');
      }
      setShowForm(false);
      loadGroups();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleDelete = async (g, e) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить группу "${g.groupName}"?`)) return;
    try {
      await api.delete(`/groups/${g.id}`);
      toast.success('Группа удалена');
      loadGroups();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isAdmin = g => g.createdBy?.id === currentUser?.id;

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="group-list-header">
        <span style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
          {groups.length} {groups.length === 1 ? 'группа' : groups.length < 5 ? 'группы' : 'групп'}
        </span>
        <button className="btn-primary" onClick={openCreate}>
          <FiPlus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Создать группу
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editGroup ? 'Редактировать группу' : 'Создать группу'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Название группы" value={form.groupName}
                  onChange={e => setForm({ ...form, groupName: e.target.value })} required />
                <input placeholder="Описание (необязательно)" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
                {!editGroup && (
                  <input type="password" placeholder="Пароль группы" value={form.groupPassword}
                    onChange={e => setForm({ ...form, groupPassword: e.target.value })} required />
                )}
              </div>
              {formError && <p style={{ color: 'var(--action-delete)', fontSize: '0.85rem', marginTop: 8 }}>{formError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                <button type="submit" className="btn-primary">
                  {editGroup ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiUsers /></div>
          <p>У вас пока нет групп. Создайте первую или найдите существующую!</p>
        </div>
      ) : (
        <div className="group-grid">
          {groups.map(g => (
            <div key={g.id} className="card group-card" onClick={() => navigate(`/groups/${g.id}`)}>
              <div className="card-title">
                <span>
                  {g.groupName}
                  {isAdmin(g) && (
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 500 }}>
                      <FiShield size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                      Админ
                    </span>
                  )}
                </span>
                {isAdmin(g) && (
                  <div className="card-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon edit small" onClick={e => openEdit(g, e)} title="Изменить">
                      <FiEdit2 />
                    </button>
                    <button className="btn-icon delete small" onClick={e => handleDelete(g, e)} title="Удалить">
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
              {g.description && <p className="card-desc">{g.description}</p>}
              <div className="card-footer">
                <span className="card-meta">
                  <FiUsers size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {g.users?.length || 0} участников
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
