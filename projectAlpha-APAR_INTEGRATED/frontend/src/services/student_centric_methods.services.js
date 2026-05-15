import { Api } from '../api/Api.js'

class StudentCentricMethodsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStudentCentricMethods() {
    const response = await this.api.get('/student_centric_method/get')
    return response
  }

  async createStudentCentricMethods(data, headers = {}) {
    const response = await this.api.post('/student_centric_method/set', data, headers)
    return response
  }

    async updateStudentCentricMethods(id, data, headers = {}) {
        const response = await this.api.put(`/student_centric_method/update/${id}`, data, headers)
        return response
    }

    async deleteStudentCentricMethods(id) {
        const response = await this.api.delete(`/student_centric_method/delete/${id}`)
        return response
    }

    async getStudentCentricMethodsById(id) {
        const response = await this.api.get(`/student_centric_method/get/${id}`)
        return response
    }
}

export const StudentCentricMethodsService = new StudentCentricMethodsServices()
