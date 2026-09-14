import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchTickets, createTicket, fetchTicketAssignees, resolveTicket } from '../../api/ticketsApi';
import { getSystemRole, getCurrentEmployee } from '../../api/authApi';
import { formatDate } from '../../utils/formatters';
import Table from '../../components/common/Table';

const TicketManagement = () => {
  const role = getSystemRole();
  const employee = getCurrentEmployee();
  const [tickets, setTickets] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    assigned_to: ''
  });

  const isRequester = ['user', 'leader'].includes(role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, assigneesData] = await Promise.all([
        fetchTickets(role, employee.employee_id),
        isRequester ? fetchTicketAssignees() : Promise.resolve([])
      ]);
      setTickets(ticketsData);
      setAssignees(assigneesData);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.assigned_to) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setSubmitLoading(true);
      await createTicket(formData, employee.employee_id);
      toast.success('Ticket raised successfully!');
      setModalOpen(false);
      setFormData({ description: '', assigned_to: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to raise ticket');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      await resolveTicket(ticketId, employee.employee_id);
      toast.success('Ticket marked as resolved!');
      loadData();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (val) => `#${val}` },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
          {val}
        </span>
      )
    },
    { key: 'raised_by', header: 'Raised By' },
    { key: 'assigned_to', header: 'Assigned To' },
    { key: 'raised_on', header: 'Raised On', render: (val) => formatDate(val) },
    { key: 'resolved_on', header: 'Resolved On', render: (val) => val ? formatDate(val) : '-' },
  ];

  if (!isRequester) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        row.status === 'OPEN' ? (
          <button
            onClick={() => handleResolve(row.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
          >
            <CheckCircle2 size={14} />
            Resolve
          </button>
        ) : (
          <span className="text-gray-400 text-xs font-medium">Resolved</span>
        )
      )
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
          <p className="text-sm text-gray-500">
            {isRequester ? 'View and raise support tickets.' : 'Review tickets assigned to you.'}
          </p>
        </div>
        
        {isRequester && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Raise Ticket</span>
          </button>
        )}
      </div>

      <div className="p-6">
        <Table columns={columns} data={tickets} loading={loading} />
      </div>

      {/* Raise Ticket Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Raise a Ticket</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe your issue..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  required
                >
                  <option value="">Select Assignee</option>
                  {assignees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.name} ({emp.employee_id}) - {emp.role.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagement;
