import {Api} from '../api/Api.js'

class PhdDefenceServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getPhdDefences(){
        try {

            const response = await this.api.get("/phd_defence/get")
            return response
            
        } catch (error) {
            console.log("Error getting PhD defence details")
            throw error
        }
    }

    async createPhdDefence(data, headers = {}){
        try {

            const response = await this.api.post("/phd_defence/set", data, headers)
            return response

        } catch (error) {
            console.log("Error creating PhD defence")
            throw error
        }
    }
    

    async updatePhdDefence(id, data, headers = {}) {
        const response = await this.api.put(`/phd_defence/update/${id}`, data, headers)
        return response
    }

    async deletePhdDefence(id) {
        const response = await this.api.delete(`/phd_defence/delete/${id}`)
        return response
    }

    async getPhdDefenceById(id) {
        const response = await this.api.get(`/phd_defence/get/${id}`)
        return response
    }
}

export const PhdDefenceService = new PhdDefenceServices();