import { Api } from '../api/Api.js'

class AparFormReportingService {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async submit(form) {
    return this.api.post('/apar/mongo/reporting/submit', form) // Sending flattened body
  }

  async getAssigned(ay, archive = false) {
    let endpoint = `/apar/mongo/reporting/pending?archive=${archive}`
    if (ay) endpoint += `&ay=${encodeURIComponent(ay)}`
    return this.api.get(endpoint)
  }

  async getPendingReviews(ay, archive = false) {
    let endpoint = `/apar/mongo/reviewing/pending?archive=${archive}`
    if (ay) endpoint += `&ay=${encodeURIComponent(ay)}`
    return this.api.get(endpoint)
  }

  async submitReview(form) {
    return this.api.post('/apar/mongo/reviewing/submit', form)
  }

  async getForm(facultyId, ay) {
    return this.api.get(`/apar/mongo/form?faculty_id=${encodeURIComponent(facultyId)}&ay=${encodeURIComponent(ay)}`)
  }

  async getCombined(gradedId, ay) {
    if (!gradedId || !ay) throw new Error('gradedId and ay are required')
    return this.getForm(gradedId, ay)
  }
}

export const aparFormReportingService = new AparFormReportingService()
