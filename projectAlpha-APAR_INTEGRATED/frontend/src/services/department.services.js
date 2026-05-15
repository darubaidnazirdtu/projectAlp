import { Api } from '../api/Api.js'

class DepartmentServices {

    constructor() {
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getDepartments() {
        try {

            const response = await this.api.get("/departments/get")
            return response

        } catch (error) {
            console.log("Error getting departments details")
            throw error
        }
    }

    async createDepartment(data) {
        try {

            const response = await this.api.post("/departments/set", data)
            return response

        } catch (error) {
            console.log("Error creating department")
            throw error
        }
    }

    async updateDepartment(id, data) {
        try {
            const response = await this.api.put(`/departments/update/${id}`, data)
            return response
        } catch (error) {
            console.log("Error updating department")
            throw error
        }
    }

    async deleteDepartment(id) {
        try {
            const response = await this.api.delete(`/departments/delete/${id}`)
            return response
        } catch (error) {
            console.log("Error deleting department")
            throw error
        }
    }

    async getDepartmentById(id) {
        try {
            const response = await this.api.get(`/departments/get/${id}`)
            return response
        } catch (error) {
            console.log("Error getting department by id")
            throw error
        }
    }

}

export const DepartmentService = new DepartmentServices();
