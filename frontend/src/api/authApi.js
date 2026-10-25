import api from './axios';

export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};
export const verifyOtpAndResetPassword = async (employee_id, otp_code, new_password) => {
    try {
        const response = await api.post('/auth/verify-otp-and-reset-password', {
            employee_id,
            otp_code,
            new_password
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const clearAuthSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
};

export const logout = () => {
    clearAuthSession();
    window.location.href = '/login';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token') || !!localStorage.getItem('employee_token');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    const employee = localStorage.getItem('employee_data');
    
    let photo_url = null;
    if (employee) {
        try {
            photo_url = JSON.parse(employee).photo_url;
        } catch(e) {}
    }

    if (user) {
        const parsedUser = JSON.parse(user);
        if (photo_url) parsedUser.photo_url = photo_url;
        return parsedUser;
    }
    
    if (employee) {
        const empData = JSON.parse(employee);
        return {
            username: empData.name,
            role: 'employee',
            email: empData.email,
            photo_url: empData.photo_url
        };
    }
    return null;
};

export const getCurrentEmployee = () => {
    const employee = localStorage.getItem('employee_data');
    let photo_url = null;
    if (employee) {
        try {
            const empData = JSON.parse(employee);
            photo_url = empData.photo_url;
            return empData;
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
                system_role: userData.system_role,
                photo_url: photo_url || userData.photo_url
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
    // Strict RBAC: No designation fallback. Unassigned by default.
    return 'unassigned';
};

// ── Single Source of Truth for Role Permissions ─────────────────
export const SYSTEM_ROLE_PERMISSIONS = {
    super_admin: ['*'],

    admin_admin: [
        'view_home', 'view_dashboard',
        'view_organizations', 'add_organization', 'edit_organization', 'delete_organization',
        'view_employees', 'add_employee', 'edit_employee', 'delete_employee',
        'view_accounts', // View-only in Accounts module
        'view_settings', 'manage_settings',
        'view_rmep', 'manage_rmep',
    ],

    admin_user: [
        'view_home', 'view_dashboard',
        'view_organizations', 'add_organization',
        'view_employees', 'add_employee', 'edit_employee',
        'view_rmep', 'manage_rmep',
    ],

    hr: [
        'view_home', 'view_dashboard',
        'view_employees', 'add_employee', 'edit_employee', 'delete_employee',
        'view_rmep', 'manage_rmep',
    ],

    leader: [
        'view_home', 'view_dashboard',
        'view_jobs', 'add_job', 'edit_job',
        'view_candidates', 'add_candidate', 'edit_candidate', 'delete_candidate',
        'view_rmep', 'manage_rmep',
    ],

    user: [
        'view_home', 'view_dashboard',
        'view_jobs', // mapping only / view
        'view_candidates', 'add_candidate', 'edit_candidate',
        'view_rmep',
    ],

    account_user: [
        'view_home', 'view_dashboard',
        'view_organizations',
        'view_employees',
        'view_accounts', 'edit_accounts',
        'view_rmep', 'manage_rmep',
    ],

    temporary: [
        'view_home',
        'view_candidates', 'add_candidate', 'edit_candidate',
        'view_rmep',
    ],

    employee: [
        'view_home',
        'view_rmep',
    ],

    unassigned: [],
};

// ── Single Source of Truth for Navigation Access ────────────────
export const ROLE_NAVIGATION_ACCESS = {
    super_admin: ['Home', 'Dashboard', 'Jobs', 'Candidates', 'Organizations', 'Employees', 'RMEP', 'Accounts', 'Settings'],
    admin_admin: ['Home', 'Dashboard', 'Organizations', 'Employees', 'RMEP', 'Accounts', 'Settings'],
    admin_user: ['Home', 'Dashboard', 'Organizations', 'Employees', 'RMEP'],
    hr: ['Home', 'Dashboard', 'Employees', 'RMEP'],
    leader: ['Home', 'Dashboard', 'Jobs', 'Candidates', 'RMEP'],
    user: ['Home', 'Dashboard', 'Jobs', 'Candidates', 'RMEP'],
    account_user: ['Home', 'Dashboard', 'Organizations', 'Employees', 'RMEP', 'Accounts'],
    temporary: ['Home', 'Candidates'],
    employee: ['Home', 'RMEP'],
    unassigned: [],
};

export const hasNavPermission = (navLabel, customRole = null) => {
    if (navLabel === 'Home') return true;
    const role = customRole || getSystemRole();
    if (role === 'super_admin') return true;
    const allowedNavs = ROLE_NAVIGATION_ACCESS[role] || [];
    return allowedNavs.includes(navLabel);
};

export const checkPermission = (action, customRole = null) => {
    const role = customRole || getSystemRole();

    if (!role || role === 'unassigned') return false;
    if (role === 'super_admin') return true;

    const permissions = SYSTEM_ROLE_PERMISSIONS[role] || [];
    return permissions.includes(action) || permissions.includes('*');
};

