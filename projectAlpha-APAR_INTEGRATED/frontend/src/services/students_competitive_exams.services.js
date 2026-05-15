import { Api } from '../api/Api.js'

class StudentsCompetitiveExamsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStudentsCompetitiveExams() {
    const response = await this.api.get('/students_competitive_exams/get')
    return response
  }

  async createStudentsCompetitiveExams(data, headers = {}) {
    const response = await this.api.post('/students_competitive_exams/set', data, headers)
    return response
  }

    async updateStudentsCompetitiveExams(id, data, headers = {}) {
        const response = await this.api.put(`/students_competitive_exams/update/${id}`, data, headers)
        return response
    }

    async deleteStudentsCompetitiveExams(id) {
        const response = await this.api.delete(`/students_competitive_exams/delete/${id}`)
        return response
    }

    async getStudentsCompetitiveExamsById(id) {
        const response = await this.api.get(`/students_competitive_exams/get/${id}`)
        return response
    }
}

export const StudentsCompetitiveExamsService = new StudentsCompetitiveExamsServices()
