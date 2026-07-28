import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Users, Mail, Building2, Clock, MapPin, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Department, UserWithDepartment, AccountStatus } from '../types';
import { Modal, ConfirmDelete } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badges';

export function UserManagementPage() {
  const [users, setUsers] = useState<UserWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserWithDepartment | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithDepartment | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    department_id: '',
    role: 'Employee',
    normal_start_hour: 9,
    normal_end_hour: 17,
    normal_location: 'New York, US',
    account_status: 'Active' as AccountStatus,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [usersRes, deptRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name'),
    ]);
    setUsers((usersRes.data || []).map((u) => ({
      ...u,
      department_name: (deptRes.data || []).find((d) => d.id === u.department_id)?.name,
    })));
    setDepartments(deptRes.data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      employee_id: '',
      name: '',
      email: '',
      department_id: departments[0]?.id || '',
      role: 'Employee',
      normal_start_hour: 9,
      normal_end_hour: 17,
      normal_location: 'New York, US',
      account_status: 'Active',
    });
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      department_id: user.department_id,
      role: user.role,
      normal_start_hour: user.normal_start_hour,
      normal_end_hour: user.normal_end_hour,
      normal_location: user.normal_location,
      account_status: user.account_status,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await supabase.from('users').update(form).eq('id', editing.id);
    } else {
      await supabase.from('users').insert(form);
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteUser) return;
    await supabase.from('users').delete().eq('id', deleteUser.id);
    setDeleteUser(null);
    loadData();
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <Users size={20} className="text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">User Management</h3>
            <p className="text-sm text-gray-500">{users.length} employees registered</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50 bg-base-850/50">
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">No users found</td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id} className="table-row-hover border-b border-base-600/30">
                  <td className="px-4 py-3 font-mono text-gray-400">{user.employee_id}</td>
                  <td className="px-4 py-3 text-gray-200 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-gray-400">{user.department_name}</td>
                  <td className="px-4 py-3 text-gray-400">{user.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.account_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewUser(user)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-warning-400 hover:bg-warning-500/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteUser(user)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add New User'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Employee ID</label>
              <input
                type="text"
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                placeholder="EMP009"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@company.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Department</label>
              <select
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Employee"
                className="input"
              />
            </div>
            <div>
              <label className="label">Account Status</label>
              <select
                value={form.account_status}
                onChange={(e) => setForm({ ...form, account_status: e.target.value as AccountStatus })}
                className="input"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
            <div>
              <label className="label">Normal Start Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={form.normal_start_hour}
                onChange={(e) => setForm({ ...form, normal_start_hour: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Normal End Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={form.normal_end_hour}
                onChange={(e) => setForm({ ...form, normal_end_hour: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Normal Login Location</label>
              <input
                type="text"
                value={form.normal_location}
                onChange={(e) => setForm({ ...form, normal_location: e.target.value })}
                placeholder="New York, US"
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update User' : 'Add User'}</button>
          </div>
        </form>
      </Modal>

      {/* View user details */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-base-600/50">
              <div className="w-14 h-14 rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                <span className="text-xl font-bold text-accent-400">{viewUser.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{viewUser.name}</h3>
                <p className="text-sm text-gray-500">{viewUser.email}</p>
                <div className="mt-1"><StatusBadge status={viewUser.account_status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={BadgeCheck} label="Employee ID" value={viewUser.employee_id} />
              <DetailItem icon={Building2} label="Department" value={viewUser.department_name || 'N/A'} />
              <DetailItem icon={Users} label="Role" value={viewUser.role} />
              <DetailItem icon={Mail} label="Email" value={viewUser.email} />
              <DetailItem icon={Clock} label="Working Hours" value={`${viewUser.normal_start_hour}:00 - ${viewUser.normal_end_hour}:00`} />
              <DetailItem icon={MapPin} label="Normal Location" value={viewUser.normal_location} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDelete
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        itemName={deleteUser?.name || ''}
      />
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-base-850 border border-base-600/30">
      <Icon size={16} className="text-gray-500 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-200 font-medium">{value}</p>
      </div>
    </div>
  );
}
