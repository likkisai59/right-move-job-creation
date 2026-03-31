import api from './axios';

// ── GET /api/organizations ──────────────────────────────────────────
export const fetchOrganizations = async (params = {}) => {
    const queryParams = {};
    if (params.status) queryParams.status = params.status;

    const response = await api.get('/organizations', { params: queryParams });

    return {
        data: response.data.data.map(org => ({
            id: org.id,
            name: org.name,
            status: org.status
        }))
    };
};

// ── POST /api/organizations ──────────────────────────────────────────
export const createOrganization = async (formData) => {
    const response = await api.post('/organizations', {
        name: formData.name,
        status: formData.status || 'ACTIVE'
    });
    return { data: response.data };
};
