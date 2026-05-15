import { Api } from '../api/Api.js'

class FacultyDevelopmentProgramsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getFacultyDevelopmentPrograms() {
    const response = await this.api.get('/faculty_development_programs/get')
    return response
  }

  async createFacultyDevelopmentPrograms(data, headers = {}) {
    const response = await this.api.post('/faculty_development_programs/set', data, headers)
    return response
  }

    async updateFacultyDevelopmentPrograms(id, data, headers = {}) {
        const response = await this.api.put(`/faculty_development_programs/update/${id}`, data, headers)
        return response
    }

    async deleteFacultyDevelopmentPrograms(id) {
        const response = await this.api.delete(`/faculty_development_programs/delete/${id}`)
        return response
    }

    async getFacultyDevelopmentProgramsById(id) {
        const response = await this.api.get(`/faculty_development_programs/get/${id}`)
        return response
    }
}

export const FacultyDevelopmentProgramsService = new FacultyDevelopmentProgramsServices()
