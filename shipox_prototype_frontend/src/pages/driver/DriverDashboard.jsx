import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDriverDashboard } from '../../api/dashboard';
import { getMyDriverProfile, updateDriver } from '../../api/drivers';
import { useToast } from '../../context/ToastContext';
import TopBar from '../../components/Layout/TopBar';
import StatsCard from '../../components/UI/StatsCard';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  Package, CheckCircle, Truck, Clock, ArrowUpRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import './DriverDashboard.css';

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

export default function DriverDashboard() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashData, profileData] = await Promise.all([
        getDriverDashboard(),
        getMyDriverProfile(),
      ]);
      setData(dashData);
      setProfile(profileData);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    const newStatus = profile.availability_status === 'available' ? 'busy' : 'available';
    try {
      await updateDriver(profile.id, { availability_status: newStatus });
      setProfile({ ...profile, availability_status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <><TopBar title="Dashboard" subtitle="Driver Overview" /><LoadingSpinner size="lg" text="Loading dashboard..." /></>;
  if (!data) return null;

  const pieData = Object.entries(STATUS_COLORS)
    .map(([key, color]) => ({ name: key.replace(/_/g, ' '), value: data[key] || 0, color }))
    .filter((d) => d.value > 0);

  const isAvailable = profile?.availability_status === 'available';

  return (
    <>
      <TopBar title="Dashboard" subtitle="Driver Overview" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Driver Dashboard</h1>
            <p>Manage your deliveries</p>
          </div>
          {profile && (
            <div className="driver-status-toggle">
              <span className={`status-indicator ${isAvailable ? 'status-online' : 'status-offline'}`} />
              <span className="status-text">{isAvailable ? 'Available' : 'Busy'}</span>
              <button
                className={`btn ${isAvailable ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                onClick={toggleAvailability}
                disabled={toggling}
              >
                {toggling ? 'Updating...' : isAvailable ? 'Go Busy' : 'Go Available'}
              </button>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <StatsCard label="Total Assigned" value={data.total || 0} icon={Package} color="#3b82f6" delay={0} />
          <StatsCard label="Delivered" value={data.delivered || 0} icon={CheckCircle} color="#10b981" delay={50} />
          <StatsCard label="In Transit" value={data.in_transit || 0} icon={Truck} color="#06b6d4" delay={100} />
          <StatsCard label="Pending Pickup" value={data.assigned || 0} icon={Clock} color="#8b5cf6" delay={150} />
        </div>

        <div className="driver-dashboard-bottom">
          <div className="chart-card glass-card animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both', padding: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Delivery Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}><p>No deliveries assigned yet</p></div>
            )}
          </div>

          <div className="quick-actions glass-card animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both', padding: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/driver/orders')}>
                <Package size={20} />
                <span>My Deliveries</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
