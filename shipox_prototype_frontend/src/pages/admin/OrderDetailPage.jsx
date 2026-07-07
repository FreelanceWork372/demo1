import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, assignDriver, updateOrderStatus, getOrderTimeline } from '../../api/orders';
import { getDrivers } from '../../api/drivers';
import { getUsers } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../../components/Layout/TopBar';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  ArrowLeft, User, Phone, MapPin, Package, Clock, Truck,
  DollarSign, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import './OrderDetailPage.css';

const STATUS_TRANSITIONS = {
  created: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed', 'returned'],
  failed: ['returned'],
  delivered: [],
  cancelled: [],
  returned: [],
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [assignData, setAssignData] = useState({ driver_id: '', notes: '' });
  const [statusData, setStatusData] = useState({ status: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [orderId]);

  const fetchData = async () => {
    try {
      const [orderData, timelineData, driversData, usersData] = await Promise.all([
        getOrder(orderId),
        getOrderTimeline(orderId),
        role === 'admin' ? getDrivers() : Promise.resolve([]),
        role === 'admin' ? getUsers() : Promise.resolve([]),
      ]);
      setOrder(orderData);
      setTimeline(timelineData);
      setDrivers(driversData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load order details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignDriver(orderId, {
        driver_id: parseInt(assignData.driver_id),
        notes: assignData.notes || 'Assigned manually by admin',
      });
      toast.success('Driver assigned successfully');
      setShowAssign(false);
      setAssignData({ driver_id: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateOrderStatus(orderId, statusData);
      toast.success('Status updated successfully');
      setShowStatus(false);
      setStatusData({ status: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  const availableDrivers = drivers.filter((d) => d.availability_status !== 'inactive');
  const allowedTransitions = order ? (STATUS_TRANSITIONS[order.current_status] || []) : [];

  const backPath = role === 'admin' ? '/admin/orders' : role === 'merchant' ? '/merchant/orders' : '/driver/orders';

  if (loading) return <><TopBar title="Order Details" /><LoadingSpinner size="lg" text="Loading order..." /></>;
  if (!order) return null;

  return (
    <>
      <TopBar title={`Order ${order.order_number}`} subtitle="Order Details" />
      <div className="page-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate(backPath)}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1>{order.order_number}</h1>
              <p>Created on {new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {role === 'admin' && order.current_status === 'created' && (
              <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
                <Truck size={16} /> Assign Driver
              </button>
            )}
            {(role === 'admin' || role === 'driver') && allowedTransitions.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setShowStatus(true)}>
                Update Status
              </button>
            )}
          </div>
        </div>

        <div className="order-detail-grid">
          <div className="order-info-section">
            <div className="detail-card glass-card animate-fade-in-up">
              <h3><Package size={16} /> Order Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <StatusBadge status={order.current_status} />
                </div>
                <div className="detail-item">
                  <span className="detail-label">Order Number</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>{order.order_number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Delivery Charge</span>
                  <span className="detail-value">${parseFloat(order.delivery_charge || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">COD Amount</span>
                  <span className="detail-value">${parseFloat(order.cod_amount || 0).toFixed(2)}</span>
                </div>
              </div>
              {order.package_description && (
                <div className="detail-item" style={{ marginTop: 'var(--space-md)' }}>
                  <span className="detail-label">Package Description</span>
                  <span className="detail-value">{order.package_description}</span>
                </div>
              )}
            </div>

            <div className="detail-card glass-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3><User size={16} /> Customer Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{order.customer_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{order.customer_phone}</span>
                </div>
              </div>
            </div>

            <div className="detail-card glass-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h3><MapPin size={16} /> Addresses</h3>
              <div className="detail-item">
                <span className="detail-label">Pickup Address</span>
                <span className="detail-value">{order.pickup_address}</span>
              </div>
              <div className="detail-item" style={{ marginTop: 'var(--space-md)' }}>
                <span className="detail-label">Delivery Address</span>
                <span className="detail-value">{order.delivery_address}</span>
              </div>
            </div>
          </div>

          <div className="order-timeline-section">
            <div className="detail-card glass-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <h3><Clock size={16} /> Order Timeline</h3>
              {timeline.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No timeline entries yet.</p>
              ) : (
                <div className="timeline">
                  {timeline.map((entry, index) => (
                    <div key={entry.id} className="timeline-item">
                      <div className="timeline-dot-container">
                        <div className={`timeline-dot timeline-dot-${entry.status.replace(/_/g, '-')}`} />
                        {index < timeline.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <StatusBadge status={entry.status} />
                          <span className="timeline-time">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        {entry.notes && <p className="timeline-notes">{entry.notes}</p>}
                        <p className="timeline-user">by {getUserName(entry.updated_by_user_id)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assign Driver Modal */}
        <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Driver" footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Driver'}
            </button>
          </>
        }>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label className="form-label">Select Driver</label>
              <select className="form-select" value={assignData.driver_id} onChange={(e) => setAssignData({ ...assignData, driver_id: e.target.value })} required>
                <option value="">Select a driver...</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getUserName(d.user_id)} ({d.availability_status})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Assignment notes..." value={assignData.notes} onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })} />
            </div>
          </form>
        </Modal>

        {/* Update Status Modal */}
        <Modal isOpen={showStatus} onClose={() => setShowStatus(false)} title="Update Order Status" footer={
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
              <textarea className="form-textarea" placeholder="Status update notes..." value={statusData.notes} onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })} />
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
