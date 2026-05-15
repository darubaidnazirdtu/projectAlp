import { Api } from '../api/Api.js'

class CollaborativeResearchExchangeServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getCollaborativeResearchExchange() {
    const response = await this.api.get('/collaborative_research_exchange/get')
    return response
  }

  async createCollaborativeResearchExchange(data, headers = {}) {
    const response = await this.api.post('/collaborative_research_exchange/set', data, headers)
    return response
  }

    async updateCollaborativeResearchExchange(id, data, headers = {}) {
        const response = await this.api.put(`/collaborative_research_exchange/update/${id}`, data, headers)
        return response
    }

    async deleteCollaborativeResearchExchange(id) {
        const response = await this.api.delete(`/collaborative_research_exchange/delete/${id}`)
        return response
    }

    async getCollaborativeResearchExchangeById(id) {
        const response = await this.api.get(`/collaborative_research_exchange/get/${id}`)
        return response
    }
}

export const CollaborativeResearchExchangeService = new CollaborativeResearchExchangeServices()
