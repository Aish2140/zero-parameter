import { useEffect, useState } from 'react';
import { Network, Plus, Trash2, Building2, Boxes, Link2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Department, Segment, DepartmentSegment, Application } from '../types';
import { Modal, ConfirmDelete } from '../components/ui/Modal';

export function DepartmentSegmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [mappings, setMappings] = useState<DepartmentSegment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [addSegOpen, setAddSegOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'dept' | 'seg' | 'map'; id: string; name: string } | null>(null);

  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [segForm, setSegForm] = useState({ name: '', description: '' });
  const [mapForm, setMapForm] = useState({ department_id: '', segment_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [deptRes, segRes, mapRes, appRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('segments').select('*').order('name'),
      supabase.from('department_segments').select('*'),
      supabase.from('applications').select('*'),
    ]);
    setDepartments(deptRes.data || []);
    setSegments(segRes.data || []);
    setMappings(mapRes.data || []);
    setApplications(appRes.data || []);
    setLoading(false);
  }

  async function addDept(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('departments').insert(deptForm);
    setDeptForm({ name: '', description: '' });
    setAddDeptOpen(false);
    loadData();
  }

  async function addSeg(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('segments').insert(segForm);
    setSegForm({ name: '', description: '' });
    setAddSegOpen(false);
    loadData();
  }

  async function addMap(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('department_segments').insert(mapForm);
    setMapForm({ department_id: '', segment_id: '' });
    setMapOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'dept') {
      await supabase.from('departments').delete().eq('id', deleteTarget.id);
    } else if (deleteTarget.type === 'seg') {
      await supabase.from('segments').delete().eq('id', deleteTarget.id);
    } else {
      await supabase.from('department_segments').delete().eq('id', deleteTarget.id);
    }
    setDeleteTarget(null);
    loadData();
  }

  const getSegmentForDept = (deptId: string) =>
    mappings.filter((m) => m.department_id === deptId).map((m) => segments.find((s) => s.id === m.segment_id)).filter(Boolean);

  const getAppsForSegment = (segId: string) => applications.filter((a) => a.segment_id === segId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <Network size={20} className="text-accent-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Department & Microsegmentation</h3>
          <p className="text-sm text-gray-500">Manage departments, segments, and access mappings</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setAddDeptOpen(true)} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Add Department
        </button>
        <button onClick={() => setAddSegOpen(true)} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Add Segment
        </button>
        <button
          onClick={() => setMapOpen(true)}
          className="btn-primary flex items-center gap-2"
          disabled={departments.length === 0 || segments.length === 0}
        >
          <Link2 size={16} /> Map Department to Segment
        </button>
      </div>

      {/* Departments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const deptSegments = getSegmentForDept(dept.id);
          return (
            <div key={dept.id} className="card p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                    <Building2 size={18} className="text-accent-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-100">{dept.name}</h4>
                    <p className="text-xs text-gray-500">{dept.description || 'No description'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget({ type: 'dept', id: dept.id, name: dept.name })}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Allowed Segments</p>
                {deptSegments.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">No segments mapped</p>
                ) : (
                  deptSegments.map((seg) => {
                    const apps = getAppsForSegment(seg!.id);
                    return (
                      <div key={seg!.id} className="flex items-start gap-2 p-3 rounded-lg bg-base-850 border border-base-600/30 group">
                        <Boxes size={16} className="text-accent-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-200">{seg!.name}</span>
                            <button
                              onClick={() => {
                                const map = mappings.find((m) => m.department_id === dept.id && m.segment_id === seg!.id);
                                if (map) setDeleteTarget({ type: 'map', id: map.id, name: `${dept.name} → ${seg!.name}` });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-500 hover:text-danger-400 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {apps.length === 0 ? (
                              <span className="text-xs text-gray-600">No applications</span>
                            ) : (
                              apps.map((app) => (
                                <span key={app.id} className="text-xs px-2 py-0.5 rounded bg-base-700 text-gray-400">
                                  {app.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All segments list */}
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-gray-200 mb-4">All Network Segments</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((seg) => (
            <div key={seg.id} className="flex items-center justify-between p-3 rounded-lg bg-base-850 border border-base-600/30">
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-accent-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">{seg.name}</p>
                  <p className="text-xs text-gray-500">{seg.description || 'No description'}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget({ type: 'seg', id: seg.id, name: seg.name })}
                className="p-1 rounded text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal open={addDeptOpen} onClose={() => setAddDeptOpen(false)} title="Add Department" size="sm">
        <form onSubmit={addDept} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input
              type="text"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Marketing"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Optional description"
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAddDeptOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      {/* Add Segment Modal */}
      <Modal open={addSegOpen} onClose={() => setAddSegOpen(false)} title="Add Segment" size="sm">
        <form onSubmit={addSeg} className="space-y-4">
          <div>
            <label className="label">Segment Name</label>
            <input
              type="text"
              value={segForm.name}
              onChange={(e) => setSegForm({ ...segForm, name: e.target.value })}
              placeholder="e.g. Marketing-Segment"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={segForm.description}
              onChange={(e) => setSegForm({ ...segForm, description: e.target.value })}
              placeholder="Optional description"
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAddSegOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      {/* Map Modal */}
      <Modal open={mapOpen} onClose={() => setMapOpen(false)} title="Map Department to Segment" size="sm">
        <form onSubmit={addMap} className="space-y-4">
          <div>
            <label className="label">Department</label>
            <select
              value={mapForm.department_id}
              onChange={(e) => setMapForm({ ...mapForm, department_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Segment</label>
            <select
              value={mapForm.segment_id}
              onChange={(e) => setMapForm({ ...mapForm, segment_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select segment</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setMapOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Mapping</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name || ''}
      />
    </div>
  );
}
