import { useState, useEffect } from 'react';
import { getMerchants, createMerchant, updateMerchant } from '../../api/merchants';
import { getUsers } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Store, Edit2 } from 'lucide-react';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editMerchant, setEditMerchant] = useState(null);
  const [formData, setFormData] = useState({ user_id: '', business_name: '', contact_person: '', pickup_address: '' });
  const [editData, setEditData] = useState({ business_name: '', contact_person: '', pickup_address: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [merchantsData, usersData] = await Promise.all([getMerchants(), getUsers()]);
      setMerchants(merchantsData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const merchantUsers = users.filter((u) => u.role === 'merchant');
  const existingUserIds = merchants.map((m) => m.user_id);
  const availableMerchantUsers = merchantUsers.filter((u) => !existingUserIds.includes(u.id));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createMerchant({ ...formData, user_id: parseInt(formData.user_id) });
      toast.success('Merchant created successfully');
      setShowCreate(false);
      setFormData({ user_id: '', business_name: '', contact_person: '', pickup_address: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create merchant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateMerchant(editMerchant.id, editData);
      toast.success('Merchant updated successfully');
      setEditMerchant(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update merchant');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (merchant) => {
    setEditMerchant(merchant);
    setEditData({ business_name: merchant.business_name, contact_person: merchant.contact_person, pickup_address: merchant.pickup_address });
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  const filtered = merchants.filter((m) =>
    m.business_name.toLowerCase().includes(search.toLowerCase()) ||
    m.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <><TopBar title="Merchants" subtitle="Merchant Management" /><LoadingSpinner size="lg" text="Loading merchants..." /></>;

  return (
    <>
      <TopBar title="Merchants" subtitle="Merchant Management" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Merchants</h1>
            <p>{merchants.length} registered merchants</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Merchant
          </button>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input className="search-input" placeholder="Search merchants..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Store} title="No merchants found" description="Create a merchant profile to get started" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  <th>Contact Person</th>
                  <th>User</th>
                  <th>Pickup Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((merchant) => (
                  <tr key={merchant.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{merchant.id}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{merchant.business_name}</td>
                    <td>{merchant.contact_person}</td>
                    <td>{getUserName(merchant.user_id)}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{merchant.pickup_address}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(merchant)}>
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Merchant" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create Merchant'}</button>
          </>
        }>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select className="form-select" value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} required>
                <option value="">Select a merchant user...</option>
                {availableMerchantUsers.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" placeholder="Business name" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" placeholder="Contact person name" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <textarea className="form-textarea" placeholder="Pickup address" value={formData.pickup_address} onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })} required />
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!editMerchant} onClose={() => setEditMerchant(null)} title="Edit Merchant" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditMerchant(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </>
        }>
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={editData.business_name} onChange={(e) => setEditData({ ...editData, business_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={editData.contact_person} onChange={(e) => setEditData({ ...editData, contact_person: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <textarea className="form-textarea" value={editData.pickup_address} onChange={(e) => setEditData({ ...editData, pickup_address: e.target.value })} required />
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
