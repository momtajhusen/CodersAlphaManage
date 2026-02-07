import api from './api';

export interface HistoryItem {
    id: number;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    date: string;
    sortDate: string;
    created_at: string;
    category?: string;
    description?: string;
    title?: string;
    status?: string;
    source_type?: string;
    expense_type?: string;
    contributor?: {
        id: number;
        full_name: string;
        first_name: string;
    };
    employee?: {
        id: number;
        full_name: string;
        first_name: string;
    };
    sender?: {
        id: number;
        full_name: string;
    };
    receiver?: {
        id: number;
        full_name: string;
    };
}

export interface HistoryFilters {
    page?: number;
    per_page?: number;
    from_date?: string;
    to_date?: string;
    type?: 'all' | 'office' | 'personal';
    record_type?: 'income' | 'expense' | 'transfer';
    employee_id?: number;
    search?: string;
}

export interface HistoryResponse {
    success: boolean;
    data: HistoryItem[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    totals: {
        income: number;
        expense: number;
        transfer: number;
        balance: number;
    };
}

export const getHistory = async (params: HistoryFilters = {}): Promise<HistoryResponse> => {
    const response = await api.get('/finance/history', { params });
    return response.data;
};
