import {v2 as cloudinary} from 'cloudinary'
import { ApiError } from './api-error.js'
import fs from 'fs'

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        
        if (!localFilePath){
            throw new ApiError(400, "localFile path not provided")
        }

        if (!fs.existsSync(localFilePath)){
            throw new ApiError(400,"file not found at given path")
        }

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : 'auto'
        })
        
        if (!response){
            throw new ApiError(500,"couldn't upload on cloudinary")
        }

        fs.unlinkSync(localFilePath)
        return response


    } catch (error) {

        fs.unlinkSync(localFilePath)
        if (error instanceof ApiError){
            throw error
        }
        throw new ApiError(500,`error on uploading to cloudinary - ${error}`)
    }
}


const deleteFromCloudinary = async (url)=>{
    try {

        if (!url){
            throw new ApiError(400, "No url provided")
        }

        const publicId = url.split('/')[7]?.split('.')[0]
        if (!publicId){
            throw new ApiError(400, "Wrong url sent")
        }

        const response = await cloudinary.uploader.destroy(publicId)
        if (response.result === 'not found'){
            throw new ApiError(404,"resource not found or already deleted")
        }
        return
        
    } catch (error) {

        if (error instanceof ApiError){
            throw error
        }
        throw new ApiError(500,`error on deleting from cloudinary - ${error}`)
    }
}

export{
    uploadOnCloudinary,
    deleteFromCloudinary
}