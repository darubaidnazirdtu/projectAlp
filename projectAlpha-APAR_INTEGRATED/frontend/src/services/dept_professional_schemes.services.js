import { Api } from '../api/Api.js'

class DeptProfessionalSchemesServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getDeptProfessionalSchemes() {
    const response = await this.api.get('/dept_professional_schemes/get')
    return response
  }

  async createDeptProfessionalSchemes(data, headers = {}) {
    const response = await this.api.post('/dept_professional_schemes/set', data, headers)
    return response
  }

    async updateDeptProfessionalSchemes(id, data, headers = {}) {
        const response = await this.api.put(`/dept_professional_schemes/update/${id}`, data, headers)
        return response
    }

    async deleteDeptProfessionalSchemes(id) {
        const response = await this.api.delete(`/dept_professional_schemes/delete/${id}`)
        return response
    }

    async getDeptProfessionalSchemesById(id) {
        const response = await this.api.get(`/dept_professional_schemes/get/${id}`)
        return response
    }
}

export const DeptProfessionalSchemesService = new DeptProfessionalSchemesServices()
