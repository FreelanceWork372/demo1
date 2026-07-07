import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../../api/dashboard';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import StatsCard from '../../components/UI/StatsCard';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  Package, Truck, Store, Users, CheckCircle, Clock, AlertTriangle,
  XCircle, RotateCcw, ArrowUpRight, TrendingUp, Zap
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './AdminDashboard.css';

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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const result = await getAdminDashboard();
      setData(result);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <><TopBar title="Dashboard" subtitle="Admin Overview" /><LoadingSpinner size="lg" text="Loading dashboard..." /></>;
  if (!data) return null;

  const pieData = Object.entries(STATUS_COLORS)
    .map(([key, color]) => ({
      name: key.replace(/_/g, ' '),
      value: data[key] || 0,
      color,
    }))
    .filter((d) => d.value > 0);

  const barData = Object.entries(STATUS_COLORS).map(([key, color]) => ({
    name: key.replace(/_/g, ' '),
    count: data[key] || 0,
    fill: color,
  }));

  return (
    <>
      <TopBar title="Dashboard" subtitle="Admin Overview" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Overview of your delivery operations</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatsCard label="Total Orders" value={data.total || 0} icon={Package} color="#3b82f6" delay={0} />
          <StatsCard label="Delivered" value={data.delivered || 0} icon={CheckCircle} color="#10b981" delay={50} />
          <StatsCard label="In Transit" value={data.in_transit || 0} icon={Truck} color="#06b6d4" delay={100} />
          <StatsCard label="Active Merchants" value={data.active_merchants || 0} icon={Store} color="#8b5cf6" delay={150} />
          <StatsCard label="Active Drivers" value={data.active_drivers || 0} icon={Users} color="#f59e0b" delay={200} />
          <StatsCard label="Available Drivers" value={data.available_drivers || 0} icon={Zap} color="#10b981" delay={250} />
        </div>

        <div className="dashboard-charts">
          <div className="chart-card glass-card animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <h3>Order Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f35',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No orders yet</p></div>
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

          <div className="chart-card glass-card animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <h3>Orders by Status</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f35',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="quick-actions glass-card animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => navigate('/admin/orders')}>
              <Package size={20} />
              <span>View Orders</span>
              <ArrowUpRight size={14} />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/users')}>
              <Users size={20} />
              <span>Manage Users</span>
              <ArrowUpRight size={14} />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/merchants')}>
              <Store size={20} />
              <span>Merchants</span>
              <ArrowUpRight size={14} />
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/drivers')}>
              <Truck size={20} />
              <span>Drivers</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
