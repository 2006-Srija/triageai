import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SignupPage() {
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.signup(form);
      login(data.token, data.organization);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left panel — brand only */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-blue-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-5 shadow-lg shadow-accent-blue/25">
            T
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">TriageAI</h1>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-gray-400 mb-8">Start your 14-day free trial</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization name</label>
              <input name="orgName" value={form.orgName} onChange={handleChange} className="input-field" placeholder="e.g. Acme Corp" required />
              <p className="text-xs text-gray-500 mt-1">Your company or team name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Your name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Jane Smith" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="At least 6 characters" minLength={6} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-blue hover:text-blue-400 font-medium">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Joining an existing team?{' '}
            <Link to="/join" className="text-accent-blue hover:text-blue-400 font-medium">Use invite code</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
