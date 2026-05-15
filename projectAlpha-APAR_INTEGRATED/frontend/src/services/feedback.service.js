import { Api } from '../api/Api.js';

class FeedbackService {
    constructor() {
        this.api = new Api(import.meta.env.VITE_BASEURL);
    }

    async analyzeFacultyFeedback(file) {
        const formData = new FormData();
        formData.append('file', file);

        // We use axios directly or need to handle multipart/form-data with the existing Api wrapper 
        // The Api wrapper might assume JSON. Let's check Api.js wrapper again or just use the client.
        // Looking at Api.js, `post` takes `data` and optional `headers`.
        // It uses `this.client.post`. If we pass FormData, Axios usually handles it, 
        // but we should manually set Content-Type to multipart/form-data or let Axios detect it (by sending FormData, browser/axios does it).
        // However, the Api class constructor sets 'Content-Type': 'application/json' in defaults.
        // We should override it.

        return this.api.post('/feedback/analyze/faculty', formData, {
            'Content-Type': 'multipart/form-data'
        });
    }

    async analyzeCourseFeedback(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post('/feedback/analyze/course', formData, {
            'Content-Type': 'multipart/form-data'
        });
    }

    async analyzeProgramFeedback(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post('/feedback/analyze/program', formData, {
            'Content-Type': 'multipart/form-data'
        });
    }
}

export const feedbackService = new FeedbackService();
