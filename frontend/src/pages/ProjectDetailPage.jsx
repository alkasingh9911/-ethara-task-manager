import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

function TaskRow({ task, isAdmin, onEdit, onDelete, onStatusChange }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${overdue ? 'border-l-4 border-red-400' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            {overdue && <span className="badge bg-red-100 text-red-700">Overdue</span>}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.assignedTo && (
              <span className="text-xs text-gray-500">👤 {task.assignedTo.name}</span>
            )}
            {task.dueDate && (
              <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(task)} className="btn-ghost p-1.5 text-xs">✏️</button>
              <button onClick={() => onDelete(task.id)} className="btn-ghost p-1.5 text-xs text-red-500">🗑️</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [taskFilter, setTaskFilter] = useState({ status: '', priority: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assignedToId: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id, taskFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (taskFilter.status) params.set('status', taskFilter.status);
      if (taskFilter.priority) params.set('priority', taskFilter.priority);
      return api.get(`/projects/${id}/tasks?${params}`).then((r) => r.data);
    },
  });

  const myMembership = project?.members?.find((m) => m.user.id === user.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${id}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowTaskModal(false);
      resetTaskForm();
      toast.success('Task created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => api.put(`/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
      toast.success('Task updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${id}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setShowMemberModal(false);
      setMemberEmail('');
      toast.success('Member added!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/projects/${id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      navigate('/projects');
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetTaskForm = () => setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assignedToId: '' });

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedToId: task.assignedTo?.id || '',
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...taskForm,
      dueDate: taskForm.dueDate || null,
      assignedToId: taskForm.assignedToId || null,
    };
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleStatusChange = (taskId, status) => {
    updateTaskMutation.mutate({ taskId, data: { status } });
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Delete this task?')) deleteTaskMutation.mutate(taskId);
  };

  const handleDeleteProject = () => {
    if (confirm('Delete this project and all its tasks? This cannot be undone.')) {
      deleteProjectMutation.mutate();
    }
  };

  if (projectLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (!project) return <div className="p-8 text-center text-gray-500">Project not found</div>;

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`badge ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {myMembership?.role}
            </span>
          </div>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTaskModal(true)} className="btn-primary">
            + Add Task
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary">
                👥 Invite
              </button>
              <button onClick={handleDeleteProject} className="btn-danger">
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['tasks', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'tasks' ? `📋 Tasks (${tasks.length})` : `👥 Members (${project.members?.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <select
              className="input w-auto"
              value={taskFilter.status}
              onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select
              className="input w-auto"
              value={taskFilter.priority}
              onChange={(e) => setTaskFilter({ ...taskFilter, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Kanban-style columns */}
          {tasksLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: 'TODO', label: '⏳ To Do', color: 'bg-gray-100' },
                { key: 'IN_PROGRESS', label: '🔄 In Progress', color: 'bg-yellow-50' },
                { key: 'DONE', label: '✅ Done', color: 'bg-green-50' },
              ].map(({ key, label, color }) => (
                <div key={key} className={`rounded-xl ${color} p-1`}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className="badge bg-white text-gray-600">{tasksByStatus[key]?.length}</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    {tasksByStatus[key]?.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                    )}
                    {tasksByStatus[key]?.map((task) => (
                      <div key={task.id} className="card">
                        <TaskRow
                          task={task}
                          isAdmin={isAdmin}
                          onEdit={openEditTask}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <div className="card divide-y divide-gray-100">
          {project.members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {member.user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${member.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
                {isAdmin && member.user.id !== user.id && (
                  <button
                    onClick={() => removeMemberMutation.mutate(member.user.id)}
                    className="btn-ghost text-red-500 text-xs p-1.5"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      <Modal
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); resetTaskForm(); }}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                disabled={!isAdmin && !!editingTask}
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                disabled={!isAdmin && !!editingTask}
              />
            </div>
            <div>
              <label className="label">Assign To</label>
              <select
                className="input"
                value={taskForm.assignedToId}
                onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                disabled={!isAdmin && !!editingTask}
              >
                <option value="">Unassigned</option>
                {project?.members?.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setShowTaskModal(false); setEditingTask(null); resetTaskForm(); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal open={showMemberModal} onClose={() => setShowMemberModal(false)} title="Invite Member">
        <form onSubmit={(e) => { e.preventDefault(); addMemberMutation.mutate({ email: memberEmail, role: memberRole }); }} className="space-y-4">
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email"
              className="input"
              placeholder="colleague@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Inviting…' : 'Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
