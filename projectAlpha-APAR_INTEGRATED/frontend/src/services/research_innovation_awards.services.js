import {Api} from '../api/Api.js'

class ResearchInnovationAwardsServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getAwards(){
        try {
            const response = await this.api.get("/research_innovation_awards/get")            
            return response
        } catch (error) {
            console.log("Error getting research innovation awards details")
            throw error
        }
    }

    async createAward(data, headers = {}){
        try {
            // data is already a FormData object here
            const response = await this.api.post("/research_innovation_awards/set", data, headers);
            return response;
        } catch (error) {
            console.log("Error creating research innovation award")
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

    async updateResearchInnovationAwards(id, data, headers = {}) {
        const response = await this.api.put(`/research_innovation_awards/update/${id}`, data, headers)
        return response
    }

    async deleteResearchInnovationAwards(id) {
        const response = await this.api.delete(`/research_innovation_awards/delete/${id}`)
        return response
    }

    async getResearchInnovationAwardsById(id) {
        const response = await this.api.get(`/research_innovation_awards/get/${id}`)
        return response
    }
}

export const ResearchInnovationAwardsService = new ResearchInnovationAwardsServices();