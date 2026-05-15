import { Api } from '../api/Api.js'

class ResearchFundingServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getResearchFunding() {
    const response = await this.api.get('/research_funding/get')
    return response
  }

  async createResearchFunding(data, headers = {}) {
    const response = await this.api.post('/research_funding/set', data, headers)
    return response
  }

    async updateResearchFunding(id, data, headers = {}) {
        const response = await this.api.put(`/research_funding/update/${id}`, data, headers)
        return response
    }

    async deleteResearchFunding(id) {
        const response = await this.api.delete(`/research_funding/delete/${id}`)
        return response
    }

    async getResearchFundingById(id) {
        const response = await this.api.get(`/research_funding/get/${id}`)
        return response
    }
}

export const ResearchFundingService = new ResearchFundingServices()
