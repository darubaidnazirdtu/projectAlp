import { Api } from '../api/Api.js'

class ItInfrastructureStockServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getItInfrastructureStock() {
    const response = await this.api.get('/it_infrastructure_stock/get')
    return response
  }

  async createItInfrastructureStock(data, headers = {}) {
    const response = await this.api.post('/it_infrastructure_stock/set', data, headers)
    return response
  }

    async updateItInfrastructureStock(id, data, headers = {}) {
        const response = await this.api.put(`/it_infrastructure_stock/update/${id}`, data, headers)
        return response
    }

    async deleteItInfrastructureStock(id) {
        const response = await this.api.delete(`/it_infrastructure_stock/delete/${id}`)
        return response
    }

    async getItInfrastructureStockById(id) {
        const response = await this.api.get(`/it_infrastructure_stock/get/${id}`)
        return response
    }
}

export const ItInfrastructureStockService = new ItInfrastructureStockServices()
