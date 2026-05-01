const PRIORITY_STYLES = {
  LOW: 'bg-blue-50 text-blue-600',
  MEDIUM: 'bg-orange-50 text-orange-600',
  HIGH: 'bg-red-50 text-red-600',
};

const PRIORITY_ICONS = {
  LOW: '↓',
  MEDIUM: '→',
  HIGH: '↑',
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
      {PRIORITY_ICONS[priority]} {priority}
    </span>
  );
}
