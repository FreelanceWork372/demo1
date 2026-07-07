import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMerchantDashboard } from '../../api/dashboard';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import StatsCard from '../../components/UI/StatsCard';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  Package, CheckCircle, Truck, Clock, Plus, ArrowUpRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const STATUS_COLORS = {
  created: '#3b82f6',
  assigned: '#8b5cf6',
  picked_up: '#f59e0b',
  in_transit: '#06b6d4',
  delivered: '#10b981',
  failed: '#ef4444',
  cancelled: '#6b7280',
  returned: '#f97316',
};

export default function MerchantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await getMerchantDashboard();
        setData(result);
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <><TopBar title="Dashboard" subtitle="Merchant Overview" /><LoadingSpinner size="lg" text="Loading dashboard..." /></>;
  if (!data) return null;

  const pieData = Object.entries(STATUS_COLORS)
    .map(([key, color]) => ({ name: key.replace(/_/g, ' '), value: data[key] || 0, color }))
    .filter((d) => d.value > 0);

  return (
    <>
      <TopBar title="Dashboard" subtitle="Merchant Overview" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Merchant Dashboard</h1>
            <p>Track your delivery orders</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/merchant/orders?create=true')}>
            <Plus size={16} /> New Order
          </button>
        </div>

        <div className="stats-grid">
          <StatsCard label="Total Orders" value={data.total || 0} icon={Package} color="#3b82f6" delay={0} />
          <StatsCard label="Delivered" value={data.delivered || 0} icon={CheckCircle} color="#10b981" delay={50} />
          <StatsCard label="In Transit" value={data.in_transit || 0} icon={Truck} color="#06b6d4" delay={100} />
          <StatsCard label="Pending" value={(data.created || 0) + (data.assigned || 0)} icon={Clock} color="#f59e0b" delay={150} />
        </div>

        <div className="dashboard-charts" style={{ gridTemplateColumns: '1fr' }}>
          <div className="chart-card glass-card animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <h3>Order Status Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No orders yet. Create your first order!</p></div>
            )}
            <div className="chart-legend">
              {pieData.map((d) => (
                <div key={d.name} className="legend-item">
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="legend-label">{d.name}</span>
                  <span className="legend-value">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="quick-actions glass-card animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => navigate('/merchant/orders?create=true')}>
              <Plus size={20} />
              <span>Create Order</span>
              <ArrowUpRight size={14} />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/merchant/orders')}>
              <Package size={20} />
              <span>View All Orders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
