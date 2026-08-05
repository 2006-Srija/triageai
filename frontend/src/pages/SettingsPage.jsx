import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyMsg, setCopyMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/');
      return;
    }
    (async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  const handleCopy = async () => {
    if (!settings?.organization?.invite_code) return;
    try {
      await navigator.clipboard.writeText(settings.organization.invite_code);
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('Copy failed');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await api.regenerateInvite();
      setSettings((prev) => ({
        ...prev,
        organization: { ...prev.organization, invite_code: data.invite_code },
      }));
    } catch (err) {
      alert('Failed to regenerate: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your organization</p>
      </div>

      <div className="space-y-6">
        {/* Organization info */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Organization</h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-100">{settings.organization.name}</p>
          </div>
        </div>

        {/* Invite code */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Invite Code</h3>
          <p className="text-sm text-gray-400 mb-4">
            Share this code with teammates so they can join your organization.
          </p>
          <div className="flex items-center gap-3">
            <code className="px-4 py-2.5 bg-gray-800 rounded-lg text-sm font-mono text-accent-blue border border-gray-700">
              {settings.organization.invite_code}
            </code>
            <button onClick={handleCopy} className="btn-secondary text-sm">
              {copyMsg || 'Copy'}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="btn-secondary text-sm"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Team members */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Team Members</h3>
          {settings.users.length === 0 ? (
            <p className="text-sm text-gray-500">No team members yet</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase">Name</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase">Role</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-800">
                      <td className="py-2.5 px-4 text-sm font-medium text-gray-100">{u.name}</td>
                      <td className="py-2.5 px-4 text-sm text-gray-400">{u.email}</td>
                      <td className="py-2.5 px-4 text-sm">
                        <span className={`badge ${u.role === 'Admin' ? 'bg-accent-blue/10 text-accent-blue' : u.role === 'Agent' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-sm text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
