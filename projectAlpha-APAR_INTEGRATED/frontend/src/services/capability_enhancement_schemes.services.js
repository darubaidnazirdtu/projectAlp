import { Api } from '../api/Api.js'

class CapabilityEnhancementSchemesServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getCapabilityEnhancementSchemes() {
    const response = await this.api.get('/capability_enhancement_schemes/get')
    return response
  }

  async createCapabilityEnhancementSchemes(data, headers = {}) {
    console.log("hello", data);
    const response = await this.api.post('/capability_enhancement_schemes/set', data, headers)
    return response
  }

    async updateCapabilityEnhancementSchemes(id, data, headers = {}) {
        const response = await this.api.put(`/capability_enhancement_schemes/update/${id}`, data, headers)
        return response
    }

    async deleteCapabilityEnhancementSchemes(id) {
        const response = await this.api.delete(`/capability_enhancement_schemes/delete/${id}`)
        return response
    }

    async getCapabilityEnhancementSchemesById(id) {
        const response = await this.api.get(`/capability_enhancement_schemes/get/${id}`)
        return response
    }
}

export const CapabilityEnhancementSchemesService = new CapabilityEnhancementSchemesServices()
