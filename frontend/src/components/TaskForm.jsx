import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/errorUtils';

const STATUS_OPTIONS = ['CREATED', 'IN_PROGRESS', 'DONE'];

const statusFromBackend = { TODO: 'CREATED', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' };
const statusToBackend = { CREATED: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' };

export default function TaskForm({ mode, initialData, users, isAdmin, assigneeId: presetAssigneeId, onSubmit, onCancel }) {
  const { user: currentUser } = useAuth();

  const [description, setDescription] = useState(initialData?.description || '');
  const [assigneeId, setAssigneeId] = useState(
    initialData?.assignee?.id?.toString()
    || presetAssigneeId?.toString()
    || (isAdmin ? '' : currentUser?.id?.toString() || '')
  );
  const [status, setStatus] = useState(statusFromBackend[initialData?.status] || 'CREATED');
  const [deadline, setDeadline] = useState(initialData?.deadline || '');
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  const handleSubmit = e => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Описание не может быть пустым');
      return;
    }
    setError('');
    onSubmit({
      description: description.trim(),
      assigneeId: isAdmin ? Number(assigneeId) : (presetAssigneeId || currentUser.id),
      status: statusToBackend[status],
      deadline: deadline || null
    });
  };

  return (
    <form className="task-inline-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <div className="inline-form-row">
        <input
          placeholder="Описание задачи"
          value={description}
          onChange={e => { setDescription(e.target.value); setError(''); }}
          required
          style={{ flex: 1 }}
        />
      </div>
      <div className="inline-form-row">
        {isAdmin ? (
          <select
            value={assigneeId}
            onChange={e => setAssigneeId(e.target.value)}
            required
            style={{ flex: 1 }}
          >
            <option value="">Назначить</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        ) : (
          <p className="inline-assignee-info">
            Исполнитель: <strong>{currentUser?.username}</strong>
          </p>
        )}
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ flex: 1 }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={deadline ? deadline.slice(0, 16) : ''}
          onChange={e => setDeadline(e.target.value ? e.target.value + ':00.000Z' : '')}
          style={{ flex: 1 }}
        />
      </div>
      <div className="inline-form-actions">
        <button type="submit" className="btn-primary btn-small">
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
        <button type="button" className="btn-secondary btn-small" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}
