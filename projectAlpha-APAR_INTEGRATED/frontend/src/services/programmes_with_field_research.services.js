import { Api } from '../api/Api.js'

class ProgrammesWithFieldResearchServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getProgrammesWithFieldResearch() {
    const response = await this.api.get('/programmes_with_field_research/get')
    return response
  }

  async createProgrammesWithFieldResearch(data, headers = {}) {
    const response = await this.api.post('/programmes_with_field_research/set', data, headers)
    return response
  }

    async updateProgrammesWithFieldResearch(id, data, headers = {}) {
        const response = await this.api.put(`/programmes_with_field_research/update/${id}`, data, headers)
        return response
    }

    async deleteProgrammesWithFieldResearch(id) {
        const response = await this.api.delete(`/programmes_with_field_research/delete/${id}`)
        return response
    }

    async getProgrammesWithFieldResearchById(id) {
        const response = await this.api.get(`/programmes_with_field_research/get/${id}`)
        return response
    }
}

export const ProgrammesWithFieldResearchService = new ProgrammesWithFieldResearchServices()
