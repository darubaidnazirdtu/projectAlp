import {Api} from '../api/Api.js'

class AwardServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getAwards(){
        try {
            const response = await this.api.get("/research_innovation_awards/get")            
            return response
        } catch (error) {
            console.log("Error getting awards details")
            throw error
        }
    }

    async createAward(data, file){
        try {
            const formData = new FormData();
            for (const key in data) {
                formData.append(key, data[key]);
            }
            if (file) {
                formData.append('doc', file);
            }
            const response = await this.api.post("/research_innovation_awards/set", formData, { 'Content-Type': 'multipart/form-data' });
            return response;
        } catch (error) {
            console.log("Error creating award")
            throw error
        }
    }

    async updateAward(id, data, headers = {}) {
        const response = await this.api.put(`/research_innovation_awards/update/${id}`, data, headers)
        return response
    }

    async deleteAward(id) {
        const response = await this.api.delete(`/research_innovation_awards/delete/${id}`)
        return response
    }

    async getAwardById(id) {
        const response = await this.api.get(`/research_innovation_awards/get/${id}`)
        return response
    }
}

export const AwardService = new AwardServices();
