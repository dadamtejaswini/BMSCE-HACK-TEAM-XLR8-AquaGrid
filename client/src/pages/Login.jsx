import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, demoLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Login failed');
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleDemo = () => {
    demoLogin();
    toast.success('Logged in as demo user (admin)');
    navigate('/');
  };

  return (
    <div className="page-wrapper flex items-center justify-center min-h-[80vh] px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <span className="text-4xl mb-4 block">💧</span>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-2">Sign in to your AquaGrid account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center space-y-3">
            <button onClick={handleDemo} className="w-full btn-secondary text-sm !border-cyan-600/40 !text-cyan-400">
              🎮 Try Demo (Admin Access)
            </button>
            <p className="text-sm text-slate-500">
              Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Register</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
