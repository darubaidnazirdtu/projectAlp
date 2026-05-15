import {Api} from '../api/Api.js'

class StudentServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getStudentDetails(){
        try {

            const response = await this.api.get("/students/get")            
            return response
            
        } catch (error) {
            console.log("Error getting student details")
            throw error
        }
    }

    async createStudent(data){
        try {
            
            const response = await this.api.post("/students/set", data)
            return response

        } catch (error) {
            console.log("Error creating student")
            throw error
        }
    }
    

    async updateStudent(id, data, headers = {}) {
        const response = await this.api.put(`/students/update/${id}`, data, headers)
        return response
    }

    async deleteStudent(id) {
        const response = await this.api.delete(`/students/delete/${id}`)
        return response
    }

    async getStudentById(id) {
        const response = await this.api.get(`/students/get/${id}`)
        return response
    }
}

export const StudentService = new StudentServices();