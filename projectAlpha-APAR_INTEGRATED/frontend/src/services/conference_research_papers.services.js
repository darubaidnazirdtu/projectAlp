import {Api} from '../api/Api.js'

class ConferenceResearchPapersServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getConferenceResearchPapersDetails(){
        try {

            const response = await this.api.get("/conference_research_papers/get")            
            return response
            
        } catch (error) {
            console.log("Error getting conference research papers details")
            throw error
        }
    }

    async createConferenceResearchPapers(data, headers = {}){
        try {

            const response = await this.api.post("/conference_research_papers/set", data, headers)
            return response

        } catch (error) {
            console.log("Error creating conference research papers")
            throw error
        }
    }
    

    async updateConferenceResearchPapers(id, data, headers = {}) {
        const response = await this.api.put(`/conference_research_papers/update/${id}`, data, headers)
        return response
    }

    async deleteConferenceResearchPapers(id) {
        const response = await this.api.delete(`/conference_research_papers/delete/${id}`)
        return response
    }

    async getConferenceResearchPapersById(id) {
        const response = await this.api.get(`/conference_research_papers/get/${id}`)
        return response
    }
}

export const ConferenceResearchPapersService = new ConferenceResearchPapersServices();