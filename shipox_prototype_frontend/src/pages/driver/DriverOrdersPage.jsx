import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '../../api/orders';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Search, Package, Eye, RefreshCw } from 'lucide-react';

const DRIVER_TRANSITIONS = {
  assigned: ['picked_up'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed', 'returned'],
  failed: ['returned'],
};

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusData, setStatusData] = useState({ status: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const openStatusUpdate = (order) => {
    setSelectedOrder(order);
    setStatusData({ status: '', notes: '' });
    setShowStatus(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateOrderStatus(selectedOrder.id, statusData);
      toast.success('Status updated!');
      setShowStatus(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const allowedTransitions = selectedOrder ? (DRIVER_TRANSITIONS[selectedOrder.current_status] || []) : [];

  if (loading) return <><TopBar title="My Deliveries" subtitle="Assigned Orders" /><LoadingSpinner size="lg" text="Loading deliveries..." /></>;

  return (
    <>
      <TopBar title="My Deliveries" subtitle="Assigned Orders" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>My Deliveries</h1>
            <p>{orders.length} assigned orders</p>
          </div>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input className="search-input" placeholder="Search deliveries..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No deliveries assigned" description="You don't have any assigned deliveries yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Delivery Address</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const transitions = DRIVER_TRANSITIONS[order.current_status] || [];
                  return (
                    <tr key={order.id}>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{order.order_number}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.customer_name}</td>
                      <td>{order.customer_phone}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.delivery_address}</td>
                      <td><StatusBadge status={order.current_status} /></td>
                      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/driver/orders/${order.id}`)}>
                            <Eye size={14} />
                          </button>
                          {transitions.length > 0 && (
                            <button className="btn btn-primary btn-sm" onClick={() => openStatusUpdate(order)}>
                              <RefreshCw size={14} /> Update
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={showStatus} onClose={() => setShowStatus(false)} title={`Update ${selectedOrder?.order_number}`} footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowStatus(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </>
        }>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-select" value={statusData.status} onChange={(e) => setStatusData({ ...statusData, status: e.target.value })} required>
                <option value="">Select status...</option>
                {allowedTransitions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Add delivery notes..." value={statusData.notes} onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })} />
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
