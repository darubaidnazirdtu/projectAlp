import { Api } from '../api/Api.js'

class ProfessionalAffiliationsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getProfessionalAffiliations() {
    const response = await this.api.get('/professional_affiliations/get')
    return response
  }

  async createProfessionalAffiliations(data, headers = {}) {
    const response = await this.api.post('/professional_affiliations/set', data, headers)
    return response
  }

    async updateProfessionalAffiliations(id, data, headers = {}) {
        const response = await this.api.put(`/professional_affiliations/update/${id}`, data, headers)
        return response
    }

    async deleteProfessionalAffiliations(id) {
        const response = await this.api.delete(`/professional_affiliations/delete/${id}`)
        return response
    }

    async getProfessionalAffiliationsById(id) {
        const response = await this.api.get(`/professional_affiliations/get/${id}`)
        return response
    }
}

export const ProfessionalAffiliationsService = new ProfessionalAffiliationsServices()
