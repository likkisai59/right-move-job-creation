import api from './axios';

export const getEmployeeRoles = async () => {
  const response = await api.get('/settings/roles');
  return response.data;
};

export const assignEmployeeRole = async (employeeId, systemRole) => {
  const response = await api.post('/settings/assign-role', {
    employee_id: employeeId,
    system_role: systemRole,
  });
  return response.data;
};

export const getPermissionMatrix = async () => {
  const response = await api.get('/settings/matrix');
  return response.data;
};
