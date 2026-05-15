import { Api } from '../api/Api.js'

class TeachersUsingIctServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getTeachersUsingIct() {
    const response = await this.api.get('/teachers_using_ict/get')
    return response
  }

  async createTeachersUsingIct(data, headers = {}) {
    const response = await this.api.post('/teachers_using_ict/set', data, headers)
    return response
  }

    async updateTeachersUsingIct(id, data, headers = {}) {
        const response = await this.api.put(`/teachers_using_ict/update/${id}`, data, headers)
        return response
    }

    async deleteTeachersUsingIct(id) {
        const response = await this.api.delete(`/teachers_using_ict/delete/${id}`)
        return response
    }

    async getTeachersUsingIctById(id) {
        const response = await this.api.get(`/teachers_using_ict/get/${id}`)
        return response
    }
}

export const TeachersUsingIctService = new TeachersUsingIctServices()
