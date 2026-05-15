import {Api} from '../api/Api.js'

class PatentsServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getPatentsDetails(){
        try {

            const response = await this.api.get("/patents/get")            
            return response
            
        } catch (error) {
            console.log("Error getting patents details")
            throw error
        }
    }

    async createPatents(data, headers = {}){
        try {
            const response = await this.api.post("/patents/set", data, headers)
            return response

        } catch (error) {
            console.log("Error creating patents")
            throw error
        }
    }
    

    async updatePatents(id, data, headers = {}) {
        const response = await this.api.put(`/patents/update/${id}`, data, headers)
        return response
    }

    async deletePatents(id) {
        const response = await this.api.delete(`/patents/delete/${id}`)
        return response
    }

    async getPatentsById(id) {
        const response = await this.api.get(`/patents/get/${id}`)
        return response
    }
}

export const PatentsService = new PatentsServices();