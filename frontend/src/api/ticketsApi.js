import api from './axios';

export const fetchTickets = async (role, empId) => {
  const response = await api.get(`/tickets/?role=${role}&emp_id=${empId}`);
  return response.data;
};

export const createTicket = async (ticketData, empId) => {
  const response = await api.post(`/tickets/?emp_id=${empId}`, ticketData);
  return response.data;
};

export const fetchTicketAssignees = async () => {
  const response = await api.get('/tickets/assignees');
  return response.data;
};

export const resolveTicket = async (ticketId, empId) => {
  const response = await api.put(`/tickets/${ticketId}/resolve?emp_id=${empId}`);
  return response.data;
};
