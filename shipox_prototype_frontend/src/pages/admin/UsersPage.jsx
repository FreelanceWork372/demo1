import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Users, Edit2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'merchant' });
  const [editData, setEditData] = useState({ name: '', phone: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(formData);
      toast.success('User created successfully');
      setShowCreate(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'merchant' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateUser(editUser.id, editData);
      toast.success('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditData({ name: user.name, phone: user.phone || '', is_active: user.is_active });
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <><TopBar title="Users" subtitle="User Management" /><LoadingSpinner size="lg" text="Loading users..." /></>;

  return (
    <>
      <TopBar title="Users" subtitle="User Management" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Users</h1>
            <p>{users.length} total users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add User
          </button>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                className="search-input"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Create a new user to get started" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{user.id}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                    <td><span className={`badge badge-${user.is_active ? 'active' : 'inactive'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)}>
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create User Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create User" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </>
        }>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="Phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="merchant">Merchant</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }>
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editData.is_active ? 'true' : 'false'} onChange={(e) => setEditData({ ...editData, is_active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
