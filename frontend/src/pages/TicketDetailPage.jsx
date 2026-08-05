import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const priorityStyles = {
  Low: 'bg-gray-800 text-gray-300',
  Medium: 'bg-blue-900/50 text-blue-300',
  High: 'bg-orange-900/50 text-orange-300',
  Urgent: 'bg-red-900/50 text-red-300',
};

const sentimentIcons = {
  Positive: '😊',
  Neutral: '😐',
  Negative: '😟',
  Angry: '😡',
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');

  const isReadOnly = user?.role === 'Viewer';

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getTicket(id);
        setTicket(data.ticket);
        setStatus(data.ticket.status);
        setResponse(data.ticket.suggested_response);
      } catch (err) {
        alert('Failed to load ticket');
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setJustSaved(false);
    try {
      const data = await api.updateTicket(id, { status, suggested_response: response });
      setTicket(data.ticket);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
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

  if (!ticket) return null;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Heading */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
                  {ticket.security_flag && (
                    <span className="badge bg-red-900/50 text-red-300" title="Suspected prompt injection">
                      ⚠️ Injection Attempt
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  From {ticket.customer_name || 'Unknown'} ({ticket.customer_email || 'no email'}) &middot;{' '}
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="badge bg-gray-800 text-gray-300">{ticket.category}</span>
              <span className={`badge ${priorityStyles[ticket.priority]}`}>{ticket.priority}</span>
              <span className="badge bg-gray-800 text-gray-300">
                {sentimentIcons[ticket.sentiment]} {ticket.sentiment}
              </span>
              <span className={`badge ${status === 'Resolved' ? 'bg-green-900/50 text-green-300' : status === 'In Progress' ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                {status}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Summary</h3>
            <p className="text-gray-400 text-sm">{ticket.summary}</p>
          </div>

          {/* Suggested Response */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Suggested Response</h3>
            {isReadOnly ? (
              <p className="text-gray-400 text-sm whitespace-pre-wrap">{response}</p>
            ) : (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={5}
                className="input-field resize-y"
                placeholder="Edit suggested response..."
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Status</h3>
            {isReadOnly ? (
              <span className={`badge text-sm ${status === 'Resolved' ? 'bg-green-900/50 text-green-300' : status === 'In Progress' ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                {status}
              </span>
            ) : (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field text-sm"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            )}
          </div>

          {/* Customer Info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> <span className="text-gray-200">{ticket.customer_name || 'N/A'}</span></p>
              <p><span className="text-gray-500">Email:</span> <span className="text-gray-200">{ticket.customer_email || 'N/A'}</span></p>
            </div>
          </div>

          {/* Save button */}
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Saving...' : justSaved ? 'Saved!' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
