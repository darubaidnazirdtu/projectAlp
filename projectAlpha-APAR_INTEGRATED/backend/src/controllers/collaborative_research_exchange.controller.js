import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByCollaborationId, getByDepartmentId, update, deleteExchange } from "../data-access/collaborative_research_exchange.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Extract logged-in user information for role-based saving
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    if (typeof data.faculty_associations === 'string') {
        try {
            data.faculty_associations = JSON.parse(data.faculty_associations);
        } catch (error) {
            data.faculty_associations = [];
        }
    }

    if (typeof data.student_associations === 'string') {
        try {
            data.student_associations = JSON.parse(data.student_associations);
        } catch (error) {
            data.student_associations = [];
        }
    }

    // Validation based on tableConfig required fields
    const requiredFields = ['department_id', 'type_of_activity', 'name_of_institution', 'level', 'start_date', 'academic_year', 'year', 'nature_of_collaboration'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle PDF file upload
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        data.link = doc.url
    }

    await set(data, loggedInUser)

    res.status(200)
        .json(
            new ApiResponse(200, {}, "data entry done successfully !")
        )
})

const getData = asyncHandler(async (req, res) => {
    const { role, departmentId } = req.user || {};
    let response;
    if (role === 'Department HOD' && departmentId) {
        response = await getByDepartmentId(departmentId);
    } else {
        response = await get();
    }

    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

const updateData = asyncHandler(async (req, res) => {
    const { id } = req.params
    const data = req.body
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
    await deleteExchange(id)
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
    const response = await getByCollaborationId(id)
    if (!response) {
        throw new ApiError(404, "record not found")
    }
    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

const getByDepartment = asyncHandler(async (req, res) => {
    const { department_id } = req.params
    if (!department_id) {
        throw new ApiError(400, "department_id is required")
    }
    const response = await getByDepartmentId(department_id)
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
    getById,
    getByDepartment
}