import { Api } from '../api/Api.js'

class ProfessionalTrainingStaffServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getProfessionalTrainingStaff() {
    const response = await this.api.get('/professional_training_staff/get')
    return response
  }

  async createProfessionalTrainingStaff(data, headers = {}) {
    const response = await this.api.post('/professional_training_staff/set', data, headers)
    return response
  }

    async updateProfessionalTrainingStaff(id, data, headers = {}) {
        const response = await this.api.put(`/professional_training_staff/update/${id}`, data, headers)
        return response
    }

    async deleteProfessionalTrainingStaff(id) {
        const response = await this.api.delete(`/professional_training_staff/delete/${id}`)
        return response
    }

    async getProfessionalTrainingStaffById(id) {
        const response = await this.api.get(`/professional_training_staff/get/${id}`)
        return response
    }
}

export const ProfessionalTrainingStaffService = new ProfessionalTrainingStaffServices()
