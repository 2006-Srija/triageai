import { useNavigate } from 'react-router-dom';

const priorityStyles = {
  Low: 'bg-gray-800 text-gray-300',
  Medium: 'bg-blue-900/50 text-blue-300',
  High: 'bg-orange-900/50 text-orange-300',
  Urgent: 'bg-red-900/50 text-red-300',
};

const categoryStyles = {
  Billing: 'bg-purple-900/50 text-purple-300',
  Technical: 'bg-cyan-900/50 text-cyan-300',
  Complaint: 'bg-red-900/50 text-red-300',
  General: 'bg-gray-800 text-gray-300',
  'Feature Request': 'bg-green-900/50 text-green-300',
};

const sentimentIcons = {
  Positive: '😊',
  Neutral: '😐',
  Negative: '😟',
  Angry: '😡',
};

const statusStyles = {
  Open: 'bg-yellow-900/50 text-yellow-300',
  'In Progress': 'bg-blue-900/50 text-blue-300',
  Resolved: 'bg-green-900/50 text-green-300',
};

export default function TicketRow({ ticket }) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors duration-100"
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-100">{ticket.subject}</span>
          {ticket.security_flag && (
            <span title="Suspected prompt injection" className="text-red-400 text-xs">⚠️</span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4">
        <span className={`badge ${categoryStyles[ticket.category] || categoryStyles.General}`}>
          {ticket.category}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className={`badge ${priorityStyles[ticket.priority] || priorityStyles.Medium}`}>
          {ticket.priority}
        </span>
      </td>
      <td className="py-3.5 px-4 text-center text-lg">
        {sentimentIcons[ticket.sentiment] || sentimentIcons.Neutral}
      </td>
      <td className="py-3.5 px-4">
        <span className={`badge ${statusStyles[ticket.status] || statusStyles.Open}`}>
          {ticket.status}
        </span>
      </td>
      <td className="py-3.5 px-4 text-sm text-gray-400">
        {new Date(ticket.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
    </tr>
  );
}
