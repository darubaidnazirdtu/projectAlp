import {Api} from '../api/Api.js'

class FacultyServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getFacultyDetails(){
        try {

            const response = await this.api.get("/faculty/get")            
            return response
            
        } catch (error) {
            console.log("Error getting faculty details")
            throw error
        }
    }

    async createFaculty(data){
        try {
            
            const response = await this.api.post("/faculty/set", data)
            return response

        } catch (error) {
            console.log("Error creating faculty")
            throw error
        }
    }
    

    async updateFaculty(id, data, headers = {}) {
        const response = await this.api.put(`/faculty/update/${id}`, data, headers)
        return response
    }

    async deleteFaculty(id) {
        const response = await this.api.delete(`/faculty/delete/${id}`)
        return response
    }

    async getFacultyById(id) {
        const response = await this.api.get(`/faculty/get/${id}`)
        return response
    }
}

export const FacultyService = new FacultyServices();