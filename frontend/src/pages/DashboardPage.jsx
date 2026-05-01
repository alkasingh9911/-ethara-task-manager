import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  const { stats, myTasks, recentTasks } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Projects" value={stats?.totalProjects} color="text-blue-600" icon="📁" />
        <StatCard label="Total Tasks" value={stats?.totalTasks} color="text-gray-900" icon="📋" />
        <StatCard label="To Do" value={stats?.todoTasks} color="text-gray-600" icon="⏳" />
        <StatCard label="In Progress" value={stats?.inProgressTasks} color="text-yellow-600" icon="🔄" />
        <StatCard label="Done" value={stats?.doneTasks} color="text-green-600" icon="✅" />
        <StatCard label="Overdue" value={stats?.overdueTasks} color="text-red-600" icon="🚨" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Open Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {myTasks?.length === 0 && (
              <p className="p-5 text-sm text-gray-500">No open tasks assigned to you 🎉</p>
            )}
            {myTasks?.map((task) => {
              const overdue = task.dueDate && isPast(new Date(task.dueDate));
              return (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <Link
                        to={`/projects/${task.project.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {task.project.name}
                      </Link>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  {task.dueDate && (
                    <p className={`text-xs mt-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {overdue ? '⚠️ Overdue · ' : '📅 '}
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks?.length === 0 && (
              <p className="p-5 text-sm text-gray-500">No tasks yet</p>
            )}
            {recentTasks?.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Link
                        to={`/projects/${task.project.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {task.project.name}
                      </Link>
                      {task.assignedTo && (
                        <span className="text-xs text-gray-400">→ {task.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
