import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { register as apiRegister } from '../api/auth';
import { Box, Mail, Lock, User, Phone, ArrowRight, Loader, Store, MapPin } from 'lucide-react';
import './LoginPage.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'merchant',
    business_name: '', contact_person: '', pickup_address: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRegister(formData);
      login(data.access_token, data.user);
      toast.success(`Welcome to Shipox, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-bg-grid" />
      
      <div className="login-container animate-scale-in" style={{ maxWidth: '500px', marginTop: '40px', marginBottom: '40px' }}>
        <div className="login-header">
          <div className="login-logo">
            <Box size={36} />
          </div>
          <h1>Join Shipox</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">I want to register as a</label>
            <select 
              className="form-input login-input" 
              value={formData.role} 
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ appearance: 'auto' }}
            >
              <option value="merchant">Merchant (I want to ship packages)</option>
              <option value="driver">Driver (I want to deliver packages)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="login-input-wrapper">
                <User size={16} className="login-input-icon" />
                <input required type="text" className="form-input login-input" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="login-input-wrapper">
                <Phone size={16} className="login-input-icon" />
                <input required type="tel" className="form-input login-input" placeholder="+1234567890" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input required type="email" className="form-input login-input" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input required type="password" className="form-input login-input" placeholder="Create a strong password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>

          {formData.role === 'merchant' && (
            <div className="merchant-fields animate-fade-in-up" style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Business Details</h4>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <div className="login-input-wrapper">
                  <Store size={16} className="login-input-icon" />
                  <input required type="text" className="form-input login-input" placeholder="Your Store Name" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <div className="login-input-wrapper">
                  <User size={16} className="login-input-icon" />
                  <input required type="text" className="form-input login-input" placeholder="Manager Name" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Address</label>
                <div className="login-input-wrapper">
                  <MapPin size={16} className="login-input-icon" />
                  <input required type="text" className="form-input login-input" placeholder="Where do we pick up?" value={formData.pickup_address} onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? <Loader size={18} className="spin-animation" /> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: '24px' }}>
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
