import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByProgrammeId, getByDepartmentId, update, deleteProgramme } from "../data-access/programmes_with_field_research.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Validation based on tableConfig required fields
    const requiredFields = ['programme_name', 'programme_code', 'department_id', 'component_name'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
    // FormData sends booleans as strings "true"/"false", so check for undefined/null
    if (data.has_field_research_component === undefined || data.has_field_research_component === null) {
        throw new ApiError(400, 'Missing required field: has_field_research_component');
    }
    // Convert string boolean to actual boolean for FormData submissions
    if (typeof data.has_field_research_component === 'string') {
        data.has_field_research_component = data.has_field_research_component.toLowerCase() === 'true';
    }

    // Handle PDF file upload
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        data.link = doc.url
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
    await deleteProgramme(id)
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
    const response = await getByProgrammeId(id)
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