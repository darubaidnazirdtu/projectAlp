import { Api } from '../api/Api.js'

class EContentDevelopedServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getEContentDeveloped() {
    const response = await this.api.get('/e_content_developed/get')
    return response
  }

  async createEContentDeveloped(data, headers = {}) {
    const response = await this.api.post('/e_content_developed/set', data, headers)
    return response
  }

    async updateEContentDeveloped(id, data, headers = {}) {
        const response = await this.api.put(`/e_content_developed/update/${id}`, data, headers)
        return response
    }

    async deleteEContentDeveloped(id) {
        const response = await this.api.delete(`/e_content_developed/delete/${id}`)
        return response
    }

    async getEContentDevelopedById(id) {
        const response = await this.api.get(`/e_content_developed/get/${id}`)
        return response
    }
}

export const EContentDevelopedService = new EContentDevelopedServices();
