import {Api} from '../api/Api.js'

class DeptLibraryBooksServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getDeptLibraryBooksDetails(){
        try {

            const response = await this.api.get("/dept_library_books/get")            
            return response

        } catch (error) {
            console.log("Error getting department library books details")
            throw error
        }
    }

    async createDeptLibraryBooks(data, headers = {}){
        try {

            const response = await this.api.post("/dept_library_books/set", data, headers)
            return response

        } catch (error) {
            console.log("Error creating department library books")
            throw error
        }
    }


    async updateDeptLibraryBooks(id, data, headers = {}) {
        const response = await this.api.put(`/dept_library_books/update/${id}`, data, headers)
        return response
    }

    async deleteDeptLibraryBooks(id) {
        const response = await this.api.delete(`/dept_library_books/delete/${id}`)
        return response
    }

    async getDeptLibraryBooksById(id) {
        const response = await this.api.get(`/dept_library_books/get/${id}`)
        return response
    }
}

export const DeptLibraryBooksService = new DeptLibraryBooksServices();