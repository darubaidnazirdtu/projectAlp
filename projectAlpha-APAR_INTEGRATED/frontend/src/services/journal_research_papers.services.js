import {Api} from '../api/Api.js'

class JournalResearchPapersServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getJournalResearchPapersDetails(){
        try {

            const response = await this.api.get("/journal_research_papers/get")            
            return response
            
        } catch (error) {
            console.log("Error getting journal research papers details")
            throw error
        }
    }

    async createJournalResearchPapers(data, headers = {}){
        try {
            const response = await this.api.post("/journal_research_papers/set", data, headers)
            return response

        } catch (error) {
            console.log("Error creating journal research papers")
            throw error
        }
    }
    

    async updateJournalResearchPapers(id, data, headers = {}) {
        const response = await this.api.put(`/journal_research_papers/update/${id}`, data, headers)
        return response
    }

    async deleteJournalResearchPapers(id) {
        const response = await this.api.delete(`/journal_research_papers/delete/${id}`)
        return response
    }

    async getJournalResearchPapersById(id) {
        const response = await this.api.get(`/journal_research_papers/get/${id}`)
        return response
    }
}

export const JournalResearchPaperService = new JournalResearchPapersServices();