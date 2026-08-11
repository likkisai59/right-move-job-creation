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

export const getCurrentEmployee = () => {
    const employee = localStorage.getItem('employee_data');
    if (employee) {
        try {
            return JSON.parse(employee);
        } catch (e) {}
    }
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            return {
                id: userData.id,
                employee_id: userData.employee_id,
                name: userData.username,
                designation: userData.role,
                email: userData.email,
                contact: userData.contact || 'N/A',
                system_role: userData.system_role
            };
        } catch (e) {}
    }
    return {};
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

export const getSystemRole = () => {
    // 1. Admin/Director login → stored as 'user'
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData.system_role) return userData.system_role.toLowerCase().trim();
        } catch (e) {}
    }
    // 2. Employee login → stored as 'employee_data'
    const employee = localStorage.getItem('employee_data');
    if (employee) {
        try {
            const empData = JSON.parse(employee);
            if (empData.system_role) return empData.system_role.toLowerCase().trim();
        } catch (e) {}
    }
    // 3. Fallback: derive from designation
    const designation = getUserDesignation().toLowerCase().trim().replace(/[\s\.-]+/g, '');
    if (designation.includes('director')) return 'super_admin';
    if (designation.includes('admin')) return 'admin_admin';
    if (designation.includes('hr')) return 'hr';
    if (designation.includes('tl') || designation.includes('lead')) return 'leader';
    if (designation.includes('executive') || designation.includes('recruiter')) return 'user';
    return 'unassigned';
};

export const checkPermission = (action) => {
    const role = getSystemRole();

    if (role === 'unassigned') return false;
    if (role === 'super_admin' || role === 'admin_admin') return true;

    if (action === 'add_employee') {
        return ['hr', 'admin_user', 'super_admin'].includes(role);
    }
    if (action === 'add_organization') {
        return ['admin_user', 'admin_admin', 'super_admin'].includes(role);
    }
    if (action === 'add_job') {
        return ['user', 'leader', 'admin_user', 'admin_admin', 'super_admin'].includes(role);
    }
    if (action === 'add_candidate') {
        return ['user', 'leader', 'admin_user', 'super_admin'].includes(role);
    }
    if (action === 'view_settings') {
        return ['admin_admin', 'super_admin'].includes(role);
    }
    return true;
};

