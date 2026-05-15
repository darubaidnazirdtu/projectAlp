import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByDepartmentId, update, deleteDepartment } from "../data-access/departments.data-access.js"


const enterData = asyncHandler(async (req, res) => {

    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["recognitions"].forEach(field => {
        if (typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                // console.error(`Failed to parse ${field}: `, error);
                data[field] = [];
            }
        }
    });


    // Parse recognitions if it's a string (e.g. from FormData)
    if (typeof data.recognitions === 'string') {
        try {
            data.recognitions = JSON.parse(data.recognitions);
        } catch (error) {
            data.recognitions = [];
        }
    }

    // Validation based on tableConfig required fields
    const requiredFields = ['department_id', 'department_name', 'head_of_department', 'contact_email', 'contact_phone'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    await set(data, loggedInUser)


    res.status(200)
        .json(
            new ApiResponse(200, {}, "data entry done successfully !")
        )
})


const getData = asyncHandler(async (req, res) => {

    const response = await get()

    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )

})

const updateData = asyncHandler(async (req, res) => {
    const { id } = req.params
    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["recognitions"].forEach(field => {
        if (typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                // console.error(`Failed to parse ${field}: `, error);
                data[field] = [];
            }
        }
    });

    if (!id) {
        throw new ApiError(400, "id is required")
    }
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }
    const result = await update(id, data, loggedInUser)
    res.status(200)
        .json(
            new ApiResponse(200, result, "data updated successfully !")
        )
})

const deleteData = asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "id is required")
    }
    await deleteDepartment(id)
    res.status(200)
        .json(
            new ApiResponse(200, {}, "data deleted successfully !")
        )
})

const getById = asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "id is required")
    }
    const response = await getByDepartmentId(id)
    if (!response) {
        throw new ApiError(404, "record not found")
    }
    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

export {
    enterData,
    getData,
    updateData,
    deleteData,
    getById
}