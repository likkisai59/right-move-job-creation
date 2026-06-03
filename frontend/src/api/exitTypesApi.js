import api from './axios';

// ── GET /api/exit-types ──────────────────────────────────────────────
export const fetchExitTypes = async (params = {}) => {
    try {
        const response = await api.get('/exit-types', { params });
        return {
            success: true,
            data: response.data.data
        };
    } catch (err) {
        return {
            success: false,
            message: err.response?.data?.message || 'Failed to fetch exit types'
        };
    }
};

// ── POST /api/exit-types ──────────────────────────────────────────────
export const createExitType = async (name) => {
    try {
        const response = await api.post('/exit-types', { name });
        return {
            success: true,
            data: response.data.data
        };
    } catch (err) {
        return {
            success: false,
            message: err.response?.data?.message || 'Failed to create exit type'
        };
    }
};

// ── PUT /api/exit-types/{id} ──────────────────────────────────────────
export const updateExitType = async (id, payload) => {
    try {
        const response = await api.put(`/exit-types/${id}`, payload);
        return {
            success: true,
            data: response.data.data
        };
    } catch (err) {
        return {
            success: false,
            message: err.response?.data?.message || 'Failed to update exit type'
        };
    }
};
