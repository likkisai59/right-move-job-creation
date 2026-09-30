import api from './axios';

export const fetchUnreadNotifications = async (employeeName) => {
  const response = await api.get(`/notifications/${encodeURIComponent(employeeName)}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};
