import { Api } from '../api/Api.js'

class FunctionalMousServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getFunctionalMous() {
    const response = await this.api.get('/functional_mous/get')
    return response
  }

  async createFunctionalMous(data, headers = {}) {
    const response = await this.api.post('/functional_mous/set', data, headers)
    return response
  }

    async updateFunctionalMous(id, data, headers = {}) {
        const response = await this.api.put(`/functional_mous/update/${id}`, data, headers)
        return response
    }

    async deleteFunctionalMous(id) {
        const response = await this.api.delete(`/functional_mous/delete/${id}`)
        return response
    }

    async getFunctionalMousById(id) {
        const response = await this.api.get(`/functional_mous/get/${id}`)
        return response
    }
}

export const FunctionalMousService = new FunctionalMousServices()
