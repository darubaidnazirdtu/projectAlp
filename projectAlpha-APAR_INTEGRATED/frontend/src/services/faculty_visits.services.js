import { Api } from '../api/Api.js'

class FacultyVisitsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getFacultyVisits() {
    const response = await this.api.get('/faculty_visits/get')
    return response
  }

  async createFacultyVisits(data, headers = {}) {
    const response = await this.api.post('/faculty_visits/set', data, headers)
    return response
  }

    async updateFacultyVisits(id, data, headers = {}) {
        const response = await this.api.put(`/faculty_visits/update/${id}`, data, headers)
        return response
    }

    async deleteFacultyVisits(id) {
        const response = await this.api.delete(`/faculty_visits/delete/${id}`)
        return response
    }

    async getFacultyVisitsById(id) {
        const response = await this.api.get(`/faculty_visits/get/${id}`)
        return response
    }
}

export const FacultyVisitsService = new FacultyVisitsServices();
