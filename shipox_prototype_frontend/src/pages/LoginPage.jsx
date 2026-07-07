import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { login as apiLogin } from '../api/auth';
import { Box, Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      login(data.access_token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      const dashboardMap = {
        admin: '/admin',
        merchant: '/merchant',
        driver: '/driver',
      };
      navigate(dashboardMap[data.user.role] || '/admin');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-bg-grid" />
      
      <div className="login-container animate-scale-in">
        <div className="login-header">
          <div className="login-logo">
            <Box size={36} />
          </div>
          <h1>Shipox</h1>
          <p>Delivery Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input login-input"
                placeholder="admin@shipox.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
                type="password"
                className="form-input login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
            {loading ? (
              <Loader size={18} className="spin-animation" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            <code>admin@shipox.local / admin123</code>
            <code>merchant@shipox.local / merchant123</code>
            <code>driver@shipox.local / driver123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
