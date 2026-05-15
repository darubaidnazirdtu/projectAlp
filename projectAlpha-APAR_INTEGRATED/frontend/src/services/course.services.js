import {Api} from '../api/Api.js'

class CourseServices{

    constructor(){
        this.api = new Api(import.meta.env.VITE_BASEURL)
    }

    async getCourses(){
        try {

            const response = await this.api.get("/courses/get")            
            return response
            
        } catch (error) {
            console.log("Error getting courses details")
            throw error
        }
    }

    async createCourse(data){
        try {
            
            const response = await this.api.post("/courses/set", data)
            return response

        } catch (error) {
            console.log("Error creating course")
            throw error
        }
    }
    

    async updateCourse(id, data, headers = {}) {
        const response = await this.api.put(`/courses/update/${id}`, data, headers)
        return response
    }

    async deleteCourse(id) {
        const response = await this.api.delete(`/courses/delete/${id}`)
        return response
    }

    async getCourseById(id) {
        const response = await this.api.get(`/courses/get/${id}`)
        return response
    }
}

export const CourseService = new CourseServices();
