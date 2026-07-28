import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Laptop, Smartphone, Tablet, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Device, User, DeviceWithUser, DeviceHealth, OsStatus, AntivirusStatus } from '../types';
import { Modal, ConfirmDelete } from '../components/ui/Modal';
import { TrustBadge } from '../components/ui/Badges';

export function DeviceManagementPage() {
  const [devices, setDevices] = useState<DeviceWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDevice, setDeleteDevice] = useState<DeviceWithUser | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);

  const [form, setForm] = useState({
    device_id: '',
    device_name: '',
    device_type: 'Laptop',
    assigned_user_id: '',
    trusted: false,
    device_health: 'Good' as DeviceHealth,
    os_status: 'Updated' as OsStatus,
    antivirus_status: 'Active' as AntivirusStatus,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [devRes, userRes] = await Promise.all([
      supabase.from('devices').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').order('name'),
    ]);
    setUsers(userRes.data || []);
    setDevices((devRes.data || []).map((d) => ({
      ...d,
      assigned_user_name: (userRes.data || []).find((u) => u.id === d.assigned_user_id)?.name || null,
    })));
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      device_id: '',
      device_name: '',
      device_type: 'Laptop',
      assigned_user_id: '',
      trusted: false,
      device_health: 'Good',
      os_status: 'Updated',
      antivirus_status: 'Active',
    });
    setModalOpen(true);
  }

  function openEdit(device: Device) {
    setEditing(device);
    setForm({
      device_id: device.device_id,
      device_name: device.device_name,
      device_type: device.device_type,
      assigned_user_id: device.assigned_user_id || '',
      trusted: device.trusted,
      device_health: device.device_health,
      os_status: device.os_status,
      antivirus_status: device.antivirus_status,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, assigned_user_id: form.assigned_user_id || null };
    if (editing) {
      await supabase.from('devices').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('devices').insert(payload);
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteDevice) return;
    await supabase.from('devices').delete().eq('id', deleteDevice.id);
    setDeleteDevice(null);
    loadData();
  }

  const filtered = devices.filter(
    (d) =>
      d.device_name.toLowerCase().includes(search.toLowerCase()) ||
      d.device_id.toLowerCase().includes(search.toLowerCase())
  );

  const deviceIcon = (type: string) => {
    if (type === 'Mobile') return Smartphone;
    if (type === 'Tablet') return Tablet;
    if (type === 'Desktop') return Monitor;
    return Laptop;
  };

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
            <Laptop size={20} className="text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Device Management</h3>
            <p className="text-sm text-gray-500">{devices.length} devices registered</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} />
            Add Device
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50 bg-base-850/50">
                <th className="px-4 py-3 font-medium">Device ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">OS</th>
                <th className="px-4 py-3 font-medium">Antivirus</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-500 py-8">No devices found</td></tr>
              )}
              {filtered.map((device) => {
                const Icon = deviceIcon(device.device_type);
                return (
                  <tr key={device.id} className="table-row-hover border-b border-base-600/30">
                    <td className="px-4 py-3 font-mono text-gray-400">{device.device_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-500" />
                        <span className="text-gray-200 font-medium">{device.device_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{device.device_type}</td>
                    <td className="px-4 py-3 text-gray-400">{device.assigned_user_name || 'Unassigned'}</td>
                    <td className="px-4 py-3"><TrustBadge trusted={device.trusted} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${device.device_health === 'Good' ? 'text-success-400' : device.device_health === 'Fair' ? 'text-warning-400' : 'text-danger-400'}`}>
                        {device.device_health}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${device.os_status === 'Updated' ? 'text-success-400' : device.os_status === 'Outdated' ? 'text-warning-400' : 'text-danger-400'}`}>
                        {device.os_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${device.antivirus_status === 'Active' ? 'text-success-400' : 'text-danger-400'}`}>
                        {device.antivirus_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(device)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-warning-400 hover:bg-warning-500/10 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteDevice(device)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Device' : 'Add New Device'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Device ID</label>
              <input
                type="text"
                value={form.device_id}
                onChange={(e) => setForm({ ...form, device_id: e.target.value })}
                placeholder="DEV009"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Device Name</label>
              <input
                type="text"
                value={form.device_name}
                onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                placeholder="John-MacBook-Pro"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Device Type</label>
              <select
                value={form.device_type}
                onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                className="input"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Tablet">Tablet</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="label">Assigned User</label>
              <select
                value={form.assigned_user_id}
                onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.employee_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Device Health</label>
              <select
                value={form.device_health}
                onChange={(e) => setForm({ ...form, device_health: e.target.value as DeviceHealth })}
                className="input"
              >
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="label">OS Status</label>
              <select
                value={form.os_status}
                onChange={(e) => setForm({ ...form, os_status: e.target.value as OsStatus })}
                className="input"
              >
                <option value="Updated">Updated</option>
                <option value="Outdated">Outdated</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Antivirus Status</label>
              <select
                value={form.antivirus_status}
                onChange={(e) => setForm({ ...form, antivirus_status: e.target.value as AntivirusStatus })}
                className="input"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Not Installed">Not Installed</option>
              </select>
            </div>
            <div>
              <label className="label">Trusted Device</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, trusted: !form.trusted })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.trusted ? 'bg-success-500' : 'bg-base-500'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.trusted ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm text-gray-400">{form.trusted ? 'Trusted' : 'Untrusted'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update Device' : 'Add Device'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleteDevice}
        onClose={() => setDeleteDevice(null)}
        onConfirm={handleDelete}
        itemName={deleteDevice?.device_name || ''}
      />
    </div>
  );
}
