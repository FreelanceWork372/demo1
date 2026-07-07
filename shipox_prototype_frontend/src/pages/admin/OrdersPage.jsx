import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../api/orders';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import StatusBadge from '../../components/UI/StatusBadge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { Search, Package, Eye } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const filtered = orders.filter((o) => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchesStatus = !statusFilter || o.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <><TopBar title="Orders" subtitle="Order Management" /><LoadingSpinner size="lg" text="Loading orders..." /></>;

  return (
    <>
      <TopBar title="Orders" subtitle="Order Management" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Orders</h1>
            <p>{orders.length} total orders</p>
          </div>
        </div>

        <div className="table-container animate-fade-in-up">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input className="search-input" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="created">Created</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No orders found" description="No orders match your search criteria" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
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
                    <td>{order.customer_phone}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.delivery_address}</td>
                    <td>${parseFloat(order.delivery_charge || 0).toFixed(2)}</td>
                    <td><StatusBadge status={order.current_status} /></td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
