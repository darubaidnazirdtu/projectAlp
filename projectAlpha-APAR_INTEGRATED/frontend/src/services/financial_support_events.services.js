import { Api } from '../api/Api.js'

class FinancialSupportEventsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getFinancialSupportEvents() {
    const response = await this.api.get('/financial_support_events/get')
    return response
  }

  async createFinancialSupportEvents(data, headers = {}) {
    const response = await this.api.post('/financial_support_events/set', data, headers)
    return response
  }

    async updateFinancialSupportEvents(id, data, headers = {}) {
        const response = await this.api.put(`/financial_support_events/update/${id}`, data, headers)
        return response
    }

    async deleteFinancialSupportEvents(id) {
        const response = await this.api.delete(`/financial_support_events/delete/${id}`)
        return response
    }

    async getFinancialSupportEventsById(id) {
        const response = await this.api.get(`/financial_support_events/get/${id}`)
        return response
    }
}

export const FinancialSupportEventsService = new FinancialSupportEventsServices()
