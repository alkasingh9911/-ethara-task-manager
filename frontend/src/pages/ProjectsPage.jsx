import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';
import { format } from 'date-fns';

function ProjectCard({ project }) {
  const role = project.members?.[0]?.role;
  return (
    <Link to={`/projects/${project.id}`} className="card p-6 hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
        <span className={`badge ${role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {role}
        </span>
      </div>
      {project.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📋 {project._count.tasks} tasks</span>
        <span>👥 {project._count.members} members</span>
        <span className="ml-auto text-xs">{format(new Date(project.createdAt || Date.now()), 'MMM d, yyyy')}</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setForm({ name: '', description: '' });
      toast.success('Project created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your projects and teams</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📁</p>
          <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="text-gray-500 mt-1 mb-6">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input"
              placeholder="My Awesome Project"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
