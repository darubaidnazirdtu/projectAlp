import { Api } from '../api/Api.js'

class AparFormGradedServices {
    constructor() {
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async submit(form) {
        // legacy support or redirect?
        // We are moving to mongo, so we should use mongo endpoint.
        // But the argument `form` here was the legacy payload.
        // I will change the caller to pass the new structure.
        return await this.api.post('/apar/mongo/submit', form)
    }

    async saveDraft(form) {
        return await this.api.post('/apar/mongo/save', form)
    }

    async saveToMonthly(form) {
        return await this.api.post('/apar/mongo/save-to-monthly', form)
    }

    async getForm(faculty_id, ay) {
        return await this.api.get(`/apar/mongo/form?faculty_id=${faculty_id}&ay=${ay}`)
    }

    async getFacultyInfo() {
        return await this.api.get('/apar/mongo/info')
    }

    async listAllForms(ay) {
        return await this.api.get(`/apar/mongo/list?ay=${encodeURIComponent(ay)}`)
    }

    async getHistory() {
        return await this.api.get('/apar/mongo/history');
    }

    async checkDuplicate(entity_type, faculty_id, ay, data) {
        return await this.api.post('/apar/mongo/check-duplicate', {
            entity_type,
            faculty_id,
            ay,
            data
        });
    }
}


export const AparFormGradedService = new AparFormGradedServices()
