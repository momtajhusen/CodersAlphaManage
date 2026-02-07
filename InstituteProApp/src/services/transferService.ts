import api from './api';

export interface CashTransfer {
    id: number;
    sender_id: number;
    receiver_id: number;
    amount: number;
    transfer_date: string;
    notes?: string;
    created_by: number;
    created_at: string;
    sender?: {
        id: number;
        full_name: string;
    };
    receiver?: {
        id: number;
        full_name: string;
    };
}

export const getCashTransfers = async (params: any = {}) => {
    const response = await api.get('/cash-transfers', { params });
    return response.data;
};

export const createCashTransfer = async (data: {
    receiver_id: number;
    amount: number;
    transfer_date: string;
    notes?: string;
}) => {
    const response = await api.post('/cash-transfers', data);
    return response.data;
};

export const updateCashTransfer = async (id: number, data: {
    receiver_id?: number;
    amount?: number;
    transfer_date?: string;
    notes?: string;
}) => {
    const response = await api.put(`/cash-transfers/${id}`, data);
    return response.data;
};

export const deleteCashTransfer = async (id: number) => {
    const response = await api.delete(`/cash-transfers/${id}`);
    return response.data;
};
