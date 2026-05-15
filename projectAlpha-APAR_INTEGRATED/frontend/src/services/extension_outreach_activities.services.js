import { Api } from '../api/Api.js'

class ExtensionOutreachActivitiesServices {

  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getExtensionOutreachActivities() {
    const response = await this.api.get('/extension_outreach_activities/get')
    return response
  }

  async createExtensionOutreachActivities(data, headers = {}) {
    const response = await this.api.post('/extension_outreach_activities/set', data, headers)
    return response
  }

    async updateExtensionOutreachActivities(id, data, headers = {}) {
        const response = await this.api.put(`/extension_outreach_activities/update/${id}`, data, headers)
        return response
    }

    async deleteExtensionOutreachActivities(id) {
        const response = await this.api.delete(`/extension_outreach_activities/delete/${id}`)
        return response
    }

    async getExtensionOutreachActivitiesById(id) {
        const response = await this.api.get(`/extension_outreach_activities/get/${id}`)
        return response
    }
}

export const ExtensionOutreachActivitiesService = new ExtensionOutreachActivitiesServices();
