import api from './axios';

// ── GET /api/organizations ──────────────────────────────────────────
export const fetchOrganizations = async (params = {}) => {
    const response = await api.get('/organizations', { params });
    return {
        data: response.data.data // Wrapper is { success: true, message: "...", data: [...] }
    };
};

// ── GET /api/organizations/{id} ─────────────────────────────────────
export const getOrganizationById = async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return { data: response.data.data };
};

// ── POST /api/organizations ──────────────────────────────────────────
export const createOrganization = async (data) => {
    const response = await api.post('/organizations', data);
    return { data: response.data.data };
};

// ── PUT /api/organizations/{id} ──────────────────────────────────────
export const updateOrganization = async (id, data) => {
    const response = await api.put(`/organizations/${id}`, data);
    return { data: response.data.data };
};

// ── DELETE /api/organizations/{id} ───────────────────────────────────
export const deleteOrganization = async (id) => {
    const response = await api.delete(`/organizations/${id}`);
    return { data: response.data };
};

// ── GET /api/organizations/check-duplicate ───────────────────────────
export const checkDuplicateOrganization = async (name) => {
    const response = await api.get('/organizations/check-duplicate', {
        params: { name }
    });
    return response.data.data.exists;
};
