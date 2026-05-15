import { Api } from '../api/Api.js'

class StaffTrainingServices {

  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStaffTraining() {
    const response = await this.api.get('/staff_training/get')
    return response
  }

  async createStaffTraining(data, headers = {}) {
    const response = await this.api.post('/staff_training/set', data, headers)
    return response
  }

    async updateStaffTraining(id, data, headers = {}) {
        const response = await this.api.put(`/staff_training/update/${id}`, data, headers)
        return response
    }

    async deleteStaffTraining(id) {
        const response = await this.api.delete(`/staff_training/delete/${id}`)
        return response
    }

    async getStaffTrainingById(id) {
        const response = await this.api.get(`/staff_training/get/${id}`)
        return response
    }
}

export const StaffTrainingService = new StaffTrainingServices()
