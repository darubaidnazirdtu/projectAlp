import { Api } from '../api/Api.js'

class RevenueFromCorporateTrainingServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getRevenueFromCorporateTraining() {
    const response = await this.api.get('/revenue_from_corporate_training/get')
    return response
  }

  async createRevenueFromCorporateTraining(data, headers = {}) {
    const response = await this.api.post('/revenue_from_corporate_training/set', data, headers)
    return response
  }

    async updateRevenueFromCorporateTraining(id, data, headers = {}) {
        const response = await this.api.put(`/revenue_from_corporate_training/update/${id}`, data, headers)
        return response
    }

    async deleteRevenueFromCorporateTraining(id) {
        const response = await this.api.delete(`/revenue_from_corporate_training/delete/${id}`)
        return response
    }

    async getRevenueFromCorporateTrainingById(id) {
        const response = await this.api.get(`/revenue_from_corporate_training/get/${id}`)
        return response
    }
}

export const RevenueFromCorporateTrainingService = new RevenueFromCorporateTrainingServices()
