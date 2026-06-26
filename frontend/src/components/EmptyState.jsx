import { FiUsers, FiCalendar, FiSearch, FiUserPlus } from 'react-icons/fi';

const ICONS = {
  groups: FiUsers,
  tasks: FiCalendar,
  search: FiSearch,
  users: FiUserPlus,
};

export default function EmptyState({ icon = 'tasks', title, message, action }) {
  const Icon = ICONS[icon] || FiCalendar;

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={48} />
      </div>
      {title && <h3 className="empty-title">{title}</h3>}
      <p className="empty-message">{message}</p>
      {action && action}
    </div>
  );
}
