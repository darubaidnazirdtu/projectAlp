import { Api } from '../api/Api.js'

class StudentFinancialSupportEventsServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStudentFinancialSupportEvents() {
    const response = await this.api.get('/student_financial_support_events/get')
    return response
  }

  async createStudentFinancialSupportEvents(data, headers = {}) {
    const response = await this.api.post('/student_financial_support_events/set', data, headers)
    return response
  }

    async updateStudentFinancialSupportEvents(id, data, headers = {}) {
        const response = await this.api.put(`/student_financial_support_events/update/${id}`, data, headers)
        return response
    }

    async deleteStudentFinancialSupportEvents(id) {
        const response = await this.api.delete(`/student_financial_support_events/delete/${id}`)
        return response
    }

    async getStudentFinancialSupportEventsById(id) {
        const response = await this.api.get(`/student_financial_support_events/get/${id}`)
        return response
    }
}

export const StudentFinancialSupportEventsService = new StudentFinancialSupportEventsServices()
