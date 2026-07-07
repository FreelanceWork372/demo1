import { useState, useEffect } from 'react';
import { getDrivers, createDriver, updateDriver } from '../../api/drivers';
import { getUsers } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Truck, Edit2 } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [formData, setFormData] = useState({ user_id: '', availability_status: 'available' });
  const [editData, setEditData] = useState({ availability_status: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [driversData, usersData] = await Promise.all([getDrivers(), getUsers()]);
      setDrivers(driversData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const driverUsers = users.filter((u) => u.role === 'driver');
  const existingUserIds = drivers.map((d) => d.user_id);
  const availableDriverUsers = driverUsers.filter((u) => !existingUserIds.includes(u.id));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDriver({ ...formData, user_id: parseInt(formData.user_id) });
      toast.success('Driver created successfully');
      setShowCreate(false);
      setFormData({ user_id: '', availability_status: 'available' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateDriver(editDriver.id, editData);
      toast.success('Driver updated successfully');
      setEditDriver(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update driver');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (driver) => {
    setEditDriver(driver);
    setEditData({ availability_status: driver.availability_status });
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  const getUserEmail = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : '';
  };

  const filtered = drivers.filter((d) => {
    const name = getUserName(d.user_id).toLowerCase();
    return name.includes(search.toLowerCase()) || d.availability_status.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <><TopBar title="Drivers" subtitle="Driver Management" /><LoadingSpinner size="lg" text="Loading drivers..." /></>;

  return (
    <>
      <TopBar title="Drivers" subtitle="Driver Management" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Drivers</h1>
            <p>{drivers.length} registered drivers</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Driver
          </button>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input className="search-input" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Truck} title="No drivers found" description="Create a driver profile to get started" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver Name</th>
                  <th>Email</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((driver) => (
                  <tr key={driver.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{driver.id}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{getUserName(driver.user_id)}</td>
                    <td>{getUserEmail(driver.user_id)}</td>
                    <td><span className={`badge badge-${driver.availability_status}`}>{driver.availability_status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(driver)}>
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Driver" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create Driver'}</button>
          </>
        }>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select className="form-select" value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} required>
                <option value="">Select a driver user...</option>
                {availableDriverUsers.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select className="form-select" value={formData.availability_status} onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!editDriver} onClose={() => setEditDriver(null)} title="Edit Driver" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditDriver(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </>
        }>
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select className="form-select" value={editData.availability_status} onChange={(e) => setEditData({ ...editData, availability_status: e.target.value })}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
