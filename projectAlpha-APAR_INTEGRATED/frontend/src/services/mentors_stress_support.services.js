import { Api } from '../api/Api.js'

class MentorsStressSupportServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getMentorsStressSupport() {
    const response = await this.api.get('/mentors_stress_support/get')
    return response
  }

  async createMentorsStressSupport(data, headers = {}) {
    const response = await this.api.post('/mentors_stress_support/set', data, headers)
    return response
  }

    async updateMentorsStressSupport(id, data, headers = {}) {
        const response = await this.api.put(`/mentors_stress_support/update/${id}`, data, headers)
        return response
    }

    async deleteMentorsStressSupport(id) {
        const response = await this.api.delete(`/mentors_stress_support/delete/${id}`)
        return response
    }

    async getMentorsStressSupportById(id) {
        const response = await this.api.get(`/mentors_stress_support/get/${id}`)
        return response
    }
}

export const MentorsStressSupportService = new MentorsStressSupportServices()
