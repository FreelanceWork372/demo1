import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrders, createOrder } from '../../api/orders';
import { getMyMerchantProfile } from '../../api/merchants';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Package, Eye } from 'lucide-react';

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '', customer_phone: '', pickup_address: '',
    delivery_address: '', package_description: '', delivery_charge: 0, cod_amount: 0,
  });
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [ordersData, profile] = await Promise.all([getOrders(), getMyMerchantProfile()]);
      setOrders(ordersData);
      setMerchantProfile(profile);
      if (profile?.pickup_address) {
        setFormData((prev) => ({ ...prev, pickup_address: profile.pickup_address }));
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createOrder({
        ...formData,
        delivery_charge: parseFloat(formData.delivery_charge) || 0,
        cod_amount: parseFloat(formData.cod_amount) || 0,
      });
      toast.success('Order created successfully!');
      setShowCreate(false);
      setFormData({
        customer_name: '', customer_phone: '', pickup_address: merchantProfile?.pickup_address || '',
        delivery_address: '', package_description: '', delivery_charge: 0, cod_amount: 0,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <><TopBar title="My Orders" subtitle="Order Management" /><LoadingSpinner size="lg" text="Loading orders..." /></>;

  return (
    <>
      <TopBar title="My Orders" subtitle="Order Management" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Orders</h1>
            <p>{orders.length} orders</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Order
          </button>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input className="search-input" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" description="Create your first delivery order" action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Order</button>
            } />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Charges</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{order.order_number}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.customer_name}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.delivery_address}</td>
                    <td>${parseFloat(order.delivery_charge || 0).toFixed(2)}</td>
                    <td><StatusBadge status={order.current_status} /></td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/merchant/orders/${order.id}`)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Order Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Order" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </>
        }>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-input" placeholder="Customer full name" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone</label>
                <input className="form-input" placeholder="Phone number" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <textarea className="form-textarea" placeholder="Pickup address" value={formData.pickup_address} onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <textarea className="form-textarea" placeholder="Delivery address" value={formData.delivery_address} onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Package Description (optional)</label>
              <input className="form-input" placeholder="What's in the package?" value={formData.package_description} onChange={(e) => setFormData({ ...formData, package_description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Delivery Charge ($)</label>
                <input className="form-input" type="number" step="0.01" min="0" value={formData.delivery_charge} onChange={(e) => setFormData({ ...formData, delivery_charge: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">COD Amount ($)</label>
                <input className="form-input" type="number" step="0.01" min="0" value={formData.cod_amount} onChange={(e) => setFormData({ ...formData, cod_amount: e.target.value })} />
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
