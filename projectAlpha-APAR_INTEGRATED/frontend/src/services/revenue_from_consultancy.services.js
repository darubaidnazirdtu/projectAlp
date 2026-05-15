import { Api } from '../api/Api.js'

class RevenueFromConsultancyServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getRevenueFromConsultancy() {
    const response = await this.api.get('/revenue_from_consultancy/get')
    return response
  }

  async createRevenueFromConsultancy(data, headers = {}) {
    const response = await this.api.post('/revenue_from_consultancy/set', data, headers)
    return response
  }

    async updateRevenueFromConsultancy(id, data, headers = {}) {
        const response = await this.api.put(`/revenue_from_consultancy/update/${id}`, data, headers)
        return response
    }

    async deleteRevenueFromConsultancy(id) {
        const response = await this.api.delete(`/revenue_from_consultancy/delete/${id}`)
        return response
    }

    async getRevenueFromConsultancyById(id) {
        const response = await this.api.get(`/revenue_from_consultancy/get/${id}`)
        return response
    }
}

export const RevenueFromConsultancyService = new RevenueFromConsultancyServices()
