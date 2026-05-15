import { Api } from '../api/Api.js'

class StudentsHigherEducationServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStudentsHigherEducation() {
    const response = await this.api.get('/students_higher_education/get')
    return response
  }

  async createStudentsHigherEducation(data, headers = {}) {
    const response = await this.api.post('/students_higher_education/set', data, headers)
    return response
  }

    async updateStudentsHigherEducation(id, data, headers = {}) {
        const response = await this.api.put(`/students_higher_education/update/${id}`, data, headers)
        return response
    }

    async deleteStudentsHigherEducation(id) {
        const response = await this.api.delete(`/students_higher_education/delete/${id}`)
        return response
    }

    async getStudentsHigherEducationById(id) {
        const response = await this.api.get(`/students_higher_education/get/${id}`)
        return response
    }
}

export const StudentsHigherEducationService = new StudentsHigherEducationServices()
