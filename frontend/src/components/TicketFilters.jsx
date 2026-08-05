export default function TicketFilters({ filters, onChange, onClear }) {
  const categories = ['', 'Billing', 'Technical', 'Complaint', 'General', 'Feature Request'];
  const priorities = ['', 'Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['', 'Open', 'In Progress', 'Resolved'];

  const hasFilters = filters.category || filters.priority || filters.status;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={filters.category || ''}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="input-field w-auto min-w-[140px] text-sm"
      >
        <option value="">All Categories</option>
        {categories.filter(Boolean).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.priority || ''}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="input-field w-auto min-w-[140px] text-sm"
      >
        <option value="">All Priorities</option>
        {priorities.filter(Boolean).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="input-field w-auto min-w-[140px] text-sm"
      >
        <option value="">All Statuses</option>
        {statuses.filter(Boolean).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {hasFilters && (
        <button onClick={onClear} className="text-sm text-gray-400 hover:text-gray-200 underline">
          Clear filters
        </button>
      )}
    </div>
  );
}
