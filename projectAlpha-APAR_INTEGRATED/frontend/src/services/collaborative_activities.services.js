import {Api} from '../api/Api.js'

class CollaborativeActivitiesServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getCollaborations(){
        try {
            const response = await this.api.get("/collaborative_activities/get")            
            return response
        } catch (error) {
            console.log("Error getting collaborations details")
            throw error
        }
    }

    async createCollaboration(data, file){
        try {
            const formData = new FormData();
            for (const key in data) {
                const value = data[key];
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            }
            if (file) {
                formData.append('doc', file);
            }
            const response = await this.api.post("/collaborative_activities/set", formData, { 'Content-Type': 'multipart/form-data' });
            return response;
        } catch (error) {
            console.log("Error creating collaboration")
            throw error
        }
    }

    async updateCollaboration(id, data, headers = {}) {
        const response = await this.api.put(`/collaborative_activities/update/${id}`, data, headers)
        return response
    }

    async deleteCollaboration(id) {
        const response = await this.api.delete(`/collaborative_activities/delete/${id}`)
        return response
    }

    async getCollaborationById(id) {
        const response = await this.api.get(`/collaborative_activities/get/${id}`)
        return response
    }

    async updateCollaborativeActivities(id, data, headers = {}) {
        const response = await this.api.put(`/collaborative_activities/update/${id}`, data, headers)
        return response
    }

    async deleteCollaborativeActivities(id) {
        const response = await this.api.delete(`/collaborative_activities/delete/${id}`)
        return response
    }

    async getCollaborativeActivitiesById(id) {
        const response = await this.api.get(`/collaborative_activities/get/${id}`)
        return response
    }
}

export const CollaborativeActivitiesService = new CollaborativeActivitiesServices();
