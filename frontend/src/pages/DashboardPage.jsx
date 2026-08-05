import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import TicketFilters from '../components/TicketFilters';
import TicketRow from '../components/TicketRow';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', description: '', customer_name: '', customer_email: '' });
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTickets({ ...filters, page, limit: 20, sortBy: 'created_at', sortOrder: 'desc' });
      setTickets(data.tickets);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.simulateTickets();
      await fetchTickets();
    } catch (err) {
      alert('Failed to simulate tickets: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const clearFilters = () => {
    setFilters({ category: '', priority: '', status: '' });
    setPage(1);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createTicket(newTicketForm);
      setShowNewTicket(false);
      await fetchTickets();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total tickets</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'Admin' && (
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {simulating ? (
                <Spinner />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
              {simulating ? 'Generating...' : 'Simulate Tickets'}
            </button>
          )}
          <button
            className="btn-primary text-sm flex items-center gap-2"
            onClick={() => { setNewTicketForm({ subject: '', description: '', customer_name: '', customer_email: '' }); setShowNewTicket(true); }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <TicketFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onClear={clearFilters} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-lg font-medium text-gray-400">No tickets yet</p>
            <p className="text-sm mt-1">Create a new ticket or click "Simulate Tickets" to populate your dashboard.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sentiment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowNewTicket(false)}>
          <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 mx-4 border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer name <span className="text-gray-500">(optional)</span></label>
                <input
                  className="input-field"
                  placeholder="e.g. John Doe"
                  value={newTicketForm.customer_name}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, customer_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer email <span className="text-gray-500">(optional)</span></label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={newTicketForm.customer_email}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, customer_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <input
                  className="input-field"
                  required
                  placeholder="e.g. Unable to login"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  className="input-field resize-y"
                  required
                  rows={4}
                  placeholder="Describe the issue..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowNewTicket(false)}>Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary text-sm">{creating ? 'Creating...' : 'Create Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
