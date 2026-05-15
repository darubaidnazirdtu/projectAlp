import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByEcontentId, getByDepartmentId, getByFacultyId, update, deleteEcontent } from "../data-access/e_content_developed.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Extract logged-in user information for role-based saving
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    // Validation based on tableConfig required fields
    const requiredFields = ['faculty_id', 'department_id', 'course_id', 'name_of_module', 'type_of_content', 'platform', 'platform_type', 'date_of_launching', 'academic_year', 'semester', 'target_audience', 'learning_outcome'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle Link (replaced PDF upload)
    let link = data.link;

    // Backward compatibility or if file is still sent somehow (though config changed to JSON)
    if (req.file?.path) {
        const docLocalPath = req.file.path
        const doc = await uploadOnCloudinary(docLocalPath)
        link = doc.url
    }

    // Link is optional now

    data.link = link

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
    await deleteEcontent(id)
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
    const response = await getByEcontentId(id)
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