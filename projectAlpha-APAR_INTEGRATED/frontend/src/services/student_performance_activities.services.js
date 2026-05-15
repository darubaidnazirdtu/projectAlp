import { Api } from '../api/Api.js'

class StudentPerformanceActivitiesServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getStudentPerformanceActivities() {
    const response = await this.api.get('/student_performance_activities/get')
    return response
  }

  async createStudentPerformanceActivities(data, headers = {}) {
    const response = await this.api.post('/student_performance_activities/set', data, headers)
    return response
  }

    async updateStudentPerformanceActivities(id, data, headers = {}) {
        const response = await this.api.put(`/student_performance_activities/update/${id}`, data, headers)
        return response
    }

    async deleteStudentPerformanceActivities(id) {
        const response = await this.api.delete(`/student_performance_activities/delete/${id}`)
        return response
    }

    async getStudentPerformanceActivitiesById(id) {
        const response = await this.api.get(`/student_performance_activities/get/${id}`)
        return response
    }
}

export const StudentPerformanceActivitiesService = new StudentPerformanceActivitiesServices()
