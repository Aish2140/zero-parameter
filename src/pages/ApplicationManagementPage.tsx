import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, AppWindow } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Application, Segment, ApplicationWithSegment, SensitivityLevel } from '../types';
import { Modal, ConfirmDelete } from '../components/ui/Modal';
import { SensitivityBadge } from '../components/ui/Badges';

export function ApplicationManagementPage() {
  const [apps, setApps] = useState<ApplicationWithSegment[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteApp, setDeleteApp] = useState<ApplicationWithSegment | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);

  const [form, setForm] = useState({
    name: '',
    segment_id: '',
    sensitivity_level: 'Medium' as SensitivityLevel,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [appRes, segRes] = await Promise.all([
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('segments').select('*').order('name'),
    ]);
    setSegments(segRes.data || []);
    setApps((appRes.data || []).map((a) => ({
      ...a,
      segment_name: (segRes.data || []).find((s) => s.id === a.segment_id)?.name,
    })));
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', segment_id: segments[0]?.id || '', sensitivity_level: 'Medium', description: '' });
    setModalOpen(true);
  }

  function openEdit(app: Application) {
    setEditing(app);
    setForm({
      name: app.name,
      segment_id: app.segment_id,
      sensitivity_level: app.sensitivity_level,
      description: app.description || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await supabase.from('applications').update(form).eq('id', editing.id);
    } else {
      await supabase.from('applications').insert(form);
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteApp) return;
    await supabase.from('applications').delete().eq('id', deleteApp.id);
    setDeleteApp(null);
    loadData();
  }

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <AppWindow size={20} className="text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Application Management</h3>
            <p className="text-sm text-gray-500">{apps.length} applications registered</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} />
            Add Application
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">No applications found</div>
        )}
        {filtered.map((app) => (
          <div key={app.id} className="card p-5 card-hover group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                  <AppWindow size={18} className="text-accent-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-100">{app.name}</h4>
                  <p className="text-xs text-gray-500">{app.segment_name}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(app)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-warning-400 hover:bg-warning-500/10 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteApp(app)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3 min-h-[40px]">{app.description || 'No description provided'}</p>
            <div className="flex items-center justify-between pt-3 border-t border-base-600/30">
              <span className="text-xs text-gray-500">Sensitivity</span>
              <SensitivityBadge level={app.sensitivity_level} />
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Application' : 'Add New Application'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Application Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. CRM Portal"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Department Segment</label>
            <select
              value={form.segment_id}
              onChange={(e) => setForm({ ...form, segment_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select segment</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sensitivity Level</label>
            <select
              value={form.sensitivity_level}
              onChange={(e) => setForm({ ...form, sensitivity_level: e.target.value as SensitivityLevel })}
              className="input"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the application"
              className="input min-h-[80px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Application'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleteApp}
        onClose={() => setDeleteApp(null)}
        onConfirm={handleDelete}
        itemName={deleteApp?.name || ''}
      />
    </div>
  );
}
