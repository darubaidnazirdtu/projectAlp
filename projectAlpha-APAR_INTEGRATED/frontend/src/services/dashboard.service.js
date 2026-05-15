import { Api } from '../api/Api.js';

class DashboardService {
    constructor() {
        this.api = new Api(import.meta.env.VITE_BASEURL);
    }

    async getStats() {
        return this.api.get('/dashboard/stats');
    }
}

export const dashboardService = new DashboardService();
