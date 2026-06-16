import api from './axios';

export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    window.location.href = '/login';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token') || !!localStorage.getItem('employee_token');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    const employee = localStorage.getItem('employee_data');
    
    if (user) return JSON.parse(user);
    if (employee) {
        const empData = JSON.parse(employee);
        return {
            username: empData.name,
            role: 'employee',
            email: empData.email
        };
    }
    return null;
};

export const getUserDesignation = () => {
    const user = localStorage.getItem('user');
    const employee = localStorage.getItem('employee_data');
    if (user) {
        try {
            const userData = JSON.parse(user);
            return userData.role || '';
        } catch (e) {
            return '';
        }
    }
    if (employee) {
        try {
            const empData = JSON.parse(employee);
            return empData.designation || '';
        } catch (e) {
            return '';
        }
    }
    return '';
};

export const checkPermission = (action) => {
    const designation = getUserDesignation();
    const norm = (designation || '').toLowerCase().trim().replace(/[\s\.-]+/g, '');
    
    if (action === 'add_employee') {
        return ['director', 'admin', 'hr'].includes(norm);
    }
    if (action === 'add_organization' || action === 'add_job') {
        return ['director', 'admin', 'hr', 'srmanager', 'manager', 'assistantmanager', 'asstmanager', 'teamlead'].includes(norm);
    }
    if (action === 'add_candidate') {
        return ['atl', 'seniorexecutive', 'executive', 'trainee', 'intern'].includes(norm);
    }
    return true;
};

