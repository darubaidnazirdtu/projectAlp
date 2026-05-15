import {Api} from '../api/Api.js'

class ProgrammesServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getProgrammes(){
        try {

            const response = await this.api.get("/programmes/get")            
            return response
            
        } catch (error) {
            console.log("Error getting programmes details")
            throw error
        }
    }

    async createProgramme(data){
        try {
            
            const response = await this.api.post("/programmes/set", data)
            return response

        } catch (error) {
            console.log("Error creating programme")
            throw error
        }
    }
    

    async updateProgramme(id, data, headers = {}) {
        const response = await this.api.put(`/programmes/update/${id}`, data, headers)
        return response
    }

    async deleteProgramme(id) {
        const response = await this.api.delete(`/programmes/delete/${id}`)
        return response
    }

    async getProgrammeById(id) {
        const response = await this.api.get(`/programmes/get/${id}`)
        return response
    }

    async updateProgrammes(id, data, headers = {}) {
        const response = await this.api.put(`/programmes/update/${id}`, data, headers)
        return response
    }

    async deleteProgrammes(id) {
        const response = await this.api.delete(`/programmes/delete/${id}`)
        return response
    }

    async getProgrammesById(id) {
        const response = await this.api.get(`/programmes/get/${id}`)
        return response
    }
}

export const ProgrammesService = new ProgrammesServices();
