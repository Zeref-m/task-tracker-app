import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import TaskForm from './TaskForm';
import EmptyState from './EmptyState';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/errorUtils';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiUserPlus, FiUserX,
  FiCalendar, FiUser, FiShield, FiChevronDown, FiCheckCircle, FiCircle
} from 'react-icons/fi';

const STATUS_OPTIONS = ['CREATED', 'IN_PROGRESS', 'DONE'];
const statusFromBackend = { TODO: 'CREATED', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' };
const statusToBackend = { CREATED: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' };

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [creatingForUserId, setCreatingForUserId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editGroupForm, setEditGroupForm] = useState({ groupName: '', description: '' });
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editGroupError, setEditGroupError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addUserError, setAddUserError] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [groupRes, usersRes, tasksRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get('/users'),
        api.get('/tasks')
      ]);
      setGroup(groupRes.data);
      setAllUsers(usersRes.data);
      const groupTasks = tasksRes.data.filter(t => t.group?.id === Number(id));
      setTasks(groupTasks);
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (currentUser && group) {
      setExpandedUsers(prev => new Set(prev).add(currentUser.id));
    }
  }, [currentUser, group]);

  const isAdmin = group?.createdBy?.id === currentUser?.id;
  const isCurrentUserInGroup = group?.users?.some(u => u.id === currentUser?.id);
  const availableUsers = allUsers.filter(u => !group?.users?.find(gu => gu.id === u.id));

  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'mine') return tasks.filter(t => t.assignee?.id === currentUser?.id);
    if (taskFilter === 'overdue') return tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE'
    );
    return tasks.filter(t => {
      if (taskFilter === 'created') return t.status === 'TODO';
      if (taskFilter === 'in_progress') return t.status === 'IN_PROGRESS';
      if (taskFilter === 'done') return t.status === 'DONE';
      return true;
    });
  }, [tasks, taskFilter, currentUser]);

  const toggleExpand = userId => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const cancelInline = () => {
    setCreatingForUserId(null);
    setEditingTask(null);
  };

  const startCreate = userId => {
    cancelInline();
    setCreatingForUserId(userId);
  };

  const startEdit = (task, userId) => {
    cancelInline();
    setEditingTask({ taskId: task.id, userId });
  };

  const handleCreate = async (data, userId) => {
    try {
      await api.post('/tasks', {
        description: data.description,
        status: data.status,
        deadline: data.deadline,
        assignee: { id: data.assigneeId },
        group: { id: Number(id) }
      });
      toast.success('Задача создана');
      cancelInline();
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdate = async data => {
    if (!editingTask) return;
    try {
      await api.put(`/tasks/${editingTask.taskId}`, {
        description: data.description,
        status: data.status,
        deadline: data.deadline,
        assignee: { id: data.assigneeId },
        group: { id: Number(id) }
      });
      toast.success('Задача обновлена');
      cancelInline();
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async taskId => {
    if (!window.confirm('Удалить задачу?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Задача удалена');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const quickStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, {
        description: task.description,
        status: statusToBackend[newStatus],
        deadline: task.deadline,
        assignee: task.assignee ? { id: task.assignee.id } : null,
        group: { id: Number(id) }
      });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addUser = async () => {
    if (!selectedUserId) return;
    setAddUserError('');
    try {
      await api.post(`/groups/${id}/users`, { userId: Number(selectedUserId) });
      toast.success('Пользователь добавлен');
      setSelectedUserId('');
      setShowAddUser(false);
      loadData();
    } catch (err) {
      setAddUserError(getErrorMessage(err));
    }
  };

  const removeUser = async userId => {
    if (!window.confirm('Удалить пользователя из группы?')) return;
    try {
      await api.delete(`/groups/${id}/users/${userId}`);
      toast.success('Пользователь удалён');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const updateGroup = async e => {
    e.preventDefault();
    setEditGroupError('');
    try {
      await api.put(`/groups/${id}`, editGroupForm);
      toast.success('Группа обновлена');
      setShowEditGroup(false);
      loadData();
    } catch (err) {
      setEditGroupError(getErrorMessage(err));
    }
  };

  const deleteGroup = async () => {
    if (!window.confirm('Удалить группу? Это действие необратимо.')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Группа удалена');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isOverdue = deadline => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatusIcon = status => {
    if (status === 'DONE') return '✓';
    if (status === 'IN_PROGRESS') return '◉';
    return '○';
  };

  const canEditTask = t => isAdmin || t.assignee?.id === currentUser?.id;

  const getUserTasks = userId => filteredTasks.filter(t => t.assignee?.id === userId);

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (!group) return null;

  const currentUserObj = group.users?.find(u => u.id === currentUser?.id);
  const otherUsers = group.users?.filter(u => u.id !== currentUser?.id) || [];

  const renderTasksList = (user, isExpanded) => {
    const userTasks = getUserTasks(user.id);
    const isCreating = creatingForUserId === user.id;
    const hasInlineForm = isCreating || editingTask;
    const canCreate = isAdmin || user.id === currentUser?.id;

    return (
      <div className={`tasks-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {isExpanded && (
          <div className="tasks-inner">
            {userTasks.length === 0 && !isCreating && (
              <EmptyState icon="tasks" message={taskFilter !== 'all' ? 'Нет задач по выбранному фильтру' : 'Нет задач'} />
            )}
            {userTasks.map(t => {
              const isEditing = editingTask?.taskId === t.id;
              return (
                <div key={t.id}>
                  {isEditing ? (
                    <TaskForm
                      mode="edit"
                      initialData={{
                        ...t,
                        status: statusFromBackend[t.status] || 'CREATED'
                      }}
                      users={group.users}
                      isAdmin={isAdmin}
                      onSubmit={handleUpdate}
                      onCancel={cancelInline}
                    />
                  ) : (
                    <div className={`task-card inline${isOverdue(t.deadline) && t.status !== 'DONE' ? ' overdue' : ''}`}>
                      <button
                        className="task-status-toggle"
                        onClick={() => {
                          const next = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
                          quickStatusChange(t, statusFromBackend[next]);
                        }}
                      >
                        {getStatusIcon(statusFromBackend[t.status])}
                      </button>
                      <div className="task-body">
                        <div className="desc">{t.description}</div>
                        <div className="meta">
                          <select
                            className="status-select"
                            value={statusFromBackend[t.status]}
                            onChange={e => quickStatusChange(t, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {t.deadline && (
                            <span className={`meta-item${isOverdue(t.deadline) && t.status !== 'DONE' ? ' overdue' : ''}`}>
                              <FiCalendar size={12} />
                              {new Date(t.deadline).toLocaleDateString('ru-RU', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {canEditTask(t) && (
                        <div className="task-actions">
                          <button className="btn-icon edit" onClick={() => startEdit(t, user.id)}>
                            <FiEdit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(t.id)}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {isCreating && (
              <TaskForm
                mode="create"
                assigneeId={user.id}
                users={group.users}
                isAdmin={isAdmin}
                onSubmit={data => handleCreate(data, user.id)}
                onCancel={cancelInline}
              />
            )}
            {!hasInlineForm && canCreate && (
              <button className="btn-add-task" onClick={() => startCreate(user.id)}>
                <FiPlus size={14} /> Новая задача
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderUserCard = (user, isCurrent) => {
    const isExpanded = expandedUsers.has(user.id);
    const userTasks = getUserTasks(user.id);
    const isCreator = user.id === group.createdBy?.id;

    return (
      <div key={user.id} className={`user-card ${isCurrent ? 'current-user-card' : ''}`}>
        <div className="user-card-header" onClick={() => toggleExpand(user.id)}>
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="name">
              {user.username}
              {isCurrent && <span className="me-label">(я)</span>}
              {isCreator && (
                <span className="admin-badge">
                  <FiShield size={11} /> Админ
                </span>
              )}
            </div>
            <div className="email">{user.email}</div>
          </div>
          <div className="user-card-meta">
            {!isExpanded && userTasks.length > 0 && (
              <span className="task-count">{userTasks.length} задач</span>
            )}
            <FiChevronDown className={`chevron ${isExpanded ? 'expanded' : ''}`} size={18} />
          </div>
          {isAdmin && !isCurrent && (
            <button className="btn-icon delete small" onClick={e => { e.stopPropagation(); removeUser(user.id); }}>
              <FiUserX size={16} />
            </button>
          )}
        </div>
        {renderTasksList(user, isExpanded)}
      </div>
    );
  };

  return (
    <div className="group-detail">
      <button className="back-link" onClick={() => navigate('/dashboard')}>
        <FiArrowLeft size={16} /> Назад к группам
      </button>

      <div className="group-info">
        <div className="group-info-header">
          <div>
            <h2>
              {group.groupName}
              {isAdmin && (
                <span className="admin-badge inline">
                  <FiShield size={14} /> Админ
                </span>
              )}
            </h2>
            {group.description && <p>{group.description}</p>}
          </div>
          {isAdmin && (
            <div className="group-actions">
              <button className="btn-icon edit" onClick={() => {
                setEditGroupForm({ groupName: group.groupName, description: group.description || '' });
                setEditGroupError('');
                setShowEditGroup(true);
              }}>
                <FiEdit2 size={18} />
              </button>
              <button className="btn-icon delete" onClick={deleteGroup}>
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditGroup && (
        <div className="modal-overlay" onClick={() => setShowEditGroup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Редактировать группу</h3>
            <form onSubmit={updateGroup}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Название группы" value={editGroupForm.groupName}
                  onChange={e => setEditGroupForm({ ...editGroupForm, groupName: e.target.value })} required />
                <input placeholder="Описание" value={editGroupForm.description}
                  onChange={e => setEditGroupForm({ ...editGroupForm, description: e.target.value })} />
              </div>
              {editGroupError && <p className="form-error">{editGroupError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditGroup(false)}>Отмена</button>
                <button type="submit" className="btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="group-progress">
          <div className="progress-header">
            <span className="progress-label">Прогресс: {doneCount} / {tasks.length} задач</span>
            <span className="progress-pct">{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="filter-bar">
        {['all', 'mine', 'overdue', 'created', 'in_progress', 'done'].map(f => (
          <button
            key={f}
            className={`filter-btn ${taskFilter === f ? 'active' : ''}`}
            onClick={() => setTaskFilter(f)}
          >
            {f === 'all' && 'Все'}
            {f === 'mine' && 'Мои'}
            {f === 'overdue' && 'Просроченные'}
            {f === 'created' && 'CREATED'}
            {f === 'in_progress' && 'IN PROGRESS'}
            {f === 'done' && 'DONE'}
          </button>
        ))}
      </div>

      <div className="section-header">
        <h3>Участники ({group.users?.length || 0})</h3>
        {isAdmin && (
          <button className="btn-secondary" onClick={() => { setShowAddUser(!showAddUser); setAddUserError(''); }}>
            <FiUserPlus size={14} /> Добавить
          </button>
        )}
      </div>

      {showAddUser && isAdmin && (
        <div className="inline-form add-user-form">
          <div className="inline-form-row">
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ flex: 1 }}>
              <option value="">Выберите пользователя</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
            </select>
            <button className="btn-primary" onClick={addUser} disabled={!selectedUserId}>
              <FiUserPlus size={14} /> Добавить
            </button>
          </div>
          {addUserError && <p className="form-error">{addUserError}</p>}
        </div>
      )}

      <div className="users-list">
        {currentUserObj && renderUserCard(currentUserObj, true)}
        {otherUsers.map(u => renderUserCard(u, false))}
      </div>
    </div>
  );
}
